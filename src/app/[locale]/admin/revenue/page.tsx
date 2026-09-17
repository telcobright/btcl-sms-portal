'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CONTROL, MultiSelect, Tile, money, statusStyle } from '../components/reportControls';
import {
  getRevenueTransactions,
  revenueExportUrl,
  formatBst,
  isSettled,
  SERVICE_OPTIONS,
  METHOD_OPTIONS,
  METHOD_GROUPS,
  STATUS_OPTIONS,
  type RevenueFilters,
  type RevenuePage,
  type RevenueTransaction,
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

/**
 * The DID numbers this subscriber holds in this row's service.
 *
 * One number is the ordinary case and is shown as it is. Several are common enough -- one PBX
 * subscriber holds seven, one SMS subscriber a hundred -- that listing them inline would wreck
 * the row, so the cell still shows a number and puts the rest behind a count. Nothing is
 * hidden; the table just stays a table.
 */
const DidCell = ({ dids, onExpand }: { dids: string[]; onExpand: () => void }) => {
  if (dids.length === 0) return <span className="text-gray-400">—</span>;
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="font-mono text-xs">{dids[0]}</span>
      {dids.length > 1 && (
        <button
          onClick={onExpand}
          title={`Show all ${dids.length} DID numbers`}
          className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0D529E]/10 text-[#0D529E] hover:bg-[#0D529E]/20"
        >
          +{dids.length - 1}
        </button>
      )}
    </div>
  );
};

export default function RevenuePage() {
  const [filters, setFilters] = useState<RevenueFilters>({ page: 0, size: PAGE_SIZE });
  const [q, setQ] = useState('');
  const [storeId, setStoreId] = useState('');
  const [result, setResult] = useState<RevenuePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  // The row whose full DID list is open. Holding the row, not just the numbers, so the popup
  // can name the subscriber and the service they belong to.
  const [didRow, setDidRow] = useState<RevenueTransaction | null>(null);

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

  // Date range counts once: from and to are one filter to the person reading the report.
  const activeFilterCount = [
    filters.from || filters.to,
    filters.storeId,
    filters.q,
    filters.service,
    filters.method,
    filters.status,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setQ('');
    setStoreId('');
    setFilters({ page: 0, size: PAGE_SIZE });
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

      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              aria-label="From date"
              title="From date"
              value={filters.from || ''}
              max={filters.to || undefined}
              className={CONTROL + ' w-[9.5rem]'}
              onChange={(e) => setFilter({ from: e.target.value || undefined })}
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              aria-label="To date"
              title="To date"
              value={filters.to || ''}
              min={filters.from || undefined}
              className={CONTROL + ' w-[9.5rem]'}
              onChange={(e) => setFilter({ to: e.target.value || undefined })}
            />
          </div>

          <input
            type="text"
            aria-label="Store ID"
            value={storeId}
            placeholder="Store ID"
            className={CONTROL + ' w-36'}
            onChange={(e) => setStoreId(e.target.value)}
          />

          <form
            className="relative min-w-[13rem] flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              setFilter({ q: q.trim() || undefined });
            }}
          >
            <input
              type="text"
              aria-label="Search"
              value={q}
              placeholder="Search TrxID, name, mobile or email"
              className={CONTROL + ' w-full pr-9'}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-[#0D529E]"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M8.5 3a5.5 5.5 0 1 0 3.3 9.9l3.15 3.15a1 1 0 0 0 1.4-1.4l-3.15-3.15A5.5 5.5 0 0 0 8.5 3zM5 8.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </form>

          <MultiSelect
            label="Service"
            options={SERVICE_OPTIONS}
            value={filters.service}
            onChange={(service) => setFilter({ service })}
          />
          {/* Every payment here is taken by SSLCommerz; only the method inside it differs, so the
              gateway names the control and the methods are what you pick. */}
          <MultiSelect
            label="SSLCommerz"
            header="Payment gateway: SSLCommerz"
            options={METHOD_OPTIONS}
            groups={METHOD_GROUPS}
            value={filters.method}
            onChange={(method) => setFilter({ method })}
          />
          <MultiSelect
            label="Status"
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(status) => setFilter({ status })}
          />

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-9 px-2 text-xs font-medium text-[#0D529E] hover:underline"
            >
              Clear all ({activeFilterCount})
            </button>
          )}
        </div>
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
                <th className="px-4 py-3 font-semibold">Payment Gateway</th>
                <th className="px-4 py-3 font-semibold">Subscriber</th>
                <th className="px-4 py-3 font-semibold">Mobile</th>
                <th className="px-4 py-3 font-semibold">Partner Contact</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">DID Number</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-gray-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-gray-500">
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      {t.paymentGateway || '—'}
                      {t.paymentMethod && (
                        <span className="block text-xs text-gray-500">{t.paymentMethod}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{t.subscriberName || '—'}</td>
                    <td className="px-4 py-3">{t.subscriberMobile || '—'}</td>
                    <td className="px-4 py-3">{t.partnerContact || '—'}</td>
                    <td className="px-4 py-3 text-xs">{t.subscriberEmail || '—'}</td>
                    <td className="px-4 py-3">
                      <DidCell dids={t.didNumbers ?? []} onExpand={() => setDidRow(t)} />
                    </td>
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

      {didRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setDidRow(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900">Allocated DID numbers</h2>
                {/* Both facts named: these numbers belong to this subscriber in this service
                    only, and the same subscriber may hold different ones elsewhere. */}
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {didRow.subscriberName || 'Subscriber'}
                  {' · '}
                  {didRow.serviceName || didRow.storeType || 'Service'}
                </p>
              </div>
              <button
                onClick={() => setDidRow(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto">
              <ol className="space-y-1.5">
                {(didRow.didNumbers ?? []).map((n, i) => (
                  <li key={n} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-xs text-gray-400 tabular-nums">{i + 1}.</span>
                    <span className="font-mono">{n}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-500">
              {(didRow.didNumbers ?? []).length} numbers allocated in this service.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
