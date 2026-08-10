'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Download,
  Loader2,
  RefreshCw,
  Receipt,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  buildSalesCsv,
  downloadCsv,
  getAllSales,
  groupSalesByPeriod,
  groupSalesByService,
  periodKeyFor,
  type ReportPeriod,
  type SaleRecord,
} from '@/lib/api-client/reports';

/**
 * ROLE_ADMIN-only sales report across every BTCL service.
 *
 * Sales live in five separate service databases with no shared reporting table, so the data is
 * fetched from each backend and merged here. Two consequences shape this page:
 *
 *  - Everything is loaded once and then filtered in memory. That keeps switching between
 *    daily/weekly/monthly instant, and is safe at current volumes (tens of rows per service).
 *  - If a backend is down its sales are simply missing, so a partial load is called out
 *    prominently. A revenue total that quietly under-reports is worse than an obvious error.
 */

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const money = (value: number) =>
  `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminReportsPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [failed, setFailed] = useState<{ label: string; reason: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = useCallback(async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    setLoading(true);
    try {
      const result = await getAllSales(authToken);
      setSales(result.sales);
      setFailed(result.failed);
      setError(
        result.succeeded.length === 0
          ? 'No service database could be read, so no sales could be loaded.'
          : null
      );
    } catch {
      setError('Could not load the sales report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const serviceOptions = useMemo(() => {
    const seen = new Map<string, string>();
    sales.forEach((sale) => seen.set(sale.service, sale.serviceLabel));
    return Array.from(seen.entries());
  }, [sales]);

  const filtered = useMemo(() => {
    // The `to` bound is inclusive of the whole day, which is what an admin means by
    // "up to the 31st" — comparing against midnight would silently drop that day.
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;

    return sales.filter((sale) => {
      if (serviceFilter !== 'all' && sale.service !== serviceFilter) return false;
      const when = new Date(sale.purchaseDate);
      if (Number.isNaN(when.getTime())) return false;
      if (from && when < from) return false;
      if (to && when > to) return false;
      return true;
    });
  }, [sales, fromDate, toDate, serviceFilter]);

  const periodGroups = useMemo(
    () => groupSalesByPeriod(filtered, period),
    [filtered, period]
  );
  const serviceGroups = useMemo(() => groupSalesByService(filtered), [filtered]);

  // Any change to the filters can shrink the result set, so go back to page 1 rather
  // than stranding the admin on a page that no longer exists.
  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, serviceFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paged = useMemo(
    () => filtered.slice(pageStart, pageStart + pageSize),
    [filtered, pageStart, pageSize]
  );

  const totals = useMemo(
    () => ({
      revenue: filtered.reduce((sum, sale) => sum + sale.total, 0),
      net: filtered.reduce((sum, sale) => sum + sale.price, 0),
      count: filtered.length,
      clients: new Set(filtered.map((sale) => sale.partnerName)).size,
    }),
    [filtered]
  );

  const handleDownload = () => {
    const stamp = new Date().toLocaleDateString('en-CA');
    const scope = serviceFilter === 'all' ? 'all-services' : serviceFilter;
    downloadCsv(buildSalesCsv(filtered), `btcl-sales-${period}-${scope}-${stamp}.csv`);
  };

  const applyQuickRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days + 1);
    setFromDate(from.toLocaleDateString('en-CA'));
    setToDate(to.toLocaleDateString('en-CA'));
  };

  const clearRange = () => {
    setFromDate('');
    setToDate('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading sales from all services…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3C71] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#0D529E]" />
            Sales Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Package purchases across every BTCL service, by day, week or month.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#0D529E] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleDownload}
            disabled={!filtered.length}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D529E] text-white text-sm font-medium rounded-lg hover:bg-[#1F3C71] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {failed.length > 0 && (
        <div className="mb-5 flex items-start gap-2 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">These figures are incomplete.</p>
            <p className="mt-0.5">
              Could not read{' '}
              {failed.map((f, i) => (
                <span key={f.label}>
                  {i > 0 && ', '}
                  <strong>{f.label}</strong> ({f.reason})
                </span>
              ))}
              . Any sales from {failed.length > 1 ? 'those services' : 'that service'} are missing
              from the totals below.
            </p>
          </div>
        </div>
      )}

      {/* ---------------- Summary ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total sales"
          value={money(totals.revenue)}
          hint="Including VAT and AIT"
        />
        <SummaryCard
          icon={<Receipt className="w-5 h-5" />}
          label="Net of tax"
          value={money(totals.net)}
          hint="Package price only"
        />
        <SummaryCard
          icon={<CalendarDays className="w-5 h-5" />}
          label="Transactions"
          value={String(totals.count)}
          hint={`Across ${serviceGroups.length} service${serviceGroups.length === 1 ? '' : 's'}`}
        />
        <SummaryCard
          icon={<Users className="w-5 h-5" />}
          label="Clients"
          value={String(totals.clients)}
          hint="Distinct partners who purchased"
        />
      </div>

      {/* ---------------- Filters ---------------- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Group by</label>
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              {PERIODS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    period === option.value
                      ? 'bg-[#0D529E] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30 focus:border-[#0D529E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30 focus:border-[#0D529E]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Service</label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30 focus:border-[#0D529E]"
            >
              <option value="all">All services</option>
              {serviceOptions.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <QuickRange onClick={() => applyQuickRange(7)}>7 days</QuickRange>
            <QuickRange onClick={() => applyQuickRange(30)}>30 days</QuickRange>
            <QuickRange onClick={() => applyQuickRange(90)}>90 days</QuickRange>
            {(fromDate || toDate) && (
              <button
                onClick={clearRange}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* ---------------- Period breakdown ---------------- */}
        <section className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <h2 className="text-base font-semibold text-[#1F3C71] px-6 py-4 border-b border-gray-100">
            {PERIODS.find((p) => p.value === period)?.label} breakdown
          </h2>
          {!periodGroups.length ? (
            <p className="px-6 py-10 text-sm text-gray-500 text-center">
              No sales in the selected range.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 sticky top-0">
                  <tr>
                    <Th>Period</Th>
                    <Th align="right">Sales</Th>
                    <Th align="right">Price</Th>
                    <Th align="right">VAT</Th>
                    <Th align="right">AIT</Th>
                    <Th align="right">Total</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {periodGroups.map((group) => (
                    <tr key={group.key} className="hover:bg-gray-50">
                      <Td className="font-medium text-gray-900">{group.label}</Td>
                      <Td align="right">{group.count}</Td>
                      <Td align="right">{money(group.price)}</Td>
                      <Td align="right" className="text-gray-500">
                        {money(group.vat)}
                      </Td>
                      <Td align="right" className="text-gray-500">
                        {money(group.ait)}
                      </Td>
                      <Td align="right" className="font-semibold text-[#0D529E]">
                        {money(group.total)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ---------------- Per service ---------------- */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1F3C71] mb-4">By service</h2>
          {!serviceGroups.length ? (
            <p className="text-sm text-gray-500">No sales in the selected range.</p>
          ) : (
            <ul className="space-y-3">
              {serviceGroups.map((group) => {
                const share = totals.revenue > 0 ? (group.total / totals.revenue) * 100 : 0;
                return (
                  <li key={group.label}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-gray-800">{group.label}</span>
                      <span className="font-semibold text-[#0D529E]">{money(group.total)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#28A8E0] rounded-full"
                          style={{ width: `${Math.max(share, 2)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 shrink-0 w-24 text-right">
                        {group.count} sale{group.count === 1 ? '' : 's'} · {share.toFixed(0)}%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* ---------------- Detail ---------------- */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#1F3C71]">
            Transactions{' '}
            <span className="font-normal text-gray-500 text-sm">({filtered.length})</span>
          </h2>
          <span className="text-xs text-gray-500">
            Download CSV exports all {filtered.length} matching rows, not just this page
          </span>
        </div>
        {!filtered.length ? (
          <p className="px-6 py-10 text-sm text-gray-500 text-center">
            No sales match the current filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>SL</Th>
                  <Th>Date</Th>
                  <Th>Client name</Th>
                  <Th>Service name</Th>
                  <Th>Package</Th>
                  <Th align="right">Price</Th>
                  <Th align="right">Total</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((sale, index) => (
                  <tr key={sale.uid} className="hover:bg-gray-50">
                    {/* SL runs across the whole filtered set, not per page. */}
                    <Td className="text-gray-400">{pageStart + index + 1}</Td>
                    <Td className="whitespace-nowrap">
                      {new Date(sale.purchaseDate).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      <span className="block text-[11px] text-gray-400">
                        {periodKeyFor(sale.purchaseDate, period).label}
                      </span>
                    </Td>
                    <Td className="font-medium text-gray-900">{sale.partnerName}</Td>
                    <Td>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#0D529E] whitespace-nowrap">
                        {sale.serviceLabel}
                      </span>
                    </Td>
                    <Td className="text-gray-600">{sale.packageName}</Td>
                    <Td align="right">{money(sale.price)}</Td>
                    <Td align="right" className="font-semibold">
                      {money(sale.total)}
                    </Td>
                    <Td>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          sale.status?.toLowerCase() === 'active'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                Showing <strong>{pageStart + 1}</strong>–
                <strong>{Math.min(pageStart + pageSize, filtered.length)}</strong> of{' '}
                <strong>{filtered.length}</strong>
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="ml-2 px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30"
              >
                {[25, 50, 100, 200].map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <PageButton
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                label="First page"
              >
                «
              </PageButton>
              <PageButton
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                label="Previous page"
              >
                ‹
              </PageButton>
              <span className="px-3 text-sm text-gray-600">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <PageButton
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                label="Next page"
              >
                ›
              </PageButton>
              <PageButton
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                label="Last page"
              >
                »
              </PageButton>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-[#0D529E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 text-[#0D529E]">
        {icon}
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold text-[#1F3C71] mt-2 break-words">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{hint}</p>
    </div>
  );
}

function QuickRange({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-[#0D529E] transition-colors"
    >
      {children}
    </button>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={`font-semibold px-6 py-2.5 whitespace-nowrap ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
  align = 'left',
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}) {
  return (
    <td className={`px-6 py-3 ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>
      {children}
    </td>
  );
}
