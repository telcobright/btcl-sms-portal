/**
 * NID OCR Utility
 * Extracts name, NID number, and date of birth from Bangladesh NID card images
 */

import Tesseract from 'tesseract.js';

export interface NidOcrResult {
  success: boolean;
  data?: {
    name: string | null;
    nidNumber: string | null;
    dateOfBirth: string | null;
    nidDigitType: '10' | '17' | null;
  };
  rawText?: string;
  error?: string;
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
 * Parse extracted text to find NID fields
 */
function parseNidText(text: string): NidOcrResult['data'] {
  let name: string | null = null;
  let nidNumber: string | null = null;
  let dateOfBirth: string | null = null;
  let nidDigitType: '10' | '17' | null = null;

  // Clean up text - remove extra spaces and normalize
  const fullText = text.replace(/\s+/g, ' ').trim();
  console.log('Full text for parsing:', fullText);

  // ===== EXTRACT NID NUMBER =====
  // NID is usually a 10-digit or 17-digit number
  // It may appear with spaces between digit groups (e.g., "421 296 4672")

  const nidLinePatterns = [
    // "nono. 421 296 4672" or "No. 421 296 4672"
    /(?:no+\.?|No\.?)[,\s]*(\d[\d\s]{8,20})/i,
    // "ID No: 1234567890" or "NID: 1234567890"
    /(?:ID|NID)\s*(?:No\.?)?[:\s]*(\d[\d\s]{8,20})/i,
    // Direct digit groups: "421 296 4672"
    /(\d{3,4}[\s.,]*\d{3,4}[\s.,]*\d{3,4})/,
    // Continuous 10 or 17 digit number
    /(\d{10,17})/,
    // After "worn" or similar OCR noise
    /worn[,.\s]*(?:no+\.?)?[,.\s]*(\d[\d\s]{8,20})/i,
  ];

  for (const pattern of nidLinePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      // Remove all non-digit characters
      const digits = match[1].replace(/\D/g, '');
      if (digits.length === 10 || digits.length === 17) {
        nidNumber = digits;
        nidDigitType = digits.length === 10 ? '10' : '17';
        console.log('Found NID:', nidNumber);
        break;
      }
    }
  }

  // If still not found, extract nearby digit groups (3-4 digits each) and try to combine them
  if (!nidNumber) {
    // Only combine groups of 3-4 digits (typical NID formatting), not arbitrary numbers
    const nidDigitGroups = fullText.match(/\b\d{3,4}\b/g);
    if (nidDigitGroups) {
      for (let i = 0; i < nidDigitGroups.length; i++) {
        let combined = nidDigitGroups[i];
        // Only combine up to 5 consecutive groups (max needed for 17 digits)
        for (let j = i + 1; j < Math.min(i + 5, nidDigitGroups.length) && combined.length < 17; j++) {
          combined += nidDigitGroups[j];
          if (combined.length === 10 || combined.length === 17) {
            nidNumber = combined;
            nidDigitType = combined.length === 10 ? '10' : '17';
            console.log('Found NID by combining:', nidNumber);
            break;
          }
        }
        if (nidNumber) break;
      }
    }
  }

  // ===== EXTRACT NAME =====
  // Strategy: Look for the text segment after "Name" keyword

  const excludeWords = new Set([
    'NATIONAL', 'ID', 'CARD', 'BANGLADESH', 'GOVERNMENT', 'REPUBLIC',
    'PEOPLES', 'DATE', 'BIRTH', 'OF', 'THE', 'AND', 'FOR', 'SET',
    'FRONT', 'BACK', 'SIDE', 'PIN', 'NO', 'NID', 'BLOOD',
  ]);

  // Find where "Name" appears and extract text after it
  const nameKeywordIndex = fullText.search(/\\?Name\b/i);
  if (nameKeywordIndex !== -1) {
    const textAfterName = fullText.substring(nameKeywordIndex).replace(/^\\?Name\s*/i, '');
    console.log('Text after Name keyword:', textAfterName.substring(0, 100));

    // Extract consecutive uppercase words (2+ chars each), supporting multi-word names
    const nameMatch = textAfterName.match(/(?:[A-Z][A-Z.]+\s*){2,}/);
    if (nameMatch) {
      // Split into words, filter out noise and single chars
      const words = nameMatch[0].trim().split(/\s+/)
        .filter(w => w.length >= 2 && !excludeWords.has(w.replace(/\./g, '')));
      if (words.length >= 2) {
        name = words.join(' ');
        console.log('Found Name (after keyword):', name);
      }
    }
  }

  // If not found, try finding consecutive uppercase words anywhere
  if (!name) {
    const allCapsMatches = fullText.match(/(?:[A-Z][A-Z.]+\s+){1,}[A-Z][A-Z.]+/g);
    if (allCapsMatches) {
      for (const candidate of allCapsMatches) {
        const words = candidate.trim().split(/\s+/)
          .filter(w => w.length >= 2 && !excludeWords.has(w.replace(/\./g, '')));
        if (words.length >= 2) {
          name = words.join(' ');
          console.log('Found Name (all caps scan):', name);
          break;
        }
      }
    }
  }

  // Fallback: Look for common Bangladeshi name patterns (supports MD., MST., multi-word)
  if (!name) {
    const bdNamePatterns = [
      /\b(MOHAMMAD?\s+(?:[A-Z]{2,}\s*)+)/i,
      /\b(MD\.?\s+(?:[A-Z]{2,}\s*)+)/i,
      /\b(MST\.?\s+(?:[A-Z]{2,}\s*)+)/i,
      /\b((?:[A-Z]{2,}\s+)+(?:AHMED|ISLAM|HOSSAIN|HASAN|RAHMAN|KHAN|ALAM|UDDIN|BEGUM|KHATUN|AKTER|SULTANA|MIAH|CHOWDHURY|HOQUE))\b/i,
    ];

    for (const pattern of bdNamePatterns) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        name = match[1].trim().toUpperCase();
        console.log('Found Name (BD pattern):', name);
        break;
      }
    }
  }

  // ===== EXTRACT DATE OF BIRTH =====
  const dobPatterns = [
    // "7May2000" or "17May2000" (no spaces - common OCR output)
    /(\d{1,2}(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\d{4})/i,
    // "Date of Birth 17 May 2000" (without colon)
    /Date\s*of\s*Birth\s+(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
    // "Date of Birth: 01 Jan 1990" format
    /(?:Date\s*of\s*Birth|DOB|Birth)[:\s]+(\d{1,2}[\s./-]?\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s./-]?\s*\d{2,4})/i,
    // "Date of Birth: 01/01/1990" format
    /(?:Date\s*of\s*Birth|DOB|Birth)[:\s]+(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
    // "17 May 2000" standalone with spaces
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
    // "17-May-2000" or "17/May/2000"
    /(\d{1,2}[\s./-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s./-]\d{4})/i,
    // "01/01/1990" or "01-01-1990"
    /(\d{2}[-/]\d{2}[-/]\d{4})/,
    // "1990-01-01" ISO format
    /(\d{4}[-/]\d{2}[-/]\d{2})/,
    // "May 17, 2000" US format
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{1,2},?\s*\d{4})/i,
  ];

  for (const pattern of dobPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      dateOfBirth = parseDateOfBirth(match[1].trim());
      if (dateOfBirth) {
        console.log('Found DOB:', dateOfBirth);
        break;
      }
    }
  }

  return {
    name,
    nidNumber,
    dateOfBirth,
    nidDigitType,
  };
}

/**
 * Parse various date formats to YYYY-MM-DD
 */
function parseDateOfBirth(dateStr: string): string | null {
  try {
    // Month name mapping
    const monthMap: Record<string, string> = {
      jan: '01', january: '01',
      feb: '02', february: '02',
      mar: '03', march: '03',
      apr: '04', april: '04',
      may: '05',
      jun: '06', june: '06',
      jul: '07', july: '07',
      aug: '08', august: '08',
      sep: '09', sept: '09', september: '09',
      oct: '10', october: '10',
      nov: '11', november: '11',
      dec: '12', december: '12',
    };

    // Normalize the date string
    const normalized = dateStr.trim().toLowerCase();

    // Format: "7May2000" or "17May2000" (no spaces)
    const noSpaceMatch = normalized.match(/^(\d{1,2})(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(\d{4})$/i);
    if (noSpaceMatch) {
      const day = noSpaceMatch[1].padStart(2, '0');
      const monthStr = noSpaceMatch[2].substring(0, 3);
      const month = monthMap[monthStr];
      const year = noSpaceMatch[3];
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }

    // Format: "17 May 2000" or "17-May-2000" or "17/May/2000"
    const ddMonYYYY = normalized.match(/(\d{1,2})[\s./-]+([a-z]+)[\s./-]+(\d{4})/i);
    if (ddMonYYYY) {
      const day = ddMonYYYY[1].padStart(2, '0');
      const monthStr = ddMonYYYY[2].substring(0, 3);
      const month = monthMap[monthStr];
      const year = ddMonYYYY[3];
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }

    // Format: "May 17, 2000" or "May 17 2000"
    const monDDYYYY = normalized.match(/([a-z]+)[\s./-]*(\d{1,2}),?[\s./-]*(\d{4})/i);
    if (monDDYYYY) {
      const monthStr = monDDYYYY[1].substring(0, 3);
      const month = monthMap[monthStr];
      const day = monDDYYYY[2].padStart(2, '0');
      const year = monDDYYYY[3];
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }

    // Format: YYYY-MM-DD (ISO)
    const isoMatch = normalized.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    }

    // Format: DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = normalized.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    }

    // Format: DD-MM-YY or DD/MM/YY
    const dmyShortMatch = normalized.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2})/);
    if (dmyShortMatch) {
      let year = dmyShortMatch[3];
      year = parseInt(year) > 50 ? '19' + year : '20' + year;
      return `${year}-${dmyShortMatch[2].padStart(2, '0')}-${dmyShortMatch[1].padStart(2, '0')}`;
    }

    return null;
  } catch {
    return null;
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
