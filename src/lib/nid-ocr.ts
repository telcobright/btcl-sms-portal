/**
 * NID OCR Utility
 * Extracts name, NID number, and date of birth from Bangladesh NID card images
 */

import Tesseract from 'tesseract.js';
import { parseNidText } from './nid-parse';

/** 0..1 per field where the engine reports one; null where it cannot (Tesseract). */
export interface NidFieldConfidence {
  name: number | null;
  nidNumber: number | null;
  dateOfBirth: number | null;
}

export interface NidOcrResult {
  success: boolean;
  data?: {
    name: string | null;
    nameBn?: string | null;
    nidNumber: string | null;
    dateOfBirth: string | null;
    nidDigitType: '10' | '17' | null;
  };
  /** How sure the engine was of each filled field, so the form can ask for a second look. */
  confidence?: NidFieldConfidence;
  rawText?: string;
  error?: string;
  /** Which engine produced the result: on-prem EasyOCR service or local Tesseract. */
  source?: 'easyocr' | 'tesseract' | 'vision';
}

/**
 * Smart NID extraction: try the server-side vision model first (robust to old/new
 * cards, glare, rotation, Bangla, 13-digit old-card numbers), and transparently
 * fall back to local Tesseract if the vision route is unavailable, not configured,
 * errors, or returns nothing usable. Drop-in replacement for extractNidData.
 */
export async function extractNidDataSmart(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<NidOcrResult> {
  // 1) Server-side vision model
  try {
    onProgress?.(10);
    const form = new FormData();
    form.append('file', imageFile);

    const res = await fetch('/api/nid-ocr', { method: 'POST', body: form });
    onProgress?.(70);

    if (res.ok) {
      const json = await res.json();
      // A usable result has at least the NID number, or name + DOB to verify with.
      const d = json?.data;
      const usable = json?.success && d && (d.nidNumber || (d.name && d.dateOfBirth));
      if (usable) {
        onProgress?.(100);
        const c = json.confidence ?? {};
        return {
          success: true,
          source: json.source || 'easyocr',
          data: {
            name: d.name ?? null,
            nameBn: d.nameBn ?? null,
            nidNumber: d.nidNumber ?? null,
            dateOfBirth: d.dateOfBirth ?? null,
            nidDigitType: d.nidDigitType ?? null,
          },
          confidence: {
            name: typeof c.name === 'number' ? c.name : null,
            nidNumber: typeof c.nidNumber === 'number' ? c.nidNumber : null,
            dateOfBirth: typeof c.dateOfBirth === 'number' ? c.dateOfBirth : null,
          },
        };
      }
      // success:false (not_configured / not_a_nid / low data) → fall through to Tesseract
      console.log('[nid-ocr] vision unusable, falling back to Tesseract:', json?.reason || json?.error);
    } else {
      console.log('[nid-ocr] vision route HTTP', res.status, '→ falling back to Tesseract');
    }
  } catch (e) {
    console.log('[nid-ocr] vision route threw → falling back to Tesseract:', e);
  }

  // 2) Local Tesseract fallback
  const fallback = await extractNidData(imageFile, onProgress);
  return { ...fallback, source: 'tesseract' };
}

/**
 * Process image through canvas to normalize it, fix metadata issues,
 * and apply preprocessing for better OCR accuracy
 */
function processImageThroughCanvas(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Apply contrast enhancement and binarization for better OCR
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            // Convert to grayscale
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            // Apply contrast stretch
            const contrast = 1.5;
            const adjusted = Math.min(255, Math.max(0, ((gray - 128) * contrast) + 128));
            // Apply threshold for binarization (Otsu-like simple threshold)
            const binary = adjusted > 140 ? 255 : 0;
            data[i] = binary;
            data[i + 1] = binary;
            data[i + 2] = binary;
          }

          ctx.putImageData(imageData, 0, 0);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = reader.result as string;
    };

    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Extract text from NID image using Tesseract OCR
 */
export async function extractNidData(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<NidOcrResult> {
  try {
    // Process image through canvas to normalize it and fix metadata issues
    // This helps with images that have problematic Exif data (e.g., width=0, height=0)
    console.log('Processing image:', imageFile.name, imageFile.type, imageFile.size);
    const imageDataUrl = await processImageThroughCanvas(imageFile);
    console.log('Image processed successfully, starting OCR...');

    // Perform OCR with English only (Bengali OCR is slow and less accurate for NID)
    const result = await Tesseract.recognize(imageDataUrl, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    const rawText = result.data.text;
    console.log('OCR Raw Text:', rawText);

    // Parse the extracted text
    const parsedData = parseNidText(rawText);

    return {
      success: true,
      data: parsedData,
      rawText: rawText,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OCR failed',
    };
  }
}

/**
 * Check if Tesseract worker is ready
 */
export async function preloadOcrWorker(): Promise<void> {
  try {
    // Preload the worker for faster subsequent OCR (English only, matching extractNidData)
    await Tesseract.createWorker('eng');
  } catch (error) {
    console.error('Failed to preload OCR worker:', error);
  }
}
