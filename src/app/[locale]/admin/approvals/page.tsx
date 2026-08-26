'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ServiceApproval,
  getPendingApprovals,
  approveRequest,
  rejectRequest,
  storeLabel,
} from '@/lib/api-client/approvals';

/**
 * Postpaid approvals.
 *
 * A postpaid checkout takes no money, so somebody has to decide whether the
 * customer gets the service. Approving releases the purchase into provisioning —
 * the domain, the extensions, the login all follow from this click — so the page
 * shows what is actually being granted, not just a row to tick.
 */
export default function AdminApprovalsPage() {
  const [rows, setRows] = useState<ServiceApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<ServiceApproval | null>(null);
  const [reason, setReason] = useState('');

  const who = () => {
    if (typeof window === 'undefined') return 'portal';
    return localStorage.getItem('userEmail') || localStorage.getItem('username') || 'portal';
  };

  const load = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) {
      setError('Your session has expired. Sign in again to review approvals.');
      setLoading(false);
      return;
    }
    try {
      setRows(await getPendingApprovals(token));
      setError(null);
    } catch {
      setError('Could not load the approval queue. Check that the payment service is reachable, then try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const decide = async (row: ServiceApproval, approve: boolean, note?: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setBusyId(row.id);
    setResult(null);
    try {
      if (approve) {
        await approveRequest(row.id, token, who(), note);
        setResult(`Approved ${row.cusName ?? 'request'} — ${storeLabel(row.storeType)} is being set up now.`);
      } else {
        await rejectRequest(row.id, token, who(), note);
        setResult(`Rejected ${row.cusName ?? 'request'}. Nothing was set up and the customer was not charged.`);
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch {
      // The server rolls the decision back when it cannot publish, so the
      // request is untouched and clicking again is safe.
      setResult('That did not go through. The request is unchanged — try again in a moment.');
    } finally {
      setBusyId(null);
      setRejecting(null);
      setReason('');
    }
  };

  const when = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Postpaid Approvals</h1>
        <p className="text-gray-600 mt-1">
          Postpaid customers are not charged at checkout, so each request waits here for a decision.
          Approving sets the service up straight away.
        </p>
      </div>

      {result && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900">
          {result}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading the queue…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <p className="text-lg font-medium text-gray-900">Nothing waiting</p>
          <p className="mt-1 text-gray-600">New postpaid requests will appear here as they come in.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Customer', 'Service', 'Agents', 'Requested', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.cusName ?? '—'}</div>
                    <div className="text-sm text-gray-500">{r.cusEmail ?? '—'}</div>
                    <div className="text-xs text-gray-400">Partner {r.idPartner}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-sm text-gray-800">
                      {storeLabel(r.storeType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-900">{r.quantity ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{when(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => decide(r, true)}
                        disabled={busyId === r.id}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50"
                      >
                        {busyId === r.id ? 'Working…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => { setRejecting(r); setReason(''); }}
                        disabled={busyId === r.id}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Reject {rejecting.cusName ?? `partner ${rejecting.idPartner}`}?
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Nothing will be set up and the customer is not charged. Say why, so the record explains itself later.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejecting"
              className="mt-4 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRejecting(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => decide(rejecting, false, reason.trim() || undefined)}
                disabled={!reason.trim()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
