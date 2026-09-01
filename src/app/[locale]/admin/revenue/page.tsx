'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getRevenueTransactions,
  revenueExportUrl,
  formatBst,
  isSettled,
  SERVICE_OPTIONS,
  STATUS_OPTIONS,
  type RevenueFilters,
  type RevenuePage,
} from '@/lib/api-client/revenue';

/**
 * Revenue Office view of SSLCommerz recharges, across every store and service.
 *
 * Access is governed by the existing admin menu permission system: '/admin/revenue' is
 * registered in ADMIN_MENU_CATALOG, so an account can be granted 'readonly' (view) or
 * 'full' (view + export) without inventing a new role concept. The authoritative check
 * is server side; this page only renders.
 */

const PAGE_SIZE = 25;

const money = (v: string | null) => {
  if (v == null) return '—';
  const n = Number(v);
  // The gateway sends amounts as strings; a malformed one used to render as "NaN".
  return Number.isFinite(n)
    ? n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';
};

const statusStyle = (status: string | null) => {
  if (isSettled(status)) return 'bg-green-100 text-green-700';
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-700';
    case 'FAILED':
      return 'bg-red-100 text-red-700';
    case 'CANCELLED':
      return 'bg-gray-200 text-gray-700';
    case 'EXPIRED':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const Tile = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4">
    <div className={'text-xl font-semibold ' + (tone || 'text-gray-900')}>{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    {children}
  </div>
);

export default function RevenuePage() {
  const [filters, setFilters] = useState<RevenueFilters>({ page: 0, size: PAGE_SIZE });
  const [q, setQ] = useState('');
  const [storeId, setStoreId] = useState('');
  const [result, setResult] = useState<RevenuePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  // The query the table currently shows. Export reuses exactly this, so the file can
  // never disagree with the totals on screen.
  const applied = useMemo<RevenueFilters>(() => ({ ...filters }), [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    // Read the token per request rather than leaning on axios's default Authorization
    // header: that default is only set inside setAuthToken() at login and nothing puts
    // it back, so a refresh or a bookmarked URL sent this request unauthenticated and
    // the screen then blamed the account's permissions for it.
    const authToken = localStorage.getItem('authToken') || undefined;
    if (!authToken) {
      setError('Your session has expired. Please sign in again.');
      setResult(null);
      setLoading(false);
      return;
    }
    try {
      setResult(await getRevenueTransactions(applied, authToken));
    } catch (e: any) {
      setError(
        e?.response?.status === 403
          ? 'Your account does not have access to revenue reports.'
          : 'Could not load transactions. Please try again.'
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    load();
  }, [load]);

  // Any filter change returns to page 1; staying on page 7 of a new result set is meaningless.
  const setFilter = (patch: Partial<RevenueFilters>) =>
    setFilters((f) => ({ ...f, ...patch, page: 0 }));

  // Store ID is typed, not picked from a list. Applying it straight from onChange fired
  // one request per character, so it is debounced into the filters instead.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = storeId.trim() || undefined;
      setFilters((f) => (f.storeId === next ? f : { ...f, storeId: next, page: 0 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [storeId]);

  /**
   * Download the CSV.
   *
   * A plain <a href> cannot carry the bearer token - browser navigation sends no
   * Authorization header, and btcl_auth is only a marker cookie for the Next
   * middleware, not a credential the payment service reads. So fetch it and save
   * the blob.
   */
  const exportCsv = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setError('Your session has expired. Please sign in again.');
      return;
    }
    setExporting(true);
    setError('');
    try {
      const res = await fetch(revenueExportUrl(applied), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        setError(
          res.status === 403
            ? 'Your account does not have access to revenue reports.'
            : 'Could not export transactions. Please try again.'
        );
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-${applied.from || 'all'}-to-${applied.to || 'all'}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not export transactions. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const toggleCsv = (current: string | undefined, value: string) => {
    const set = new Set((current || '').split(',').filter(Boolean));
    if (set.has(value)) {
      set.delete(value);
    } else {
      set.add(value);
    }
    return Array.from(set).join(',');
  };

  const rows = result?.data ?? [];
  const totalPages = result?.totalPages ?? 0;
  const page = result?.page ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Revenue — SSLCommerz Recharges</h1>
          <p className="text-sm text-gray-500">
            All stores and services. Times shown in BST (UTC+6).
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={exporting}
          className="px-4 py-2 rounded-lg bg-[#0D529E] text-white text-sm font-medium hover:bg-[#1F3C71] disabled:opacity-50"
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Totals cover the whole filtered set, not just this page. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tile label="Transactions" value={result ? String(result.totalItems) : '—'} />
        <Tile
          label="Successful"
          value={result ? String(result.settledCount) : '—'}
          tone="text-green-700"
        />
        <Tile
          label="Settled amount (BDT)"
          value={result ? money(result.settledAmount) : '—'}
          tone="text-green-700"
        />
        <Tile
          label="Page"
          value={result ? (page + 1) + ' of ' + Math.max(totalPages, 1) : '—'}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label="From date">
            <input
              type="date"
              value={filters.from || ''}
              className="input-field w-full"
              onChange={(e) => setFilter({ from: e.target.value || undefined })}
            />
          </Field>
          <Field label="To date">
            <input
              type="date"
              value={filters.to || ''}
              className="input-field w-full"
              onChange={(e) => setFilter({ to: e.target.value || undefined })}
            />
          </Field>
          <Field label="Store ID">
            <input
              type="text"
              value={storeId}
              placeholder="e.g. HostedIPPBXlive"
              className="input-field w-full"
              onChange={(e) => setStoreId(e.target.value)}
            />
          </Field>
          <Field label="Search">
            <div className="flex gap-2">
              <input
                type="text"
                value={q}
                placeholder="TrxID, name, mobile or email"
                className="input-field w-full"
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setFilter({ q: q.trim() || undefined });
                }}
              />
              <button
                onClick={() => setFilter({ q: q.trim() || undefined })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
              >
                Go
              </button>
            </div>
          </Field>
        </div>

        <Field label="Service">
          <div className="flex flex-wrap gap-2">
            {SERVICE_OPTIONS.map((s) => {
              const on = (filters.service || '').split(',').includes(s.value);
              return (
                <button
                  key={s.value}
                  onClick={() =>
                    setFilter({ service: toggleCsv(filters.service, s.value) || undefined })
                  }
                  className={
                    'px-3 py-1 rounded-full text-xs border ' +
                    (on
                      ? 'bg-[#0D529E] text-white border-[#0D529E]'
                      : 'bg-white text-gray-600 border-gray-300')
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Status">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => {
              const on = (filters.status || '').split(',').includes(s.value);
              return (
                <button
                  key={s.value}
                  onClick={() =>
                    setFilter({ status: toggleCsv(filters.status, s.value) || undefined })
                  }
                  className={
                    'px-3 py-1 rounded-full text-xs border ' +
                    (on
                      ? 'bg-[#0D529E] text-white border-[#0D529E]'
                      : 'bg-white text-gray-600 border-gray-300')
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3 font-semibold">Store ID</th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Transaction ID</th>
                <th className="px-4 py-3 font-semibold">Date &amp; Time (BST)</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">Subscriber</th>
                <th className="px-4 py-3 font-semibold">Mobile</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    No transactions match these filters.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((t, i) => (
                  <tr key={t.transactionId || t.orderId || i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs">{t.storeId || '—'}</td>
                    <td className="px-4 py-3">{t.serviceName || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {t.transactionId || t.orderId || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatBst(t.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-medium">{money(t.amount)}</td>
                    <td className="px-4 py-3">{t.subscriberName || '—'}</td>
                    <td className="px-4 py-3">{t.subscriberMobile || '—'}</td>
                    <td className="px-4 py-3 text-xs">{t.subscriberEmail || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          'px-2 py-1 rounded-full text-xs font-medium ' + statusStyle(t.status)
                        }
                      >
                        {t.status || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
            <span className="text-gray-500">
              Page {page + 1} of {totalPages} · {result?.totalItems} transactions
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 0}
                onClick={() =>
                  setFilters((f) => ({ ...f, page: Math.max((f.page ?? 0) - 1, 0) }))
                }
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 0) + 1 }))}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
