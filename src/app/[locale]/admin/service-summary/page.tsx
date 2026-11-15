'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { CONTROL, Tile, money } from '../components/reportControls';
import { downloadCsv } from '@/lib/api-client/reports';
import {
  DIMENSION_LABELS,
  DIRECTION_LABELS,
  DIRECTION_OPTIONS,
  PAYMENT_MODEL_FILTER_LABELS,
  PAYMENT_MODEL_OPTIONS,
  PERIOD_OPTIONS,
  ServiceTrafficError,
  getServiceTrafficOverview,
  getServiceTrafficReport,
  getTrafficPartners,
  getTrafficServices,
  type PartnerRef,
  type ServiceOverviewEntry,
  type ServiceTrafficReport,
  type TrafficDimension,
  type TrafficDirection,
  type TrafficPartnerOptions,
  type TrafficPaymentModelFilter,
  type TrafficPeriod,
  type TrafficServiceOption,
} from '@/lib/api-client/serviceTraffic';
import {
  ALL_COLUMNS,
  GROUP_LABELS,
  overviewColumnsFor,
  serviceOverviewCsv,
  btrcShareLabel,
  columnsFor,
  ratioText,
  serviceReportFileBase,
  share,
  serviceTrafficReportCsv,
  type ColumnToggles,
} from '@/lib/reports/serviceTrafficReport';

/**
 * One page for every service's traffic: pick the service, keep the filters.
 *
 * The switch dashboard reports traffic per service in each service's own portal, one page per
 * direction, with a period summary, group-by selectors for Customer / ANS / ICX and toggles for
 * performance, revenue and cost. Operators here work across services, so the service becomes a
 * dropdown and those filters stay as they are — same buckets, same groupings, same toggles, and
 * the same measures its summary queries select: calls, answered calls, actual / billed /
 * chargeable duration, revenue, ANS and carrier cost, VAT, ASR, ACD and PDD.
 *
 * What differs between services is in the answer, not hidden: the unit is named (minutes, or
 * SMS units, where a multipart message is billed several times); a measure the engine writes one
 * direction only is absent from the other half of the table rather than shown as zero; Bulk SMS
 * reports an answer ratio counted from its message records but no average duration; and a
 * service that keeps no traffic summaries at all says why instead of showing zeros.
 *
 * Access is governed by the admin menu permission system: '/admin/service-summary' is in
 * ADMIN_MENU_CATALOG, so the layout already refuses the route to an account that was not
 * granted it. The authoritative check is server side; this page only renders.
 */

/** yyyy-MM-dd in local time — the report's days are calendar days. */
const isoDay = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Month to date: the common question is what is happening now, and a closed month is one click away. */
const thisMonth = (): { fromDate: string; toDate: string } => {
  const now = new Date();
  return { fromDate: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), toDate: isoDay(now) };
};

const count = (n: number): string => n.toLocaleString('en-BD');
const units = (n: number): string =>
  n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TH = 'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500';
const TH_NUM = TH + ' text-right';
const TD = 'px-3 py-2 text-sm text-gray-700 whitespace-nowrap';
const TD_NUM = TD + ' text-right tabular-nums';

interface Filters {
  /** A service key, or '' for the all-services overview. */
  service: string;
  /** Which half of the traffic to report; the overview honours it too. */
  direction: TrafficDirection;
  fromDate: string;
  toDate: string;
  period: TrafficPeriod;
  groupBy: TrafficDimension[];
  customerId: number | null;
  ansId: number | null;
  icxId: number | null;
  /** ALL, or one of the two models. Only offered where the service records the flag. */
  paymentModel: TrafficPaymentModelFilter;
  show: ColumnToggles;
}

const EMPTY_PARTNERS: TrafficPartnerOptions = { customers: [], ans: [], icx: [] };

/** A labelled select, the same height as the toolbar's other controls. */
const Select = ({
  label,
  value,
  onChange,
  children,
  width = 'w-44',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  width?: string;
}) => (
  <label className="flex items-center gap-1.5 text-xs text-gray-500">
    {label}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={CONTROL + ' ' + width + ' disabled:opacity-50'}
    >
      {children}
    </select>
  </label>
);

/** A filter toggle, drawn like the dashboard's own pill toggles. */
const Toggle = ({
  label,
  on,
  onChange,
  title,
}: {
  label: string;
  on: boolean;
  onChange: (next: boolean) => void;
  title?: string;
}) => (
  <button
    type="button"
    title={title}
    onClick={() => onChange(!on)}
    className={
      'h-9 px-3 rounded-lg border text-sm font-medium transition-colors ' +
      (on
        ? 'border-[#0D529E] bg-[#0D529E]/5 text-[#0D529E]'
        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400')
    }
  >
    {label}
  </button>
);

export default function ServiceSummaryPage() {
  const [services, setServices] = useState<TrafficServiceOption[] | null>(null);
  const [partners, setPartners] = useState<TrafficPartnerOptions>(EMPTY_PARTNERS);
  const [filters, setFilters] = useState<Filters>(() => ({
    // Opens on the overview: before a service is chosen, "one service's traffic" has no
    // answer, and the first thing a reader wants is which service earned what.
    service: '',
    direction: 'outgoing',
    ...thisMonth(),
    // Date by date over the chosen range. "Whole period" collapses the range to a single row,
    // which is what the tiles already say.
    period: 'Daily',
    groupBy: ['customer'],
    customerId: null,
    ansId: null,
    icxId: null,
    paymentModel: 'ALL',
    show: { performance: false, revenue: true, cost: false },
  }));
  const [applied, setApplied] = useState<Filters | null>(null);
  const [report, setReport] = useState<ServiceTrafficReport | null>(null);
  const [overview, setOverview] = useState<ServiceOverviewEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const service = useMemo(
    () => services?.find((s) => s.key === filters.service) ?? null,
    [services, filters.service]
  );

  // ── the service dropdown, once ───────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setError('Your session has expired. Please sign in again.');
        return;
      }
      try {
        const list = await getTrafficServices(authToken, controller.signal);
        setServices(list);
      } catch (e) {
        if (axios.isCancel(e)) return;
        setServices([]);
        setError(e instanceof ServiceTrafficError ? e.message : 'Could not load the service list.');
      }
    })();
    return () => controller.abort();
  }, []);

  // ── that service's partner dropdowns, and a grouping it supports ─────────────────────────
  useEffect(() => {
    if (!service) return;
    setFilters((f) => ({
      ...f,
      groupBy: f.groupBy.filter(
        (d) => service.dimensions.includes(d)
          || (d === 'paymentModel' && service.paymentModelAvailable)
      ),
      customerId: service.dimensions.includes('customer') ? f.customerId : null,
      ansId: service.dimensions.includes('ans') ? f.ansId : null,
      icxId: service.dimensions.includes('icx') ? f.icxId : null,
      // A filter the new service cannot honour would be refused by the backend rather than
      // ignored, so it is cleared here instead of carried over from the previous service.
      paymentModel: service.paymentModelAvailable ? f.paymentModel : 'ALL',
    }));
    if (!service.available) {
      setPartners(EMPTY_PARTNERS);
      setReport(null);
      return;
    }
    const controller = new AbortController();
    (async () => {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;
      try {
        setPartners(await getTrafficPartners(authToken, service.key, controller.signal));
      } catch (e) {
        if (axios.isCancel(e)) return;
        // Only the dropdowns are lost; the report itself still works unfiltered.
        setPartners(EMPTY_PARTNERS);
      }
    })();
    return () => controller.abort();
  }, [service]);

  // ── the report ───────────────────────────────────────────────────────────────────────────
  const load = useCallback(async (f: Filters, signal?: AbortSignal) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setError('Your session has expired. Please sign in again.');
      return;
    }
    setLoading(true);
    setError('');

    // The overview asks every available service for a single ungrouped row. One unreachable
    // service keeps its line and says so rather than taking the page down with it.
    if (f.service === '') {
      try {
        const entries = await getServiceTrafficOverview(
          authToken,
          services ?? [],
          {
            fromDate: f.fromDate,
            toDate: f.toDate,
            paymentModel: f.paymentModel,
          },
          signal
        );
        setReport(null);
        setOverview(entries);
        const allFailed = entries.length > 0 && entries.every((e) => e.error);
        setError(allFailed ? 'No service could be read. ' + (entries[0].error ?? '') : '');
      } catch (e) {
        if (axios.isCancel(e)) return;
        setOverview(null);
        setError('The overview could not be prepared.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setOverview(null);
      setReport(
        await getServiceTrafficReport(
          authToken,
          {
            service: f.service,
            fromDate: f.fromDate,
            toDate: f.toDate,
            groupInterval: f.period,
            groupBy: f.groupBy,
            customerId: f.customerId,
            ansId: f.ansId,
            icxId: f.icxId,
            paymentModel: f.paymentModel,
          },
          signal
        )
      );
    } catch (e) {
      if (axios.isCancel(e)) return; // superseded by a newer request
      setReport(null);
      setError(e instanceof ServiceTrafficError ? e.message : 'The report could not be prepared.');
    } finally {
      setLoading(false);
    }
  }, [services]);

  useEffect(() => {
    if (!applied) return;
    const controller = new AbortController();
    load(applied, controller.signal);
    return () => controller.abort();
  }, [applied, load]);

  // Show something without making an admin press the button: the overview, as soon as the
  // service list it is built from has arrived.
  useEffect(() => {
    if (services && applied === null) setApplied(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services]);

  const isOverview = filters.service === '';
  /** What is on screen, which lags the controls until "Show report" is pressed. */
  const overviewMode = applied?.service === '';
  const invalidRange = filters.toDate < filters.fromDate;
  const canShow = (isOverview || !!service?.available) && !invalidRange && !loading;

  const setFilter = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const setShow = (patch: Partial<ColumnToggles>) =>
    setFilters((f) => ({ ...f, show: { ...f.show, ...patch } }));

  const toggleDimension = (dimension: TrafficDimension) =>
    setFilters((f) => ({
      ...f,
      groupBy: f.groupBy.includes(dimension)
        ? f.groupBy.filter((d) => d !== dimension)
        : [...f.groupBy, dimension],
    }));

  /** The filters in force, for the export's header. */
  const filterLines = (f: Filters): string[] => {
    const named = (list: PartnerRef[], id: number | null) =>
      id === null ? null : list.find((p) => p.id === id)?.name ?? `#${id}`;
    return (
      [
        ['Customer', named(partners.customers, f.customerId)],
        ['ANS', named(partners.ans, f.ansId)],
        ['ICX/IOS', named(partners.icx, f.icxId)],
      ] as const
    )
      .filter(([, value]) => value)
      .map(([label, value]) => `${label}: ${value}`);
  };

  const exportCsv = () => {
    if (!applied) return;
    let generatedBy: string | null = null;
    try {
      generatedBy = jwtDecode<{ sub?: string }>(localStorage.getItem('authToken') || '').sub || null;
    } catch {
      // An unreadable token only costs the "generated by" line.
    }
    if (overviewMode) {
      if (!overview) return;
      downloadCsv(
        serviceOverviewCsv(
          overview,
          { fromDate: applied.fromDate, toDate: applied.toDate },
          applied.direction,
          { generatedBy }
        ),
        `service-summary-all-services-${applied.fromDate}-to-${applied.toDate}.csv`
      );
      return;
    }
    if (!report) return;
    // Every column, whatever is toggled on screen: a spreadsheet is read later, by someone who
    // did not choose the toggles.
    downloadCsv(
      serviceTrafficReportCsv(
        report,
        { generatedBy, filters: filterLines(applied) },
        ALL_COLUMNS,
        applied.direction
      ),
      `${serviceReportFileBase(report)}.csv`
    );
  };

  const rows = report?.rows ?? [];
  const totals = report?.totals;
  const unit = report?.unit ?? 'minutes';

  /** One column set for the header, the body and the footer, so they cannot fall out of step. */
  const columns = useMemo(
    () => (report ? columnsFor(report, filters.show, applied?.direction ?? 'outgoing') : []),
    [report, filters.show, applied?.direction]
  );

  /** The overview's columns, which differ from the detail's: see overviewColumnsFor. */
  const overviewColumns = useMemo(
    () => overviewColumnsFor(applied?.direction ?? 'outgoing', filters.show),
    [applied?.direction, filters.show]
  );
  const overviewRows = overview ?? [];

  /** One figure from the overview's own total row, so the tiles and the table agree. */
  const overviewTotal = (key: string): string =>
    overviewColumns.find((c) => c.key === key)?.total(overviewRows) ?? '—';

  /**
   * The totals of the one direction on screen, or null when both are shown.
   *
   * With a direction chosen the tiles must report that direction, not the combined figure the
   * backend put in totals -- otherwise the headline and the table disagree.
   */
  /** The leg the ASR/answered headline describes, named so the tile cannot mislabel it. */
  const asrLeg = useMemo(() => {
    const incoming = applied?.direction === 'incoming';
    const leg = incoming
      ? report?.totals.incoming
      : report?.totals.outgoing;
    return {
      name: incoming ? 'Incoming' : 'Outgoing',
      leg: leg ?? { asr: null, successfulCalls: 0 },
    };
  }, [report, applied]);

  const legTotals = useMemo(() => {
    if (!report || !applied || applied.direction === 'both') return null;
    return applied.direction === 'incoming' ? report.totals.incoming : report.totals.outgoing;
  }, [report, applied]);

  /** The group header spans, so "Outgoing" sits over its own block of columns. */
  const groups = useMemo(() => {
    const spans: { group: string; label: string; span: number }[] = [];
    columns.forEach((column) => {
      const last = spans[spans.length - 1];
      if (last && last.group === column.group) last.span += 1;
      else spans.push({ group: column.group, label: GROUP_LABELS[column.group], span: 1 });
    });
    return spans;
  }, [columns]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Service Summary Report</h1>
          <p className="text-sm text-gray-500">
            {overviewMode
              ? 'Every service\u2019s totals for the period, from the billing summaries. Choose a service to break one of them down.'
              : 'Traffic for one service at a time, from the billing summaries \u2014 the same measures and groupings the switch dashboard offers, across every service.'}
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={
            loading || (overviewMode ? overviewRows.length === 0 : !report || rows.length === 0)
          }
          title="Every column, the totals and each row, as a spreadsheet"
          className="px-4 py-2 rounded-lg border border-[#0D529E] text-[#0D529E] text-sm font-medium hover:bg-[#0D529E]/5 disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {overviewMode ? (
          <>
            <Tile label="Services" value={overview ? count(overviewRows.length) : '—'} />
            <Tile
              label="Answered"
              value={overview ? overviewTotal('successfulCalls') : '—'}
            />
            <Tile
              label="Revenue (BDT)"
              value={overview ? money(overviewTotal('revenue')) : '—'}
              tone="text-green-700"
            />
            <Tile label="VAT & commission (BDT)" value={overview ? money(overviewTotal('vat')) : '—'} />
            <Tile label="BTRC share (BDT)" value={overview ? money(overviewTotal('btrcShare')) : '—'} />
          </>
        ) : (
          <>
        <Tile label="Rows" value={totals ? count(totals.rows) : '—'} />
        <Tile
          label={`Billed ${unit}`}
          value={totals ? units(legTotals ? legTotals.billedUnits : totals.totalBilledUnits) : '—'}
        />
        <Tile
          label="Revenue (BDT)"
          value={totals ? money((legTotals ? legTotals.revenue : totals.totalRevenue).toFixed(2)) : '—'}
          tone="text-green-700"
        />
        <Tile
          label={report ? `${btrcShareLabel(report)} (BDT)` : 'BTRC share'}
          value={
            totals && report
              ? money((legTotals ? share(legTotals.revenue, report) : totals.btrcShare).toFixed(2))
              : '—'
          }
        />
        {/* Follows the direction: an "Outgoing ASR" headline over an incoming table would
            describe traffic that is not on screen. With both shown it stays on outgoing,
            which is the half the ratio is usually read for. */}
        <Tile
          label={`${asrLeg.name} ${report?.asrAvailable ? 'ASR' : 'answered'}`}
          value={
            totals
              ? report?.asrAvailable
                ? ratioText(asrLeg.leg.asr)
                : count(asrLeg.leg.successfulCalls)
              : '—'
          }
        />
          </>
        )}
      </div>

      {/* The dashboard's filter set: service, range, period summary, group by, narrow to one
          partner, and which column families to show. */}
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            label="Service"
            value={filters.service}
            onChange={(v) => setFilter({ service: v })}
            width="w-48"
          >
            <option value="">All services (totals)</option>
            {(services ?? []).map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
                {s.available ? '' : ' (no summaries)'}
              </option>
            ))}
          </Select>

          <input
            type="date"
            aria-label="From date"
            title="From date"
            value={filters.fromDate}
            max={filters.toDate}
            className={CONTROL + ' w-[9.5rem]'}
            onChange={(e) => setFilter({ fromDate: e.target.value })}
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            aria-label="To date"
            title="To date"
            value={filters.toDate}
            min={filters.fromDate}
            className={CONTROL + ' w-[9.5rem]'}
            onChange={(e) => setFilter({ toDate: e.target.value })}
          />

          {/* The switch dashboard answers this by being two separate pages. Here the two
              halves come back in one response, so the reader picks which to look at rather
              than reading both side by side whether they want to or not. */}
          <Select
            label="Direction"
            value={filters.direction}
            onChange={(v) => setFilter({ direction: v as TrafficDirection })}
            width="w-48"
          >
            {DIRECTION_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {DIRECTION_LABELS[d]}
              </option>
            ))}
          </Select>

          <Select
            label="Summarise by"
            value={filters.period}
            onChange={(v) => setFilter({ period: v as TrafficPeriod })}
            width="w-32"
          >
            {PERIOD_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p === 'None' ? 'Whole period' : p}
              </option>
            ))}
          </Select>

          {service?.paymentModelAvailable && (
            <Select
              label="Charged as"
              value={filters.paymentModel}
              onChange={(v) => setFilter({ paymentModel: v as TrafficPaymentModelFilter })}
              width="w-44"
            >
              {PAYMENT_MODEL_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_MODEL_FILTER_LABELS[m]}
                </option>
              ))}
            </Select>
          )}

          <button
            onClick={() => setApplied(filters)}
            disabled={!canShow}
            className="px-4 py-2 rounded-lg bg-[#0D529E] text-white text-sm font-medium hover:bg-[#1F3C71] disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Show report'}
          </button>
          {invalidRange && <span className="text-xs text-red-600">The last day is before the first.</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {service && <span className="text-xs text-gray-500">Group by</span>}
          {(service?.dimensions ?? []).map((d) => (
            <Toggle
              key={d}
              label={DIMENSION_LABELS[d]}
              on={filters.groupBy.includes(d)}
              onChange={() => toggleDimension(d)}
              title={`One row per ${DIMENSION_LABELS[d].toLowerCase()}`}
            />
          ))}
          {service?.paymentModelAvailable && (
            <Toggle
              label={DIMENSION_LABELS.paymentModel}
              on={filters.groupBy.includes('paymentModel')}
              onChange={() => toggleDimension('paymentModel')}
              title="Split each row into the prepaid and postpaid traffic it was charged as"
            />
          )}

          {service?.dimensions.includes('customer') && partners.customers.length > 0 && (
            <Select
              label="Customer"
              value={filters.customerId === null ? '' : String(filters.customerId)}
              onChange={(v) => setFilter({ customerId: v === '' ? null : Number(v) })}
            >
              <option value="">All</option>
              {partners.customers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          )}
          {service?.dimensions.includes('ans') && partners.ans.length > 0 && (
            <Select
              label="ANS"
              value={filters.ansId === null ? '' : String(filters.ansId)}
              onChange={(v) => setFilter({ ansId: v === '' ? null : Number(v) })}
              width="w-40"
            >
              <option value="">All</option>
              {partners.ans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          )}
          {service?.dimensions.includes('icx') && partners.icx.length > 0 && (
            <Select
              label="ICX/IOS"
              value={filters.icxId === null ? '' : String(filters.icxId)}
              onChange={(v) => setFilter({ icxId: v === '' ? null : Number(v) })}
              width="w-36"
            >
              <option value="">All</option>
              {partners.icx.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          )}

          <span className="text-xs text-gray-500 ml-2">Show</span>
          <Toggle
            label="Performance"
            on={filters.show.performance}
            onChange={(v) => setShow({ performance: v })}
            title={
              service?.acdAvailable
                ? 'ASR, ACD and post-dial delay'
                : `ASR only: a ${service?.label ?? 'message'} item has a billable length and no duration`
            }
          />
          <Toggle
            label="Revenue"
            on={filters.show.revenue}
            onChange={(v) => setShow({ revenue: v })}
            title="Revenue, and VAT & commission where it is kept"
          />
          <Toggle
            label="Cost"
            on={filters.show.cost}
            onChange={(v) => setShow({ cost: v })}
            title="What the terminating operator and the carrier charged"
          />
        </div>
      </div>

      {service && !service.available && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
          {service.unavailableReason ||
            `${service.label} has no traffic summaries on this deployment.`}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {report?.asrUnavailableReason && filters.show.performance && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-xl px-4 py-3">
          {report.asrUnavailableReason}.
        </div>
      )}

      {report && report.unattributable.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-xl px-4 py-3">
          Incoming rows carry no{' '}
          {report.unattributable.map((d) => DIMENSION_LABELS[d]).join(' or ')}, so their traffic is
          reported on a row marked “Not attributable” rather than split across the ones that do.
        </div>
      )}

      {/*
        How much of the split could not be settled, stated rather than left to be counted by
        eye. The figures on a Mixed row are that whole bucket's: the summary tables carry no
        payment-model column, so a bucket charged both ways cannot be divided, and splitting it
        by guesswork would put a wrong number next to a right one.
      */}
      {report && report.mixedPaymentModelRows > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl px-4 py-3">
          {report.mixedPaymentModelRows === 1
            ? 'One row is marked “Mixed”: its'
            : `${report.mixedPaymentModelRows} rows are marked “Mixed”: their`}{' '}
          traffic was charged both prepaid and postpaid within the same bucket, and the summary
          tables these figures come from keep no payment-model column, so it cannot be divided.
          Those figures are the whole bucket&apos;s. Grouping more finely — by customer, or by a
          shorter period — leaves fewer of them.
        </div>
      )}

      {report && !report.paymentModelAvailable && report.paymentModelUnavailableReason && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-xl px-4 py-3">
          {report.paymentModelUnavailableReason}
        </div>
      )}

      {overviewMode && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {overviewColumns.map((column) => (
                    <th key={column.key} className={column.numeric ? TH_NUM : TH}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && overviewRows.length === 0 && (
                  <tr>
                    <td className="px-3 py-8 text-center text-sm text-gray-400" colSpan={overviewColumns.length}>
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && overviewRows.length === 0 && (
                  <tr>
                    <td className="px-3 py-8 text-center text-sm text-gray-400" colSpan={overviewColumns.length}>
                      No service on this deployment keeps traffic summaries.
                    </td>
                  </tr>
                )}
                {overviewRows.map((entry) => (
                  <tr
                    key={entry.key}
                    className={entry.error ? 'bg-red-50/40' : 'hover:bg-gray-50 cursor-pointer'}
                    // The row is the way into the service: the figure you are looking at is
                    // the one you want broken down.
                    onClick={() => entry.report && setFilters((f) => ({ ...f, service: entry.key }))}
                    title={entry.error ? undefined : `Break down ${entry.label}`}
                  >
                    {overviewColumns.map((column) => (
                      <td
                        key={column.key}
                        className={
                          column.numeric
                            ? TD_NUM
                            : TD + (column.key === 'service' ? ' font-medium text-gray-900' : '')
                        }
                      >
                        {column.key === 'service' && entry.error ? (
                          <span>
                            {entry.label}
                            <span className="block text-xs font-normal text-red-600">{entry.error}</span>
                          </span>
                        ) : (
                          column.value(entry)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {overviewRows.length > 0 && (
                <tfoot className="bg-gray-50 font-semibold text-gray-900">
                  <tr>
                    {overviewColumns.map((column) => (
                      <td key={column.key} className={column.numeric ? TD_NUM : TD}>
                        {column.total(overviewRows)}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {overviewMode && overviewRows.length > 0 && (
        <p className="text-xs text-gray-400">
          {DIRECTION_LABELS[applied?.direction ?? 'outgoing']} traffic, {applied?.fromDate} to{' '}
          {applied?.toDate}. Services are measured in different units — minutes for voice, SMS
          units for messages — so the duration columns are not added up across services; the
          money columns are. Choose a service above, or click its row, to break one down.
        </p>
      )}

      {!overviewMode && (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {/* Two header rows: each direction carries the same measures, and repeating
                  "Outgoing" in every column title would make the table unreadable. */}
              <tr>
                {groups.map((g, i) => (
                  <th key={g.group + i} className={g.group === 'row' ? TH : TH_NUM} colSpan={g.span}>
                    {g.label}
                  </th>
                ))}
              </tr>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={column.numeric ? TH_NUM : TH}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && rows.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-sm text-gray-400" colSpan={Math.max(columns.length, 1)}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && !error && (
                <tr>
                  <td className="px-3 py-8 text-center text-sm text-gray-400" colSpan={Math.max(columns.length, 1)}>
                    {service?.available
                      ? 'No traffic matched these filters.'
                      : 'Choose a service with traffic summaries.'}
                  </td>
                </tr>
              )}
              {rows.map((row, i) => (
                <tr
                  key={`${row.period ?? ''}-${row.customerId ?? ''}-${row.ansId ?? ''}-${row.icxId ?? ''}-${i}`}
                  className="hover:bg-gray-50"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={
                        column.numeric
                          ? TD_NUM
                          : TD + (column.group === 'row' ? ' font-medium text-gray-900' : '')
                      }
                    >
                      {column.value(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {report && (
        <p className="text-xs text-gray-400">
          Read from {report.tables.join(' and ') || 'the billing summaries'}.{' '}
          {report.asrAvailable && report.asrBasis ? `ASR is ${report.asrBasis}. ` : ''}
          {!report.acdAvailable
            ? `A ${report.serviceLabel} message has a billable length and no duration, so no average duration is reported. `
            : ''}
          {report.totals.incoming.chargeableUnits === null && report.measures.includes('chargeableUnits')
            ? 'Chargeable duration and the costs are written on outgoing rows only, so the incoming side reports none rather than zero. '
            : ''}
          Billed {unit} are what invoices are raised on, and BTRC's share is{' '}
          {btrcShareLabel(report).replace('BTRC share (', '').replace(')', '')} of the revenue
          these filters matched. The CSV export carries every column, whichever are shown here.
        </p>
      )}
    </div>
  );
}
