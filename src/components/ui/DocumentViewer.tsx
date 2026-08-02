'use client';

// Reusable document viewer used by the admin partner page and the customer
// dashboard. Takes an already-fetched Blob (documents are served as
// authenticated byte streams, never as URLs), detects its real type, and shows
// the right viewer:
//   image   → react-photo-view PhotoSlider (zoom / rotate / pan, all formats)
//   heic    → converted to JPEG via heic2any (lazy), then shown as an image
//   pdf     → the browser's native PDF viewer via <iframe> (multi-page, zoom,
//             print — no extra dependency, nothing to bundle)
//   unknown → a download panel (never a broken/blank "PDF" like before)

import { useEffect, useState } from 'react';
import { PhotoSlider } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { detectFileKind, withDetectedExt } from '@/lib/file-detect';

type ViewKind = 'detecting' | 'image' | 'heic-converting' | 'pdf' | 'unknown';

const downloadBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

const CloseIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function DocumentViewer({
  blob,
  name = 'document',
  onClose,
}: {
  blob: Blob | null;
  name?: string;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<ViewKind>('detecting');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(name);

  // Detect type (and convert HEIC) whenever a new blob is opened.
  useEffect(() => {
    if (!blob) return;
    let cancelled = false;
    let objectUrl: string | null = null;

    setKind('detecting');
    setImageUrl(null);
    setPdfUrl(null);

    (async () => {
      const det = await detectFileKind(blob);
      if (cancelled) return;
      setDisplayName(withDetectedExt(name, det.ext));

      if (det.kind === 'image') {
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
        setKind('image');
      } else if (det.kind === 'pdf') {
        // Re-key as application/pdf: the backend mislabels stored PDFs as
        // image/jpeg, and the browser's iframe viewer keys off the blob type.
        objectUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        setPdfUrl(objectUrl);
        setKind('pdf');
      } else if (det.kind === 'heic') {
        setKind('heic-converting');
        try {
          const heic2any = (await import('heic2any')).default;
          const converted = await heic2any({ blob, toType: 'image/jpeg', quality: 0.92 });
          const jpeg = Array.isArray(converted) ? converted[0] : converted;
          if (cancelled) return;
          objectUrl = URL.createObjectURL(jpeg);
          setImageUrl(objectUrl);
          setKind('image');
        } catch {
          if (!cancelled) setKind('unknown');
        }
      } else {
        setKind('unknown');
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [blob, name]);

  // Escape-to-close + body scroll lock while open.
  useEffect(() => {
    if (!blob) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
    };
  }, [blob, onClose]);

  if (!blob) return null;

  // Images (and converted HEIC) use PhotoSlider's own full-screen overlay.
  if (kind === 'image' && imageUrl) {
    return (
      <PhotoSlider
        images={[{ src: imageUrl, key: imageUrl }]}
        visible
        onClose={onClose}
        index={0}
        onIndexChange={() => {}}
      />
    );
  }

  // Everything else renders inside a shared dark modal.
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="truncate text-sm font-medium text-white/90">{displayName}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => downloadBlob(blob, displayName)}
              className="text-xs text-sky-300 hover:underline"
            >
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {kind === 'pdf' && pdfUrl && (
            <iframe src={pdfUrl} title={displayName} className="h-full w-full border-0" />
          )}

          {kind === 'heic-converting' && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-white/80">
              <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-sm">Converting image for preview…</p>
            </div>
          )}

          {kind === 'detecting' && (
            <div className="flex h-full items-center justify-center text-sm text-white/70">
              Loading…
            </div>
          )}

          {kind === 'unknown' && (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-white/80">
              <p className="text-sm">
                This file type can’t be previewed in the browser.
              </p>
              <button
                type="button"
                onClick={() => downloadBlob(blob, displayName)}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                Download to view
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
