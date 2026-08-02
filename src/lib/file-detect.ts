// Shared document type detection.
//
// Partner documents are fetched as authenticated blobs (raw bytes). The backend
// is NOT trustworthy about the type: it serves stored PDFs with
// `Content-Type: image/jpeg`, and returns generic/empty types for others. So we
// identify files by sniffing their magic bytes, and only consult the server
// MIME when the bytes are inconclusive. This module is the single source of
// truth for both the admin and dashboard viewers.

export type FileKind = 'image' | 'pdf' | 'heic' | 'unknown';

export interface DetectedFile {
  kind: FileKind;
  ext: string; // includes the leading dot, e.g. '.png'
  mime: string; // best-known mime, e.g. 'image/png' ('' if unknown)
}

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

// Map a specific, trustworthy blob.type through — only used as a fallback when
// the bytes are inconclusive (e.g. text-based SVG).
const fromMime = (mime: string): DetectedFile | null => {
  const m = mime.toLowerCase();
  if (m === 'image/heic' || m === 'image/heif') return { kind: 'heic', ext: '.heic', mime: m };
  if (m === 'image/png') return { kind: 'image', ext: '.png', mime: m };
  if (m === 'image/jpeg' || m === 'image/jpg') return { kind: 'image', ext: '.jpg', mime: 'image/jpeg' };
  if (m === 'image/gif') return { kind: 'image', ext: '.gif', mime: m };
  if (m === 'image/webp') return { kind: 'image', ext: '.webp', mime: m };
  if (m === 'image/bmp' || m === 'image/x-ms-bmp') return { kind: 'image', ext: '.bmp', mime: 'image/bmp' };
  if (m === 'image/tiff') return { kind: 'image', ext: '.tiff', mime: m };
  if (m === 'image/svg+xml') return { kind: 'image', ext: '.svg', mime: m };
  if (m === 'application/pdf') return { kind: 'pdf', ext: '.pdf', mime: m };
  return null;
};

// Sniff magic bytes. Reads enough of the head to identify container formats
// (WebP/HEIC live at byte offsets, not byte 0).
const fromMagicBytes = (head: Uint8Array): DetectedFile => {
  const hex = bytesToHex(head.slice(0, 12));

  if (hex.startsWith('89504e47')) return { kind: 'image', ext: '.png', mime: 'image/png' };
  if (hex.startsWith('ffd8ff')) return { kind: 'image', ext: '.jpg', mime: 'image/jpeg' };
  if (hex.startsWith('474946')) return { kind: 'image', ext: '.gif', mime: 'image/gif' }; // "GIF"
  if (hex.startsWith('424d')) return { kind: 'image', ext: '.bmp', mime: 'image/bmp' }; // "BM"
  if (hex.startsWith('49492a00') || hex.startsWith('4d4d002a'))
    return { kind: 'image', ext: '.tiff', mime: 'image/tiff' }; // TIFF LE/BE
  if (hex.startsWith('25504446')) return { kind: 'pdf', ext: '.pdf', mime: 'application/pdf' }; // "%PDF"

  // RIFF....WEBP  → 'RIFF' at 0, 'WEBP' at offset 8
  if (hex.startsWith('52494646') && hex.slice(16, 24) === '57454250')
    return { kind: 'image', ext: '.webp', mime: 'image/webp' };

  // ISO-BMFF 'ftyp' box: bytes 4-8 = 'ftyp' (66747970), brand at offset 8.
  if (hex.slice(8, 16) === '66747970') {
    const brand = new TextDecoder().decode(head.slice(8, 12)).toLowerCase();
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heif'].includes(brand))
      return { kind: 'heic', ext: '.heic', mime: 'image/heic' };
  }

  // SVG / plain XML starting with '<?xml' or '<svg'
  if (hex.startsWith('3c3f786d6c') || hex.startsWith('3c737667'))
    return { kind: 'image', ext: '.svg', mime: 'image/svg+xml' };

  return { kind: 'unknown', ext: '', mime: '' };
};

/**
 * Detect a blob's real type. Magic bytes are checked FIRST and win, because
 * this backend mislabels documents — it serves stored PDFs with
 * `Content-Type: image/jpeg`. Trusting blob.type would route a PDF into an
 * <img> and render it broken (exactly the "download works, view doesn't" bug:
 * the old download path already sniffed bytes, but view trusted the MIME). The
 * server MIME is only consulted when the bytes are inconclusive (e.g. SVG/XML).
 * Unknown types return `kind: 'unknown'` (never silently coerced to PDF).
 */
export const detectFileKind = async (blob: Blob): Promise<DetectedFile> => {
  try {
    const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
    const sniffed = fromMagicBytes(head);
    if (sniffed.kind !== 'unknown') return sniffed;
  } catch {
    // fall through to the MIME hint
  }

  const byMime = blob.type ? fromMime(blob.type) : null;
  if (byMime) return byMime;

  return { kind: 'unknown', ext: '', mime: '' };
};

/** Replace a name's extension with the detected one (e.g. "nid" → "nid.png"). */
export const withDetectedExt = (name: string, ext: string): string =>
  name.replace(/\.[^/.]+$/, '') + (ext || '');
