import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side NID OCR proxy → self-hosted EasyOCR microservice (free, on-prem).
 *
 * Why this exists: client-side Tesseract only handles clean, upright, English-only
 * scans. The EasyOCR service (deep-learning text detection + recognition, Bangla+
 * English) reads ANY Bangladesh NID — old laminated paper cards or new smart cards,
 * front or back, under glare / rotation / clutter — and returns the fields. OCR here
 * is only a convenience pre-fill; the EC API (/NID/api/v1/nid/verify) is the source
 * of truth. NID images stay on our own infrastructure (no third-party / cloud).
 *
 * If the OCR service is unset or unreachable, this returns 200 with
 * { success:false, reason:... } so the client transparently falls back to Tesseract.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

// URL of the on-prem EasyOCR microservice (see nid-ocr-service/). Override per env.
const OCR_SERVICE_URL = process.env.NID_OCR_SERVICE_URL || 'http://127.0.0.1:7002';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Normalize the printed number to the digit form the EC verify API accepts (10 or 17).
 * Old paper cards print 13 digits; the canonical 17-digit form = birthYear(4) + 13 digits.
 */
function normalizeNid(
  raw: string | null,
  dob: string | null
): { nidNumber: string | null; nidDigitType: '10' | '17' | null } {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 10) return { nidNumber: digits, nidDigitType: '10' };
  if (digits.length === 17) return { nidNumber: digits, nidDigitType: '17' };
  if (digits.length === 13) {
    const year = (dob || '').slice(0, 4);
    if (/^\d{4}$/.test(year)) return { nidNumber: year + digits, nidDigitType: '17' };
    return { nidNumber: null, nidDigitType: null }; // 13 digits but no birth year to expand
  }
  return { nidNumber: null, nidDigitType: null };
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'Image too large (max 10MB)' }, { status: 413 });
    }

    // Forward the image to the on-prem EasyOCR service.
    const upstream = new FormData();
    upstream.append('file', file, (file as File).name || 'nid.jpg');

    let res: Response;
    try {
      res = await fetch(`${OCR_SERVICE_URL}/ocr`, {
        method: 'POST',
        body: upstream,
        signal: AbortSignal.timeout(45000),
      });
    } catch {
      // Service down / unreachable → let the client fall back to Tesseract.
      return NextResponse.json({ success: false, reason: 'service_unreachable' }, { status: 200 });
    }

    if (!res.ok) {
      return NextResponse.json({ success: false, reason: 'service_error', status: res.status }, { status: 200 });
    }

    const json = await res.json();
    const f = json?.fields;
    if (!json?.ok || !f) {
      return NextResponse.json({ success: false, reason: 'no_fields', raw: json ?? null }, { status: 200 });
    }

    const { nidNumber, nidDigitType } = normalizeNid(f.nidNumberRaw ?? null, f.dateOfBirth ?? null);

    return NextResponse.json({
      success: true,
      source: 'easyocr',
      data: {
        name: f.nameEn ?? null,
        nameBn: f.nameBn ?? null,
        nidNumber,
        dateOfBirth: f.dateOfBirth ?? null,
        nidDigitType,
      },
      meta: {
        nidNumberRaw: f.nidNumberRaw ?? null,
        engine: json.engine ?? 'easyocr',
        lineCount: Array.isArray(json.lines) ? json.lines.length : null,
      },
    });
  } catch (error) {
    console.error('[nid-ocr] route error', error);
    return NextResponse.json({ success: false, error: 'internal_error' }, { status: 500 });
  }
}
