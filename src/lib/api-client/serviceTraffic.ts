import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

/**
 * Traffic for one BTCL service, grouped the way the switch dashboard groups it.
 *
 * The dashboard reports each service in its own portal, one page per direction. Here the
 * service is a parameter: one page, a dropdown, and the same filters whichever service is
 * chosen — period bucket, group by customer / ANS / ICX, narrow to one of them.
 *
 * The measures are the ones the dashboard's own summary queries select: calls attempted,
 * answered and connected; actual, billed and chargeable duration; revenue, the ANS and carrier
 * costs and the VAT/commission; and ASR, ACD and PDD. Everything is computed by the main
 * backend from the pre-aggregated summary tables each service's billing engine writes. The
 * browser aggregates nothing: a second sum would disagree with billing the first time a call
 * straddled midnight, and then two reports would both claim to be the truth.
 *
 * Differences between services are in the data rather than hidden. `unit` is what one unit means
 * ("minutes", or "SMS units" where a multipart message is billed several times). `measures` lists
 * the optional ones this service keeps, so a column that would be empty is simply not drawn, and
 * a measure a direction does not keep is null rather than zero — the engine writes chargeable
 * duration and the costs on outgoing rows only. `asrAvailable` / `acdAvailable` say which ratios
 * apply, and `asrBasis` what the ratio divides, since for SMS it is counted from the message
 * records rather than the summaries, which record every submission as delivered.
 */

export type TrafficDimension = 'customer' | 'ans' | 'icx' | 'paymentModel';

/**
 * Whether the traffic was charged prepaid or postpaid.
 *
 * Taken from the charge-time flag on each service's own event records -- cdr.PrePaid for voice,
 * campaign_task.isPrepaid for Bulk SMS -- and never from a partner's present configuration: a
 * customer who moved to postpaid in August must not have their July prepaid traffic relabelled
 * by a report run today.
 *
 * MIXED is an outcome, not a choice. The summary tables the figures come from carry no
 * payment-model column, so a bucket whose traffic was charged both ways cannot be split and is
 * reported whole under MIXED. Grouping more finely leaves fewer of them; a customer who never
 * switched model leaves none.
 */
export type TrafficPaymentModel = 'PREPAID' | 'POSTPAID' | 'MIXED';

/** What the filter offers. MIXED is absent on purpose -- it is a result, never a request. */
export const PAYMENT_MODEL_OPTIONS = ['ALL', 'PREPAID', 'POSTPAID'] as const;
export type TrafficPaymentModelFilter = (typeof PAYMENT_MODEL_OPTIONS)[number];

/**
 * The filter's options, worded as a choice.
 *
 * Deliberately not the same strings as the cell labels below: "Prepaid only" is what you are
 * asking the report for, "Prepaid" is what a row turned out to be. Sharing one map made a table
 * cell read "Prepaid only", which states a filter rather than a fact about that row.
 */
export const PAYMENT_MODEL_FILTER_LABELS: Record<TrafficPaymentModelFilter, string> = {
  ALL: 'Prepaid and postpaid',
  PREPAID: 'Prepaid only',
  POSTPAID: 'Postpaid only',
};

/** What a row's model is called in the table and the export. */
export const PAYMENT_MODEL_LABELS: Record<TrafficPaymentModel, string> = {
  PREPAID: 'Prepaid',
  POSTPAID: 'Postpaid',
  MIXED: 'Mixed',
};

/** The optional measures, named as the backend names them. */
export type TrafficMeasure = 'chargeableUnits' | 'ansCost' | 'carrierCost' | 'vat' | 'pdd';

/**
 * Which half of the traffic to report.
 *
 * The switch dashboard answers this by being two pages -- Domestic Out and Domestic In -- so a
 * reader there never sees the two mixed. This report holds both in one response, because a
 * single query reads both directions from the same summary tables, and lets the reader choose.
 * "both" is the side-by-side view; either single direction shows that half alone.
 */
export const DIRECTION_OPTIONS = ['outgoing', 'incoming', 'both'] as const;
export type TrafficDirection = (typeof DIRECTION_OPTIONS)[number];

export const DIRECTION_LABELS: Record<TrafficDirection, string> = {
  outgoing: 'Outgoing',
  incoming: 'Incoming',
  both: 'Outgoing and incoming',
};

export const direction = (value: unknown): TrafficDirection =>
  DIRECTION_OPTIONS.includes(value as TrafficDirection) ? (value as TrafficDirection) : 'outgoing';

export const PERIOD_OPTIONS = ['None', 'Hourly', 'Daily', 'Weekly', 'Monthly', 'Yearly'] as const;
export type TrafficPeriod = (typeof PERIOD_OPTIONS)[number];

/** What each dimension is called in the UI, matching the dashboard's own labels. */
export const DIMENSION_LABELS: Record<TrafficDimension, string> = {
  customer: 'Customer',
  ans: 'ANS',
  icx: 'ICX/IOS',
  paymentModel: 'Payment model',
};

/** What each optional measure is called in the UI. */
export const MEASURE_LABELS: Record<TrafficMeasure, string> = {
  chargeableUnits: 'Chargeable',
  ansCost: 'ANS cost',
  carrierCost: 'ICX/IOS cost',
  vat: 'VAT & commission',
  pdd: 'PDD',
};

export interface TrafficServiceOption {
  key: string;
  label: string;
  unit: string;
  available: boolean;
  /** Why this service has no report — shown instead of an empty table. */
  unavailableReason: string | null;
  asrAvailable: boolean;
  acdAvailable: boolean;
  measures: TrafficMeasure[];
  dimensions: TrafficDimension[];
  /** Whether this service records a charge-time prepaid/postpaid flag at all. */
  paymentModelAvailable: boolean;
  /** Why it does not, so the control can say so instead of being silently absent. */
  paymentModelUnavailableReason: string | null;
  /** The dimensions a payment-model split can be attributed to on this service. */
  paymentModelDimensions: TrafficDimension[];
}

export interface PartnerRef {
  id: number;
  name: string;
}

export interface TrafficPartnerOptions {
  customers: PartnerRef[];
  ans: PartnerRef[];
  icx: PartnerRef[];
}

/**
 * One direction's figures.
 *
 * A null is "not kept this way round", which is why these are not defaulted to zero: the
 * engine writes chargeable duration and the two costs on outgoing rows only, and a 0.00 would
 * read as "nothing was chargeable".
 */
export interface TrafficLeg {
  totalCalls: number;
  successfulCalls: number;
  connectedCalls: number;
  actualUnits: number;
  billedUnits: number;
  chargeableUnits: number | null;
  revenue: number;
  ansCost: number | null;
  carrierCost: number | null;
  vat: number | null;
  asr: number | null;
  acd: number | null;
  pdd: number | null;
}

export interface TrafficRow {
  /** The period bucket, or null when the whole range is one bucket. */
  period: string | null;
  customerId: number | null;
  customerName: string | null;
  ansId: number | null;
  ansName: string | null;
  icxId: number | null;
  icxName: string | null;
  /** PREPAID | POSTPAID | MIXED, or null when the report was not grouped by payment model. */
  paymentModel: TrafficPaymentModel | null;
  outgoing: TrafficLeg;
  incoming: TrafficLeg;
  totalBilledUnits: number;
  totalRevenue: number;
  /** BTRC's share of this row's revenue, at the rate the response names. */
  btrcShare: number;
}

export interface TrafficTotals {
  rows: number;
  outgoing: TrafficLeg;
  incoming: TrafficLeg;
  totalBilledUnits: number;
  totalRevenue: number;
  /** BTRC's share of the filtered total, taken from that total. */
  btrcShare: number;
}

export interface ServiceTrafficReport {
  service: string;
  serviceLabel: string;
  unit: string;
  asrAvailable: boolean;
  acdAvailable: boolean;
  /** What the ASR divides, e.g. "delivered ÷ submitted messages, from campaign_task". */
  asrBasis: string | null;
  /** Why this grouping reports no ASR, when the service normally has one. */
  asrUnavailableReason: string | null;
  /** The optional measures this service keeps. */
  measures: TrafficMeasure[];
  /** The percentage BTRC's share was taken at, so the column can name its own rate. */
  btrcSharePercent: number;
  fromDate: string;
  toDate: string;
  /** '' when the whole range is one bucket. */
  groupInterval: string;
  groupBy: TrafficDimension[];
  tables: string[];
  /** Dimensions one direction could not attribute; those rows carry it empty. */
  unattributable: TrafficDimension[];
  /** Whether a prepaid/postpaid split was possible for this service. */
  paymentModelAvailable: boolean;
  paymentModelUnavailableReason: string | null;
  /**
   * How many returned rows could not be resolved to one model.
   *
   * The one number that says how much of this report the split could not settle, so it is shown
   * rather than left for someone to count the MIXED rows by eye.
   */
  mixedPaymentModelRows: number;
  rows: TrafficRow[];
  totals: TrafficTotals;
}

export interface ServiceTrafficQuery {
  service: string;
  /** Inclusive, yyyy-MM-dd. */
  fromDate: string;
  /** Inclusive, yyyy-MM-dd — the whole day counts. */
  toDate: string;
  groupInterval?: TrafficPeriod;
  groupBy?: TrafficDimension[];
  customerId?: number | null;
  ansId?: number | null;
  icxId?: number | null;
  /** ALL, or one of the two models. Absent reads as ALL. */
  paymentModel?: TrafficPaymentModelFilter;
}

export class ServiceTrafficError extends Error {
  constructor(
    readonly kind: 'unauthorized' | 'forbidden' | 'badRequest' | 'server' | 'network',
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'ServiceTrafficError';
  }
}

/** A figure the backend sent, as a number. Absent or unparseable reads as 0. */
const num = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** A figure that may legitimately be absent: null stays null, so "not kept" survives. */
const optional = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const id = (value: unknown): number | null => optional(value);

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null;

const toLeg = (raw: unknown): TrafficLeg => {
  const l = (raw ?? {}) as Record<string, unknown>;
  return {
    totalCalls: num(l.totalCalls),
    successfulCalls: num(l.successfulCalls),
    connectedCalls: num(l.connectedCalls),
    actualUnits: num(l.actualUnits),
    billedUnits: num(l.billedUnits),
    chargeableUnits: optional(l.chargeableUnits),
    revenue: num(l.revenue),
    ansCost: optional(l.ansCost),
    carrierCost: optional(l.carrierCost),
    vat: optional(l.vat),
    asr: optional(l.asr),
    acd: optional(l.acd),
    pdd: optional(l.pdd),
  };
};

const toRow = (raw: Record<string, unknown>): TrafficRow => ({
  period: text(raw.period),
  customerId: id(raw.customerId),
  customerName: text(raw.customerName),
  ansId: id(raw.ansId),
  ansName: text(raw.ansName),
  icxId: id(raw.icxId),
  icxName: text(raw.icxName),
  paymentModel: paymentModel(raw.paymentModel),
  outgoing: toLeg(raw.outgoing),
  incoming: toLeg(raw.incoming),
  totalBilledUnits: num(raw.totalBilledUnits),
  totalRevenue: num(raw.totalRevenue),
  btrcShare: num(raw.btrcShare),
});

const dimensions = (value: unknown): TrafficDimension[] =>
  Array.isArray(value)
    ? value.filter((d): d is TrafficDimension =>
        Object.prototype.hasOwnProperty.call(DIMENSION_LABELS, d as string))
    : [];

/** A model the backend sent. Anything unrecognised is null, not a guess. */
const paymentModel = (value: unknown): TrafficPaymentModel | null =>
  value === 'PREPAID' || value === 'POSTPAID' || value === 'MIXED' ? value : null;

const measures = (value: unknown): TrafficMeasure[] =>
  Array.isArray(value)
    ? value.filter((m): m is TrafficMeasure => Object.prototype.hasOwnProperty.call(MEASURE_LABELS, m as string))
    : [];

export const normaliseServiceTrafficReport = (data: unknown): ServiceTrafficReport => {
  const body = (data ?? {}) as Record<string, unknown>;
  const rawRows = Array.isArray(body.rows) ? body.rows : [];
  const totalsRaw = (body.totals ?? {}) as Record<string, unknown>;
  return {
    service: typeof body.service === 'string' ? body.service : '',
    serviceLabel: typeof body.serviceLabel === 'string' ? body.serviceLabel : '',
    unit: typeof body.unit === 'string' && body.unit !== '' ? body.unit : 'minutes',
    asrAvailable: body.asrAvailable === true,
    acdAvailable: body.acdAvailable === true,
    asrBasis: text(body.asrBasis),
    asrUnavailableReason: text(body.asrUnavailableReason),
    measures: measures(body.measures),
    btrcSharePercent: num(body.btrcSharePercent),
    fromDate: typeof body.fromDate === 'string' ? body.fromDate : '',
    toDate: typeof body.toDate === 'string' ? body.toDate : '',
    groupInterval: typeof body.groupInterval === 'string' ? body.groupInterval : '',
    groupBy: dimensions(body.groupBy),
    tables: Array.isArray(body.tables) ? body.tables.filter((t): t is string => typeof t === 'string') : [],
    unattributable: dimensions(body.unattributable),
    paymentModelAvailable: body.paymentModelAvailable === true,
    paymentModelUnavailableReason: text(body.paymentModelUnavailableReason),
    mixedPaymentModelRows: num(body.mixedPaymentModelRows),
    rows: rawRows.map((r) => toRow((r ?? {}) as Record<string, unknown>)),
    totals: {
      rows: num(totalsRaw.rows),
      outgoing: toLeg(totalsRaw.outgoing),
      incoming: toLeg(totalsRaw.incoming),
      totalBilledUnits: num(totalsRaw.totalBilledUnits),
      totalRevenue: num(totalsRaw.totalRevenue),
      btrcShare: num(totalsRaw.btrcShare),
    },
  };
};

const fail = (e: unknown): never => {
  if (axios.isCancel(e)) throw e;
  if (axios.isAxiosError(e)) {
    const status = e.response?.status;
    if (status === 401) {
      throw new ServiceTrafficError('unauthorized', 'Your session has expired. Please sign in again.', status);
    }
    if (status === 403) {
      throw new ServiceTrafficError('forbidden', 'Your account does not have access to service traffic reports.', status);
    }
    if (status === 400) {
      const message = (e.response?.data as { message?: string } | undefined)?.message;
      throw new ServiceTrafficError('badRequest', message || 'Check the filters and try again.', status);
    }
    if (status) {
      throw new ServiceTrafficError('server', 'The report could not be prepared. Please try again.', status);
    }
    throw new ServiceTrafficError('network', 'Could not reach the server. Check your connection and try again.');
  }
  throw e;
};

/**
 * Where the report endpoints live.
 *
 * Production always uses the main backend. In development NEXT_PUBLIC_REPORT_API_URL can point
 * at a local bridge instead, which is how this page is worked on without a backend to hand --
 * the same escape hatch the regulatory report uses, and inert in a production build.
 */
const REPORT_API_BASE =
  (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_REPORT_API_URL) || API_BASE_URL;

const auth = (authToken: string) => ({
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
  timeout: 120_000,
});

export const getTrafficServices = async (
  authToken: string,
  signal?: AbortSignal
): Promise<TrafficServiceOption[]> => {
  try {
    const response = await axios.get<unknown>(
      `${REPORT_API_BASE}${API_ENDPOINTS.reports.trafficServices}`,
      { ...auth(authToken), signal }
    );
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map((raw) => {
      const s = (raw ?? {}) as Record<string, unknown>;
      return {
        key: typeof s.key === 'string' ? s.key : '',
        label: typeof s.label === 'string' ? s.label : '',
        unit: typeof s.unit === 'string' && s.unit !== '' ? s.unit : 'minutes',
        available: s.available === true,
        unavailableReason: text(s.unavailableReason),
        asrAvailable: s.asrAvailable === true,
        acdAvailable: s.acdAvailable === true,
        measures: measures(s.measures),
        dimensions: dimensions(s.dimensions),
        paymentModelAvailable: s.paymentModelAvailable === true,
        paymentModelUnavailableReason: text(s.paymentModelUnavailableReason),
        paymentModelDimensions: dimensions(s.paymentModelDimensions),
      };
    });
  } catch (e) {
    return fail(e);
  }
};

export const getTrafficPartners = async (
  authToken: string,
  service: string,
  signal?: AbortSignal
): Promise<TrafficPartnerOptions> => {
  const list = (value: unknown): PartnerRef[] =>
    Array.isArray(value)
      ? value
          .map((raw) => (raw ?? {}) as Record<string, unknown>)
          .filter((p) => id(p.id) !== null)
          .map((p) => ({ id: id(p.id) as number, name: text(p.name) ?? `#${id(p.id)}` }))
      : [];
  try {
    const response = await axios.get<unknown>(
      `${REPORT_API_BASE}${API_ENDPOINTS.reports.trafficPartners}`,
      { ...auth(authToken), params: { service }, signal }
    );
    const body = (response.data ?? {}) as Record<string, unknown>;
    return { customers: list(body.customers), ans: list(body.ans), icx: list(body.icx) };
  } catch (e) {
    return fail(e);
  }
};

export const getServiceTrafficReport = async (
  authToken: string,
  query: ServiceTrafficQuery,
  signal?: AbortSignal
): Promise<ServiceTrafficReport> => {
  try {
    const response = await axios.post<unknown>(
      `${REPORT_API_BASE}${API_ENDPOINTS.reports.serviceTraffic}`,
      {
        ...query,
        // "None" is the absence of a bucket, which the backend spells as an empty value.
        groupInterval: query.groupInterval === 'None' ? '' : query.groupInterval,
      },
      { ...auth(authToken), signal }
    );
    return normaliseServiceTrafficReport(response.data);
  } catch (e) {
    return fail(e);
  }
};

/**
 * One service's line in the overview.
 *
 * A service that could not be read keeps its row and carries the reason: three services live in
 * three databases on two hosts, so one being unreachable is a normal state, and dropping it
 * silently would quietly understate every total on the page.
 */
export interface ServiceOverviewEntry {
  key: string;
  label: string;
  unit: string;
  report: ServiceTrafficReport | null;
  error: string | null;
}

/**
 * Totals for every service that has summaries, one row each.
 *
 * This is the landing view: before a service is chosen there is nothing sensible to show for
 * "one service", and a reader opening the page wants to know which service earned what.
 *
 * It asks each service for a single ungrouped row over the whole range, which is the cheapest
 * question the report endpoint answers, and runs them together. Each service signs its own
 * tokens and lives in its own database, so these are genuinely independent requests; one
 * failing leaves the rest standing.
 */
export const getServiceTrafficOverview = async (
  authToken: string,
  services: TrafficServiceOption[],
  query: Omit<ServiceTrafficQuery, 'service' | 'groupBy' | 'groupInterval'>,
  signal?: AbortSignal
): Promise<ServiceOverviewEntry[]> => {
  const wanted = services.filter((s) => s.available);
  const settled = await Promise.allSettled(
    wanted.map((s) =>
      getServiceTrafficReport(
        authToken,
        {
          ...query,
          service: s.key,
          groupInterval: 'None',
          groupBy: [],
          // A service that does not record the flag would refuse the filter outright, so it is
          // asked for everything and its row says so.
          paymentModel: s.paymentModelAvailable ? query.paymentModel : 'ALL',
        },
        signal
      )
    )
  );
  return wanted.map((s, i) => {
    const outcome = settled[i];
    if (outcome.status === 'fulfilled') {
      return { key: s.key, label: s.label, unit: s.unit, report: outcome.value, error: null };
    }
    const reason = outcome.reason;
    return {
      key: s.key,
      label: s.label,
      unit: s.unit,
      report: null,
      error: reason instanceof ServiceTrafficError ? reason.message : 'Could not be read.',
    };
  });
};
