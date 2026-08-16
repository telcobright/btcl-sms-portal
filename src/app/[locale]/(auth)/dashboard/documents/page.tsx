'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

/**
 * Customer-facing document page.
 *
 * Until now the only way to send BTCL a document was the registration form, so a customer
 * who registered without a BTRC aggregator licence — or had one rejected — had no way to
 * supply it and no way to see where it stood. Bulk SMS depends on that licence being
 * approved, which made "upload it and come back" advice a customer could not act on.
 *
 * Replacing a document sends it back for review server-side, so a corrected file clears
 * its previous rejection rather than staying rejected.
 */

interface DecodedToken {
  idPartner?: number;
  [key: string]: unknown;
}

type DocState = { status: string; rejectionReason?: string | null };

/** What the customer may send, in the order the page lists them. */
const DOCUMENTS: { type: string; label: string; note?: string }[] = [
  { type: 'nidfront', label: 'NID — Front Side' },
  { type: 'nidback', label: 'NID — Back Side' },
  { type: 'tradelicense', label: 'Trade License' },
  { type: 'tin', label: 'TIN Certificate' },
  { type: 'bin', label: 'BIN Certificate' },
  {
    type: 'btrc',
    label: 'BTRC Aggregator Licence',
    note: 'Required to purchase Bulk SMS packages.',
  },
  { type: 'govtauthorization', label: 'Office Order / Authorisation Letter' },
  { type: 'photo', label: 'Photograph' },
  { type: 'taxreturn', label: 'Last Tax Return' },
];

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.heic,.heif,.webp';
const MAX_BYTES = 5 * 1024 * 1024;

export default function CustomerDocumentsPage() {
  const params = useParams();
  const locale = params.locale || 'en';

  const [statuses, setStatuses] = useState<Record<string, DocState>>({});
  const [idPartner, setIdPartner] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setLoading(false);
      return;
    }
    try {
      const partner = jwtDecode<DecodedToken>(authToken)?.idPartner ?? null;
      setIdPartner(partner);
      if (!partner) return;

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.partner.getDocumentStatuses}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ id: partner }),
        }
      );
      if (response.ok) setStatuses(await response.json());
    } catch {
      toast.error('Could not load your documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (type: string, file: File) => {
    if (!idPartner) return;
    // Checked here as well as server-side so the customer is told immediately rather
    // than after waiting for a 5MB upload to be rejected.
    if (file.size > MAX_BYTES) {
      toast.error('That file is larger than 5MB. Please upload a smaller copy.');
      return;
    }
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    setUploading(type);
    try {
      const body = new FormData();
      body.append('partnerId', String(idPartner));
      body.append('documentType', type);
      body.append('file', file, file.name);

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.partner.updatePartnerDocument}`,
        { method: 'POST', headers: { Authorization: `Bearer ${authToken}` }, body }
      );
      if (!response.ok) throw new Error(await response.text());
      toast.success('Uploaded. BTCL will review it shortly.');
      await load();
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      if (inputs.current[type]) inputs.current[type]!.value = '';
    }
  };

  const badge = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return { text: 'Approved', cls: 'bg-green-50 text-green-700 border-green-200' };
      case 'REJECTED':
        return { text: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200' };
      case 'PENDING':
        return { text: 'Under review', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { text: 'Not uploaded', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your documents…</div>;
  }

  if (!idPartner) {
    return (
      <div className="p-8 text-center text-gray-600">
        Please{' '}
        <Link href={`/${locale}/login`} className="text-[#0D529E] underline">
          sign in
        </Link>{' '}
        to manage your documents.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1F3C71]">My Documents</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Upload or replace a document. Anything you replace goes back to BTCL for review.
      </p>

      <div className="space-y-3">
        {DOCUMENTS.map((doc) => {
          const state = statuses[doc.type];
          const tone = badge(state?.status);
          const busy = uploading === doc.type;
          return (
            <div
              key={doc.type}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3"
            >
              <div className="flex-1 min-w-[220px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{doc.label}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${tone.cls}`}>
                    {tone.text}
                  </span>
                </div>
                {doc.note && <p className="text-xs text-gray-500 mt-1">{doc.note}</p>}
                {state?.status === 'REJECTED' && state.rejectionReason && (
                  <p className="text-xs text-red-600 mt-1">
                    Reason: {state.rejectionReason}
                  </p>
                )}
              </div>

              <input
                ref={(el) => {
                  inputs.current[doc.type] = el;
                }}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload(doc.type, file);
                }}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => inputs.current[doc.type]?.click()}
                className="px-4 py-2 text-sm font-semibold rounded-lg border-2 border-btcl-primary text-btcl-primary bg-white hover:bg-btcl-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {busy
                  ? 'Uploading…'
                  : state?.status
                    ? 'Replace'
                    : 'Upload'}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-6">
        PDF, JPG, PNG, HEIC or WEBP, up to 5MB each.
      </p>
    </div>
  );
}
