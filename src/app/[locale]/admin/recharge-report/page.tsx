'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { CONTROL, MultiSelect, Tile, money, statusStyle } from '../components/reportControls';
import { getAllPartners, type Partner } from '@/lib/api-client/admin';
import { downloadCsv } from '@/lib/api-client/reports';
import {
  buildRechargeReport,
  fetchAllRecharges,
  PREPARING_HTML,
  rechargeReportCsv,
  rechargeReportHtml,
  ReportTooLargeError,
} from '@/lib/reports/rechargeReport';
import {
  getRevenueTransactions,
  formatBst,
  KIND_LABELS,
  KIND_OPTIONS,
  RECHARGE_KINDS,
  SERVICE_OPTIONS,
  STATUS_OPTIONS,
  type RevenueFilters,
  type RevenuePage,
} from '@/lib/api-client/revenue';

/**
 * Every recharge a subscriber has paid for, across all four services.
 *
 * A recharge is money added to an account: a top-up (the "TopUp" package, which every
 * service shares) or a prepaid bundle (SMS bundles and VBS boxes, where the package is
 * itself the credit). Subscription plans are sales, not recharges, and this page never
 * shows them — RECHARGE_KINDS is sent on every request, including when the Type filter
 * is cleared.
 *
 * Successful recharges only on open, so the totals are money actually taken; the Status
 * filter brings back failed, cancelled and expired attempts when a subscriber says they
 * paid and got nothing.
 *
 * Same data and the same filters as the Revenue page, narrowed: both read
 * payment_transactions through the payment service, which owns it.
 */

const PAGE_SIZE = 25;

/**
 * How many subscribers the picker loads.
 *
 * Far above the real list (95 accounts on BTCL), so the dropdown holds everyone. If a
 * deployment ever outgrows it the list is still browsable and searchable — it just stops
 * at this many names.
 */
const PARTNER_LIMIT = 1000;

/** Successful only on open; the Status filter is how you widen it. */
const DEFAULT_FILTERS: RevenueFilters = {
  page: 0,
  size: PAGE_SIZE,
  kind: RECHARGE_KINDS,
  status: 'COMPLETED',
};

/**
 * Pick the subscriber whose recharges to show.
 *
 * The whole list opens on a click — there are under a hundred subscribers, so the dropdown
 * loads them once and filters as you type, with no further requests. Typing matches the name
 * or the partner id. The id is shown beside every name because two accounts can carry the
 * same company name, and the id is what the export and support tickets carry.
 */
const PartnerPicker = ({
  selected,
  onSelect,
}: {
  selected: Partner | null;
  onSelect: (partner: Partner | null) => void;
}) => {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  // null until the first open: an admin who never touches this filter costs no request.
  const [partners, setPartners] = useState<Partner[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const load = useCallback(async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    setLoading(true);
    setFailed(false);
    try {
      const all = await getAllPartners(
        { page: 0, size: PARTNER_LIMIT, partnerName: null, partnerType: null },
        authToken
      );
      setPartners(
        [...all].sort((a, b) => (a.partnerName || '').localeCompare(b.partnerName || ''))
      );
    } catch {
      setPartners(null);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && partners === null && !loading && !failed) load();
  }, [open, partners, loading, failed, load]);

  const matches = useMemo(() => {
    const list = partners ?? [];
    const t = term.trim().toLowerCase();
    if (!t) return list;
    return list.filter(
      (p) =>
        (p.partnerName || '').toLowerCase().includes(t) || String(p.idPartner).includes(t)
    );
  }, [partners, term]);

  if (selected) {
    return (
      <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#0D529E] bg-[#0D529E]/5 px-3 text-sm text-[#0D529E]">
        <span className="max-w-[14rem] truncate font-medium">{selected.partnerName}</span>
        <span className="text-xs opacity-70">#{selected.idPartner}</span>
        <button
          type="button"
          aria-label="Clear subscriber filter"
          onClick={() => {
            onSelect(null);
            setTerm('');
          }}
          className="text-[#0D529E]/70 hover:text-[#0D529E]"
        >
          ✕
        </button>
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <input
          type="text"
          aria-label="Subscriber"
          aria-expanded={open}
          value={term}
          placeholder="All subscribers"
          className={CONTROL + ' w-52 pr-7'}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <svg
          className="pointer-events-none absolute right-2 top-3 h-3.5 w-3.5 opacity-60"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
        </svg>
      </div>

      {open && (
        <div className="absolute left-0 z-30 mt-1 max-h-80 min-w-[20rem] overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {loading && <div className="px-3 py-2 text-sm text-gray-500">Loading subscribers…</div>}
          {failed && (
            <button
              type="button"
              onClick={load}
              className="w-full px-3 py-2 text-left text-sm text-[#0D529E] hover:bg-gray-50"
            >
              Could not load the subscriber list. Try again.
            </button>
          )}
          {!loading && !failed && matches.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              {partners && partners.length > 0 ? 'No subscriber matches that.' : 'No subscribers found.'}
            </div>
          )}
          {!loading && !failed && matches.length > 0 && (
            <>
              <div className="px-3 pb-1 pt-0.5 text-[11px] text-gray-400">
                {term.trim() ? matches.length + ' of ' + (partners?.length ?? 0) : matches.length} subscribers
              </div>
              {matches.map((p) => (
                <button
                  key={p.idPartner}
                  type="button"
                  onClick={() => {
                    onSelect(p);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className="truncate">{p.partnerName || '(no name)'}</span>
                  <span className="shrink-0 text-xs text-gray-400">#{p.idPartner}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default function RechargeReportPage() {
  const [filters, setFilters] = useState<RevenueFilters>(DEFAULT_FILTERS);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [q, setQ] = useState('');
  const [result, setResult] = useState<RevenuePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  const [error, setError] = useState('');

  // The query the table shows. Export reuses exactly this, so the file and the totals
  // on screen can never disagree.
  const applied = useMemo<RevenueFilters>(
    () => ({ ...filters, kind: filters.kind || RECHARGE_KINDS }),
    [filters]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    // Read the token per request rather than relying on axios defaults, which are only
    // set at login: a refresh or a bookmarked URL would otherwise send this unauthenticated.
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
          ? 'Your account does not have access to recharge reports.'
          : 'Could not load recharges. Please try again.'
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

  /**
   * Export the report: the filters that were applied, the summary, then every matching row.
   *
   * Both formats are built from the same fetched rows, so a CSV and a PDF exported with the
   * same filters always agree. The PDF opens as a print-ready page that the browser saves as
   * PDF — the portal's way of producing PDFs, and the only one that renders Bangla names
   * correctly.
   */
  const exportReport = async (format: 'csv' | 'pdf') => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setError('Your session has expired. Please sign in again.');
      return;
    }
    // Opened before the first await: a window opened after a network wait is no longer tied
    // to the click, and browsers block it as an unrequested pop-up.
    const win = format === 'pdf' ? window.open('', '_blank', 'width=1200,height=900') : null;
    if (format === 'pdf') {
      if (!win) {
        setError('Allow pop-ups for this site to save the report as PDF, then try again.');
        return;
      }
      win.document.write(PREPARING_HTML);
    }

    setExporting(format);
    setError('');
    try {
      const rows = await fetchAllRecharges(applied, authToken);
      let generatedBy: string | null = null;
      try {
        generatedBy = jwtDecode<{ sub?: string }>(authToken).sub || null;
      } catch {
        // An unreadable token only costs the "generated by" line.
      }
      const report = buildRechargeReport(rows, applied, {
        subscriber: partner ? `${partner.partnerName} (#${partner.idPartner})` : null,
        generatedBy,
      });

      if (format === 'csv') {
        downloadCsv(rechargeReportCsv(report), `${report.fileBase}.csv`);
      } else if (win) {
        win.document.open();
        win.document.write(rechargeReportHtml(report));
        win.document.close();
        win.focus();
      }
    } catch (e: any) {
      win?.close();
      setError(
        e instanceof ReportTooLargeError
          ? `These filters match ${e.rows} recharges, too many for one report. Narrow the date range and export again.`
          : e?.response?.status === 403
            ? 'Your account does not have access to recharge reports.'
            : 'Could not prepare the report. Please try again.'
      );
    } finally {
      setExporting(null);
    }
  };

  // The date range counts once: from and to are one filter to the person reading the report.
  // Neither the default status nor the recharge kinds count: both are on from the start, and a
  // badge reading "Clear all (1)" before anything is chosen reads as a mistake in the page.
  const activeFilterCount = [
    filters.from || filters.to,
    filters.idPartner,
    filters.service,
    filters.kind !== RECHARGE_KINDS,
    filters.status !== DEFAULT_FILTERS.status,
    filters.q,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setQ('');
    setPartner(null);
    setFilters(DEFAULT_FILTERS);
  };

  const rows = result?.data ?? [];
  const totalPages = result?.totalPages ?? 0;
  const page = result?.page ?? 0;
  const showingSuccessfulOnly = filters.status === 'COMPLETED';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Recharge Report</h1>
          <p className="text-sm text-gray-500">
            Top-ups and prepaid bundles across PBX, Contact Center, Voice Broadcasting and SMS.
            Times shown in BST (UTC+6).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportReport('csv')}
            disabled={exporting !== null || loading}
            title="Report filters, summary and every matching recharge, as a spreadsheet"
            className="px-4 py-2 rounded-lg border border-[#0D529E] text-[#0D529E] text-sm font-medium hover:bg-[#0D529E]/5 disabled:opacity-50"
          >
            {exporting === 'csv' ? 'Preparing…' : 'Export CSV'}
          </button>
          <button
            onClick={() => exportReport('pdf')}
            disabled={exporting !== null || loading}
            title="Opens the report ready to save as PDF"
            className="px-4 py-2 rounded-lg bg-[#0D529E] text-white text-sm font-medium hover:bg-[#1F3C71] disabled:opacity-50"
          >
            {exporting === 'pdf' ? 'Preparing…' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Totals cover the whole filtered set, not just this page. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tile label="Recharges" value={result ? String(result.totalItems) : '—'} />
        <Tile
          label="Successful"
          value={result ? String(result.settledCount) : '—'}
          tone="text-green-700"
        />
        <Tile
          label="Amount recharged (BDT)"
          value={result ? money(result.settledAmount) : '—'}
          tone="text-green-700"
        />
        <Tile label="Page" value={result ? page + 1 + ' of ' + Math.max(totalPages, 1) : '—'} />
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

          <PartnerPicker
            selected={partner}
            onSelect={(p) => {
              setPartner(p);
              setFilter({ idPartner: p?.idPartner });
            }}
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
          <MultiSelect
            label="Type"
            options={KIND_OPTIONS}
            value={filters.kind === RECHARGE_KINDS ? undefined : filters.kind}
            onChange={(kind) => setFilter({ kind: kind || RECHARGE_KINDS })}
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
        {showingSuccessfulOnly && (
          <p className="mt-2 text-xs text-gray-500">
            Showing successful recharges. Use the Status filter to include pending, failed,
            cancelled and expired attempts.
          </p>
        )}
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
                <th className="px-4 py-3 font-semibold">Date &amp; Time (BST)</th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Subscriber</th>
                <th className="px-4 py-3 font-semibold">Partner ID</th>
                <th className="px-4 py-3 font-semibold">Mobile</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">Payment Gateway</th>
                <th className="px-4 py-3 font-semibold">Transaction ID</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-500">
                    No recharges match these filters.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((t, i) => (
                  <tr key={t.transactionId || t.orderId || i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{formatBst(t.createdAt)}</td>
                    <td className="px-4 py-3">{t.serviceName || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {t.kind ? KIND_LABELS[t.kind] || t.kind : '—'}
                      {/* The package id tells one bundle from another; a top-up has only one. */}
                      {t.kind === 'PREPAID' && t.idPackage != null && (
                        <span className="block text-xs text-gray-500">#{t.idPackage}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{t.subscriberName || '—'}</td>
                    <td className="px-4 py-3 text-xs">{t.idPartner ?? '—'}</td>
                    <td className="px-4 py-3">{t.subscriberMobile || t.partnerContact || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{money(t.amount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {t.paymentGateway || '—'}
                      {t.paymentMethod && (
                        <span className="block text-xs text-gray-500">{t.paymentMethod}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {t.transactionId || t.orderId || '—'}
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
              Page {page + 1} of {totalPages} · {result?.totalItems} recharges
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 0}
                onClick={() => setFilters((f) => ({ ...f, page: Math.max((f.page ?? 0) - 1, 0) }))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 0) + 1 }))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50"
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
