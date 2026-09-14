import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

/**
 * IPTSP / BTRC monthly regulatory report.
 *
 * BTCL files two monthly returns that are built from the same softswitch/CDR data:
 *
 *   1. The operator's own detailed IPTSP report — subscribers (active + provisioned),
 *      IPTSP↔IPTSP call-minutes, ICX↔IPTSP call-minutes per ICX, and capacity of installation.
 *   2. The BTRC submission — one flat row per operator re-bucketing the same call-minutes into
 *      the regulator's categories, plus A2P and P2P SMS per mobile operator.
 *
 * Both are assembled by hand today from raw switch spreadsheets. This module models the whole
 * month as one object so a single backend endpoint can compute it straight from the databases
 * and the admin screen can render — and export — both returns without re-keying anything.
 *
 * The shape here is the contract the backend must satisfy. There is deliberately no sample or
 * fallback data: this feeds a regulatory submission, so when the real report cannot be loaded the
 * page shows an error and nothing else — never figures that could be mistaken for the month's.
 */

// ── subscribers ──────────────────────────────────────────────────────────────
// One row per zone. Columns split prepaid/postpaid and, within each, the three counts BTRC
// asks for: individual numbers, corporate numbers, corporate channels/SIP ports.
export interface SubscriberZoneRow {
  zone: string;
  prepaidIndividual: number;
  prepaidCorporateNumbers: number;
  prepaidCorporateChannels: number;
  postpaidIndividual: number;
  postpaidCorporateNumbers: number;
  postpaidCorporateChannels: number;
}

// ── 2A. IPTSP ↔ IPTSP billing minutes ────────────────────────────────────────
// On-net = within BTCL's own network; other = terminated on/received from another IPTSP.
export interface IptspIptspMinutes {
  outOnnetMinutes: number;
  outOnnetCalls: number;
  outOtherMinutes: number;
  outOtherCalls: number;
  inOnnetMinutes: number;
  inOnnetCalls: number;
  inOtherMinutes: number;
  inOtherCalls: number;
}

// ── 2B. ICX ↔ IPTSP billing minutes (per ICX) ────────────────────────────────
// Off-net = termination to/from another network via the ICX; international = IDD via the ICX.
export interface IcxRow {
  icxName: string;
  e1Count: number;
  outOffnetMinutes: number;
  outOffnetCalls: number;
  outIntlMinutes: number;
  outIntlCalls: number;
  inOffnetMinutes: number;
  inOffnetCalls: number;
  inIntlMinutes: number;
  inIntlCalls: number;
}

// ── 3. Capacity of installation ──────────────────────────────────────────────
export interface IcxConnectivityRow {
  icxName: string;
  e1: number;
}

export interface PopRow {
  address: string;
  mediaGateways: number;
}

// ── C. Bi-lateral SMS connectivity ───────────────────────────────────────────
export interface BilateralSmsRow {
  ansPstnName: string;
  e1: number;
  intlSmsIn: number;
  intlSmsOut: number;
  domSmsIn: number;
  domSmsOut: number;
}

// ── BTRC flat submission ─────────────────────────────────────────────────────
export interface OperatorSmsRow {
  operator: string; // Grameenphone | Robi | Banglalink | Teletalk
  incoming: number;
  outgoing: number;
}

export interface BtrcCallVolume {
  domMobileIn: number; // Domestic (Mobile Dialer)
  domMobileOut: number;
  domOthersIn: number; // Domestic (Others)
  domOthersOut: number;
  tollFreeIn: number; // Domestic (Toll Free / LTFS)
  tollFreeOut: number;
  intlIn: number; // International
  intlOut: number;
  total: number;
}

export interface BtrcSummary {
  /** Total subscribers (BTRC column E). */
  subscribers: number;
  /** BTRC subscriber split (columns B/C/D). If omitted, download treats all as App Based. */
  subscriberAppBased?: number;
  subscriberNonAppIndividual?: number;
  subscriberNonAppCorporate?: number;
  callVolume: BtrcCallVolume;
  a2pSms: OperatorSmsRow[];
  p2pSms: OperatorSmsRow[];
}

export interface RegulatoryMonthlyReport {
  operatorName: string;
  licenseType: string;
  operationStartDate: string;
  /** Full month name, e.g. "January". */
  reportingMonth: string;
  reportingYear: number;

  activeSubscribers: SubscriberZoneRow[];
  provisionedSubscribers: SubscriberZoneRow[];
  iptspIptsp: IptspIptspMinutes;
  icxRows: IcxRow[];
  icxConnectivity: IcxConnectivityRow[];
  pops: PopRow[];
  bilateralSms: BilateralSmsRow[];

  btrc: BtrcSummary;

  /** Set by the backend when it computed the report. */
  generatedAt?: string;
}

export interface RegulatoryReportQuery {
  /** 1–12. */
  month: number;
  year: number;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── totals ───────────────────────────────────────────────────────────────────

const ZERO_ZONE: Omit<SubscriberZoneRow, 'zone'> = {
  prepaidIndividual: 0,
  prepaidCorporateNumbers: 0,
  prepaidCorporateChannels: 0,
  postpaidIndividual: 0,
  postpaidCorporateNumbers: 0,
  postpaidCorporateChannels: 0,
};

/** Column-wise total across every zone row — the "Total" line under each subscriber table. */
export const totalSubscribers = (rows: SubscriberZoneRow[]): SubscriberZoneRow =>
  rows.reduce<SubscriberZoneRow>(
    (acc, row) => ({
      zone: 'Total',
      prepaidIndividual: acc.prepaidIndividual + row.prepaidIndividual,
      prepaidCorporateNumbers: acc.prepaidCorporateNumbers + row.prepaidCorporateNumbers,
      prepaidCorporateChannels: acc.prepaidCorporateChannels + row.prepaidCorporateChannels,
      postpaidIndividual: acc.postpaidIndividual + row.postpaidIndividual,
      postpaidCorporateNumbers: acc.postpaidCorporateNumbers + row.postpaidCorporateNumbers,
      postpaidCorporateChannels: acc.postpaidCorporateChannels + row.postpaidCorporateChannels,
    }),
    { zone: 'Total', ...ZERO_ZONE }
  );

/** Sum of a zone row's six counts — the single "head count" for that zone. */
export const zoneHeadCount = (row: SubscriberZoneRow): number =>
  row.prepaidIndividual +
  row.prepaidCorporateNumbers +
  row.prepaidCorporateChannels +
  row.postpaidIndividual +
  row.postpaidCorporateNumbers +
  row.postpaidCorporateChannels;

/** Row-wise total across the per-ICX rows — the "Total" line in section 2B. */
export const totalIcx = (rows: IcxRow[]): Omit<IcxRow, 'icxName' | 'e1Count'> =>
  rows.reduce(
    (acc, row) => ({
      outOffnetMinutes: acc.outOffnetMinutes + row.outOffnetMinutes,
      outOffnetCalls: acc.outOffnetCalls + row.outOffnetCalls,
      outIntlMinutes: acc.outIntlMinutes + row.outIntlMinutes,
      outIntlCalls: acc.outIntlCalls + row.outIntlCalls,
      inOffnetMinutes: acc.inOffnetMinutes + row.inOffnetMinutes,
      inOffnetCalls: acc.inOffnetCalls + row.inOffnetCalls,
      inIntlMinutes: acc.inIntlMinutes + row.inIntlMinutes,
      inIntlCalls: acc.inIntlCalls + row.inIntlCalls,
    }),
    {
      outOffnetMinutes: 0, outOffnetCalls: 0, outIntlMinutes: 0, outIntlCalls: 0,
      inOffnetMinutes: 0, inOffnetCalls: 0, inIntlMinutes: 0, inIntlCalls: 0,
    }
  );

const smsTotal = (rows: OperatorSmsRow[]) =>
  rows.reduce(
    (acc, r) => ({ incoming: acc.incoming + r.incoming, outgoing: acc.outgoing + r.outgoing }),
    { incoming: 0, outgoing: 0 }
  );

// ── fetch ────────────────────────────────────────────────────────────────────

/**
 * Why a report request failed, in the terms the admin screen explains it.
 *
 *   unauthorized — no session, or the backend said 401.
 *   forbidden    — 403. On this route the gateway answers an expired/invalid token with the same
 *                  bare 403 as a genuine permission refusal, so the two cannot be told apart.
 *   timeout      — no answer within REPORT_TIMEOUT_MS.
 *   network      — the request never got a response (offline, DNS, blocked, CORS).
 *   server       — 5xx, or any other non-2xx status.
 *   unexpected   — a 2xx whose body is not a report for the requested month.
 */
export type RegulatoryReportErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'timeout'
  | 'network'
  | 'server'
  | 'unexpected';

export class RegulatoryReportError extends Error {
  readonly kind: RegulatoryReportErrorKind;
  readonly status?: number;

  constructor(kind: RegulatoryReportErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'RegulatoryReportError';
    this.kind = kind;
    this.status = status;
  }
}

/**
 * Where the report is fetched from.
 *
 * NEXT_PUBLIC_REPORT_API_URL points local development at the SSH bridge (report_bridge.py). It is
 * honoured only outside production: NEXT_PUBLIC_* values are inlined at build time, so a
 * developer's .env.local used to ship "http://localhost:5055" inside the production bundle, and
 * every admin's browser then failed to reach the report at all.
 */
const REPORT_API_BASE =
  (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_REPORT_API_URL) || API_BASE_URL;

/** The backend builds a month in seconds; two minutes means something is wrong, not slow. */
const REPORT_TIMEOUT_MS = 120_000;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Accept a response only if it is a report, and specifically the report for the month asked for.
 *
 * Rendering a partial object would crash the page mid-table, and rendering another month's figures
 * under the selected period is exactly the mistake this screen must never make.
 */
const assertReportFor = (data: unknown, query: RegulatoryReportQuery): RegulatoryMonthlyReport => {
  const bad = (why: string) =>
    new RegulatoryReportError('unexpected', `The server returned an unexpected response (${why}).`);

  if (!isObject(data)) throw bad('not a report object');
  for (const key of ['activeSubscribers', 'provisionedSubscribers', 'icxRows', 'icxConnectivity', 'pops']) {
    if (!Array.isArray(data[key])) throw bad(`missing ${key}`);
  }
  if (!isObject(data.iptspIptsp)) throw bad('missing iptspIptsp');
  const btrc = data.btrc;
  if (!isObject(btrc) || !isObject(btrc.callVolume) || !Array.isArray(btrc.a2pSms) || !Array.isArray(btrc.p2pSms)) {
    throw bad('missing BTRC summary');
  }

  const expectedMonth = MONTH_NAMES[query.month - 1];
  const month = typeof data.reportingMonth === 'string' ? data.reportingMonth.trim() : '';
  if (Number(data.reportingYear) !== query.year || month.toLowerCase() !== expectedMonth.toLowerCase()) {
    throw bad(`it is for ${month || '?'} ${data.reportingYear ?? '?'}, not ${expectedMonth} ${query.year}`);
  }
  return data as unknown as RegulatoryMonthlyReport;
};

/**
 * Fetch the computed monthly report for one month.
 *
 * Served by the main backend (like the sales report) because it reads the CDR/summary databases
 * directly. Resolves only with a validated report for exactly the requested month; every failure
 * rejects with a RegulatoryReportError. An aborted request rejects with axios's CanceledError,
 * which callers treat as "superseded", not as a failure to show.
 */
export const getRegulatoryReport = async (
  authToken: string,
  query: RegulatoryReportQuery,
  signal?: AbortSignal
): Promise<RegulatoryMonthlyReport> => {
  let data: unknown;
  try {
    const response = await axios.post<unknown>(`${REPORT_API_BASE}${API_ENDPOINTS.reports.iptspMonthly}`, query, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      timeout: REPORT_TIMEOUT_MS,
      signal,
    });
    data = response.data;
  } catch (e) {
    if (axios.isCancel(e)) throw e;
    if (axios.isAxiosError(e)) {
      const status = e.response?.status;
      if (status === 401) {
        throw new RegulatoryReportError('unauthorized', 'Your session has expired. Please sign in again.', status);
      }
      if (status === 403) {
        throw new RegulatoryReportError(
          'forbidden',
          'Access was denied. Your session may have expired, or your account may not be allowed to view this report. Sign in again; if it still fails, ask an administrator for access.',
          status
        );
      }
      if (status) {
        throw new RegulatoryReportError(
          'server',
          `The report server returned an error (HTTP ${status}). Please try again; if it keeps failing, contact support.`,
          status
        );
      }
      if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') {
        throw new RegulatoryReportError(
          'timeout',
          `The report did not finish within ${REPORT_TIMEOUT_MS / 1000} seconds. Please try again.`
        );
      }
      throw new RegulatoryReportError(
        'network',
        'Could not reach the report server. Check your network connection and try again.'
      );
    }
    throw new RegulatoryReportError('unexpected', 'The report could not be loaded because of an unexpected error.');
  }
  return assertReportFor(data, query);
};

// ── XLSX export (fills the official BTRC template, preserving its exact design) ───────────────
//
// A CSV cannot reproduce the BTRC sheet: it has three merged header rows, a four-way subscriber
// split and cell borders. So instead of emitting text we load the real template
// (public/templates/btrc_report_template.xlsx — File 2 with its data row blanked) and write only
// row 4. ExcelJS preserves the template's styling on round-trip, so the download is visually
// identical to what BTCL files. Column map for row 4 (see the BTRC workbook):
//   A operator · B/C/D/E subscribers[app, non-app ind, non-app corp, total]
//   F–N call volume[domMobile in/out, domOthers in/out, tollFree in/out, intl in/out, total]
//   O–W A2P[GP, Robi, Banglalink, Teletalk × in/out, total] · X–AF P2P[same]

const BTRC_TEMPLATE_URL = '/templates/btrc_report_template.xlsx';
const IPTSP_TEMPLATE_URL = '/templates/iptsp_report_template.xlsx';
const OPERATOR_ORDER = ['Grameenphone', 'Robi', 'Banglalink', 'Teletalk'];
const A2P_COLS = ['O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'];
const P2P_COLS = ['X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE'];

const smsRow = (rows: OperatorSmsRow[], operator: string): OperatorSmsRow =>
  rows.find((r) => r.operator === operator) ?? { operator, incoming: 0, outgoing: 0 };

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download the BTRC submission as an .xlsx that matches the official template exactly.
 * Runs entirely in the browser; throws if the template asset can't be fetched.
 */
export const downloadBtrcXlsx = async (report: RegulatoryMonthlyReport): Promise<void> => {
  const ExcelJS = (await import('exceljs')).default;

  const res = await fetch(BTRC_TEMPLATE_URL);
  if (!res.ok) throw new Error(`BTRC template not found (${res.status})`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await res.arrayBuffer());
  const ws = wb.worksheets[0];
  // The month lives in the sheet name on the BTRC form; Excel caps sheet names at 31 chars.
  ws.name = `${report.reportingMonth} ${report.reportingYear}`.slice(0, 31);

  const b = report.btrc;
  const cv = b.callVolume;
  const set = (cell: string, value: number | string) => {
    ws.getCell(cell).value = value;
  };
  // Totals are SUM formulas in the official form (E/N/W/AF). Keep them as formulas — with a
  // cached result so they show immediately before Excel recalculates — to match it exactly.
  const setTotal = (cell: string, formula: string, result: number) => {
    ws.getCell(cell).value = { formula, result };
  };

  set('A4', report.operatorName);
  set('B4', b.subscriberAppBased ?? b.subscribers); // sample: all active are App Based
  set('C4', b.subscriberNonAppIndividual ?? 0);
  set('D4', b.subscriberNonAppCorporate ?? 0);
  setTotal('E4', 'SUM(B4:D4)', b.subscribers);

  set('F4', cv.domMobileIn);
  set('G4', cv.domMobileOut);
  set('H4', cv.domOthersIn);
  set('I4', cv.domOthersOut);
  set('J4', cv.tollFreeIn);
  set('K4', cv.tollFreeOut);
  set('L4', cv.intlIn);
  set('M4', cv.intlOut);
  setTotal('N4', 'SUM(F4:M4)', cv.total);

  OPERATOR_ORDER.forEach((op, i) => {
    const s = smsRow(b.a2pSms, op);
    set(`${A2P_COLS[i * 2]}4`, s.incoming);
    set(`${A2P_COLS[i * 2 + 1]}4`, s.outgoing);
  });
  const a2pT = smsTotal(b.a2pSms);
  setTotal('W4', 'SUM(O4:V4)', a2pT.incoming + a2pT.outgoing);

  OPERATOR_ORDER.forEach((op, i) => {
    const s = smsRow(b.p2pSms, op);
    set(`${P2P_COLS[i * 2]}4`, s.incoming);
    set(`${P2P_COLS[i * 2 + 1]}4`, s.outgoing);
  });
  const p2pT = smsTotal(b.p2pSms);
  setTotal('AF4', 'SUM(X4:AE4)', p2pT.incoming + p2pT.outgoing);

  const out = await wb.xlsx.writeBuffer();
  const stamp = `${report.reportingYear}-${String(new Date(`${report.reportingMonth} 1, ${report.reportingYear}`).getMonth() + 1).padStart(2, '0')}`;
  triggerDownload(
    new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `BTCL_BTRC_IPTSP_Report_${stamp}.xlsx`
  );
};

/**
 * Download the detailed IPTSP operator report (File 1's "Report" sheet) as an .xlsx matching the
 * official template exactly. Fills the same monthly data object across all sections: subscribers
 * (active + provisioned by zone), IPTSP↔IPTSP minutes, ICX↔IPTSP minutes (combined — Cataleya
 * load-balances so the per-ICX split isn't recorded), and the installation capacity.
 */
export const downloadIptspXlsx = async (report: RegulatoryMonthlyReport): Promise<void> => {
  const ExcelJS = (await import('exceljs')).default;

  const res = await fetch(IPTSP_TEMPLATE_URL);
  if (!res.ok) throw new Error(`IPTSP template not found (${res.status})`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await res.arrayBuffer());
  const ws = wb.worksheets[0];
  const set = (cell: string, value: number | string) => {
    ws.getCell(cell).value = value;
  };

  // Header (values are embedded in the label text on this form)
  set('A3', `Name of the IPTSP Operator: ${report.operatorName}`);
  set('A4', `Type Of IPTSP license(Nationwide/Central/Zonal): ${report.licenseType}`);
  set('A5', `Operation Start Date: ${report.operationStartDate}`);
  set('A6', `Reporting Month:${report.reportingMonth}`);
  set('F6', `Year: ${report.reportingYear}`);

  // 1.A active (rows 12–16, total 17) and 1.B provisioned (24–28, total 29)
  const cols = ['C', 'D', 'E', 'F', 'G', 'H'] as const;
  const keys: (keyof SubscriberZoneRow)[] = [
    'prepaidIndividual', 'prepaidCorporateNumbers', 'prepaidCorporateChannels',
    'postpaidIndividual', 'postpaidCorporateNumbers', 'postpaidCorporateChannels',
  ];
  const fillSubs = (rows: SubscriberZoneRow[], startRow: number, totalRow: number) => {
    rows.forEach((zone, i) => cols.forEach((c, j) => set(`${c}${startRow + i}`, zone[keys[j]] as number)));
    const t = totalSubscribers(rows);
    cols.forEach((c, j) => set(`${c}${totalRow}`, t[keys[j]] as number));
  };
  fillSubs(report.activeSubscribers, 12, 17);
  fillSubs(report.provisionedSubscribers, 24, 29);

  // 2.A IPTSP–IPTSP: minutes row 34, calls row 35 (C out-onnet, D out-other, E in-onnet, F in-other)
  const ii = report.iptspIptsp;
  set('C34', ii.outOnnetMinutes); set('D34', ii.outOtherMinutes); set('E34', ii.inOnnetMinutes); set('F34', ii.inOtherMinutes);
  set('C35', ii.outOnnetCalls); set('D35', ii.outOtherCalls); set('E35', ii.inOnnetCalls); set('F35', ii.inOtherCalls);

  // 2.B ICX–IPTSP: combined totals only (rows 45 minutes / 46 calls); per-ICX minute cells stay blank.
  const icx = report.icxRows[0];
  if (icx) {
    set('E45', icx.outOffnetMinutes); set('F45', icx.outIntlMinutes); set('G45', icx.inOffnetMinutes); set('H45', icx.inIntlMinutes);
    set('E46', icx.outOffnetCalls); set('F46', icx.outIntlCalls); set('G46', icx.inOffnetCalls); set('H46', icx.inIntlCalls);
  }
  // Name + E1 for each ICX on the per-ICX rows (41, 43) from the provisioned capacity list.
  report.icxConnectivity.slice(0, 2).forEach((c, i) => {
    set(`C${41 + i * 2}`, c.icxName);
    set(`D${41 + i * 2}`, c.e1);
  });

  // 3.A ICX connectivity (rows 51+) and 3.B PoP & media gateways (rows 51+)
  report.icxConnectivity.forEach((c, i) => { set(`B${51 + i}`, c.icxName); set(`C${51 + i}`, c.e1); });
  report.pops.forEach((p, i) => { set(`F${51 + i}`, p.address); set(`H${51 + i}`, p.mediaGateways); });

  // ── companion summary sheets ────────────────────────────────────────────────
  // active = revenue-generating base, provisioned = all numbers; both are head counts.
  const activeTotal = zoneHeadCount(totalSubscribers(report.activeSubscribers));
  const provTotal = zoneHeadCount(totalSubscribers(report.provisionedSubscribers));

  // this-month-summary and All-month-Summary share columns A–K: month, active, provisioned,
  // then the 4 IPTSP–IPTSP buckets and the 4 ICX buckets.
  const writeSummaryRow = (sheetName: string, row: number) => {
    const s = wb.getWorksheet(sheetName);
    if (!s) return;
    const c = report.icxRows[0];
    const put = (col: string, v: number | string) => {
      s.getCell(`${col}${row}`).value = v;
    };
    put('A', `${report.reportingMonth},${report.reportingYear}`);
    put('B', activeTotal); put('C', provTotal);
    put('D', ii.outOnnetMinutes); put('E', ii.outOtherMinutes); put('F', ii.inOnnetMinutes); put('G', ii.inOtherMinutes);
    put('H', c ? c.outOffnetMinutes : 0); put('I', c ? c.outIntlMinutes : 0);
    put('J', c ? c.inOffnetMinutes : 0); put('K', c ? c.inIntlMinutes : 0);
  };
  writeSummaryRow('this-month-summary', 5);
  writeSummaryRow('All-month-Summary', 5);

  // user sheet: reporting date, NID-verified (= active), All (= provisioned)
  const userWs = wb.getWorksheet('user');
  if (userWs) {
    const mNum = MONTH_NAMES.indexOf(report.reportingMonth) + 1;
    const lastDay = new Date(report.reportingYear, mNum, 0).getDate();
    userWs.getCell('A2').value = `${report.reportingYear}-${String(mNum).padStart(2, '0')}-${lastDay}`;
    userWs.getCell('B2').value = activeTotal;
    userWs.getCell('C2').value = provTotal;
  }

  const out = await wb.xlsx.writeBuffer();
  const monthNum = String(MONTH_NAMES.indexOf(report.reportingMonth) + 1).padStart(2, '0');
  triggerDownload(
    new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `BTCL_IPTSP_Report_${report.reportingYear}-${monthNum}.xlsx`
  );
};

// ── CSV export (BTRC flat submission format) ──────────────────────────────────

const csvCell = (value: string | number): string => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const OPERATORS = ['Grameenphone', 'Robi', 'Banglalink', 'Teletalk'];

const smsFor = (rows: OperatorSmsRow[], operator: string): OperatorSmsRow =>
  rows.find((r) => r.operator === operator) ?? { operator, incoming: 0, outgoing: 0 };

/**
 * Build the single-row BTRC submission CSV.
 *
 * Column order matches the regulator's template: subscribers, then the call-volume buckets
 * (incoming/outgoing per category with the grand total), then A2P and P2P SMS broken out per
 * mobile operator with their own totals. One header row, one data row — exactly what BTRC ingests.
 */
export const buildBtrcCsv = (report: RegulatoryMonthlyReport): string => {
  const { btrc } = report;
  const cv = btrc.callVolume;
  const a2pTotal = smsTotal(btrc.a2pSms);
  const p2pTotal = smsTotal(btrc.p2pSms);

  const header: (string | number)[] = [
    'Operator Name',
    'Subscribers',
    'Call: Domestic (Mobile Dialer) In',
    'Call: Domestic (Mobile Dialer) Out',
    'Call: Domestic (Others) In',
    'Call: Domestic (Others) Out',
    'Call: Domestic (Toll Free/LTFS) In',
    'Call: Domestic (Toll Free/LTFS) Out',
    'Call: International In',
    'Call: International Out',
    'Call: Total',
  ];
  const row: (string | number)[] = [
    report.operatorName,
    btrc.subscribers,
    cv.domMobileIn.toFixed(2),
    cv.domMobileOut.toFixed(2),
    cv.domOthersIn.toFixed(2),
    cv.domOthersOut.toFixed(2),
    cv.tollFreeIn.toFixed(2),
    cv.tollFreeOut.toFixed(2),
    cv.intlIn.toFixed(2),
    cv.intlOut.toFixed(2),
    cv.total.toFixed(2),
  ];

  for (const label of ['A2P', 'P2P']) {
    const rows = label === 'A2P' ? btrc.a2pSms : btrc.p2pSms;
    for (const op of OPERATORS) {
      const s = smsFor(rows, op);
      header.push(`${label} SMS ${op} In`, `${label} SMS ${op} Out`);
      row.push(s.incoming, s.outgoing);
    }
    const t = label === 'A2P' ? a2pTotal : p2pTotal;
    header.push(`${label} SMS Total`);
    row.push(t.incoming + t.outgoing);
  }

  return [header.map(csvCell).join(','), row.map(csvCell).join(',')].join('\r\n');
};

/** Trigger a browser download. The BOM makes Excel read UTF-8 correctly. */
export const downloadCsv = (csv: string, filename: string): void => {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


export { smsTotal };
