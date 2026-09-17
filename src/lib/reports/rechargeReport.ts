import {
  formatBst,
  getRevenueTransactions,
  isSettled,
  KIND_LABELS,
  KIND_OPTIONS,
  RECHARGE_KINDS,
  SERVICE_OPTIONS,
  STATUS_OPTIONS,
  type RevenueFilters,
  type RevenueTransaction,
} from '@/lib/api-client/revenue';

/**
 * The Recharge Report as a document: what was asked for, what it adds up to, and every row.
 *
 * Built in the browser from the same API the page reads, over every row the filters match
 * (not just the page on screen), so the CSV and the PDF carry the same filters, the same
 * summary and the same rows. The summary is computed from the exported rows themselves: a
 * report whose totals disagree with its own detail lines is worse than no totals at all.
 */

/** The payment service's page-size ceiling; asking for more returns this many anyway. */
const FETCH_PAGE_SIZE = 200;

/**
 * Past this many rows the report is refused rather than built.
 *
 * Tens of thousands of recharges cannot be read as a report, and assembling them in a browser
 * tab would stall it. The limit is far above real volume (a few hundred recharges a month).
 */
export const REPORT_MAX_ROWS = 20_000;

export class ReportTooLargeError extends Error {
  constructor(readonly rows: number) {
    super(`The filters match ${rows} recharges, more than the ${REPORT_MAX_ROWS} a report can hold.`);
  }
}

export interface ReportLine {
  label: string;
  transactions: number;
  successful: number;
  /** Successful amount only: an abandoned attempt never adds to money recharged. */
  amount: number;
}

export interface StatusLine {
  label: string;
  transactions: number;
  /** Everything attempted with this status, which is what a status breakdown is for. */
  amount: number;
}

export interface SubscriberLine {
  idPartner: number | null;
  name: string;
  recharges: number;
  amount: number;
}

export interface RechargeReport {
  title: string;
  fileBase: string;
  generatedAt: Date;
  generatedBy: string | null;
  filters: { label: string; value: string }[];
  rows: RevenueTransaction[];
  totals: {
    transactions: number;
    successful: number;
    amount: number;
    subscribers: number;
    average: number;
    firstSuccessful: string | null;
    lastSuccessful: string | null;
  };
  byService: ReportLine[];
  byType: ReportLine[];
  byStatus: StatusLine[];
  byMethod: ReportLine[];
  topSubscribers: SubscriberLine[];
}

// ------------------------------------------------------------------ fetching

/**
 * Every row the filters match, page by page.
 *
 * Rows are keyed on their transaction or order id: a payment that arrives while the pages are
 * being read shifts the newest-first ordering by one, and would otherwise appear twice.
 */
export const fetchAllRecharges = async (
  filters: RevenueFilters,
  authToken: string
): Promise<RevenueTransaction[]> => {
  const first = await getRevenueTransactions({ ...filters, page: 0, size: FETCH_PAGE_SIZE }, authToken);
  if (first.totalItems > REPORT_MAX_ROWS) throw new ReportTooLargeError(first.totalItems);

  const rows = [...first.data];
  for (let page = 1; page < first.totalPages; page++) {
    const next = await getRevenueTransactions({ ...filters, page, size: FETCH_PAGE_SIZE }, authToken);
    rows.push(...next.data);
  }

  const seen = new Set<string>();
  return rows.filter((r, i) => {
    const key = r.transactionId || r.orderId || `row-${i}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ------------------------------------------------------------------ labels

const amountOf = (r: RevenueTransaction) => {
  const n = Number(r.amount);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

const SERVICE_LABEL: Record<string, string> = Object.fromEntries(
  SERVICE_OPTIONS.map((o) => [o.value, o.label])
);

const serviceOf = (r: RevenueTransaction) =>
  r.serviceName || (r.storeType && SERVICE_LABEL[r.storeType.toLowerCase()]) || 'Unknown service';

const typeOf = (r: RevenueTransaction) => (r.kind && KIND_LABELS[r.kind]) || 'Unclassified';

/** Every settled synonym reads as Success, the way the page's status pill does. */
export const statusLabel = (status: string | null) => {
  if (isSettled(status)) return 'Success';
  if (!status) return 'Unknown';
  return status.charAt(0) + status.slice(1).toLowerCase();
};

const methodOf = (r: RevenueTransaction) =>
  r.paymentMethod
    ? `${r.paymentGateway || 'SSLCommerz'} · ${r.paymentMethod}`
    : r.paymentGateway || 'Not recorded';

const STATUS_ORDER = ['Success', 'Pending', 'Initiated', 'Failed', 'Cancelled', 'Expired'];

/** yyyy-MM-dd as dd/MM/yyyy, the way the rest of the report writes dates. */
const dmy = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
};

const listOf = (value: string | undefined, options: readonly { value: string; label: string }[]) =>
  (value || '')
    .split(',')
    .filter(Boolean)
    .map((v) => options.find((o) => o.value === v)?.label || v)
    .join(', ');

// ------------------------------------------------------------------ building

/** The file name both formats share, e.g. recharge-report_2026-09-01_to_2026-09-17. */
export const reportFileBase = (filters: RevenueFilters) =>
  `recharge-report_${filters.from || 'start'}_to_${filters.to || 'today'}`;

export const buildRechargeReport = (
  rows: RevenueTransaction[],
  filters: RevenueFilters,
  context: { subscriber: string | null; generatedBy: string | null }
): RechargeReport => {
  const period =
    filters.from && filters.to
      ? `${dmy(filters.from)} to ${dmy(filters.to)}`
      : filters.from
        ? `From ${dmy(filters.from)}`
        : filters.to
          ? `Up to ${dmy(filters.to)}`
          : 'All dates';

  const kinds = filters.kind && filters.kind !== RECHARGE_KINDS ? filters.kind : RECHARGE_KINDS;

  const reportFilters = [
    { label: 'Period', value: period },
    { label: 'Subscriber', value: context.subscriber || 'All subscribers' },
    { label: 'Service', value: listOf(filters.service, SERVICE_OPTIONS) || 'All services' },
    { label: 'Type', value: listOf(kinds, KIND_OPTIONS) },
    { label: 'Status', value: listOf(filters.status, STATUS_OPTIONS) || 'All statuses' },
    { label: 'Search', value: filters.q ? `"${filters.q}"` : 'None' },
  ];

  const successful = rows.filter((r) => isSettled(r.status));
  const amount = round2(successful.reduce((sum, r) => sum + amountOf(r), 0));
  const successTimes = successful.map((r) => r.createdAt).filter(Boolean).sort() as string[];

  const group = (keyOf: (r: RevenueTransaction) => string, order: string[] = []): ReportLine[] => {
    const lines = new Map<string, ReportLine>();
    for (const r of rows) {
      const label = keyOf(r);
      const line = lines.get(label) || { label, transactions: 0, successful: 0, amount: 0 };
      line.transactions += 1;
      if (isSettled(r.status)) {
        line.successful += 1;
        line.amount = round2(line.amount + amountOf(r));
      }
      lines.set(label, line);
    }
    const rank = (label: string) => (order.includes(label) ? order.indexOf(label) : order.length);
    return Array.from(lines.values()).sort(
      (a, b) => rank(a.label) - rank(b.label) || b.amount - a.amount || a.label.localeCompare(b.label)
    );
  };

  const statusLines = new Map<string, StatusLine>();
  for (const r of rows) {
    const label = statusLabel(r.status);
    const line = statusLines.get(label) || { label, transactions: 0, amount: 0 };
    line.transactions += 1;
    line.amount = round2(line.amount + amountOf(r));
    statusLines.set(label, line);
  }
  const statusRank = (label: string) =>
    STATUS_ORDER.includes(label) ? STATUS_ORDER.indexOf(label) : STATUS_ORDER.length;

  const methods = new Map<string, ReportLine>();
  for (const r of successful) {
    const label = methodOf(r);
    const line = methods.get(label) || { label, transactions: 0, successful: 0, amount: 0 };
    line.transactions += 1;
    line.successful += 1;
    line.amount = round2(line.amount + amountOf(r));
    methods.set(label, line);
  }

  const subscribers = new Map<string, SubscriberLine>();
  for (const r of successful) {
    const key = r.idPartner != null ? `id:${r.idPartner}` : `name:${r.subscriberName || '?'}`;
    const line = subscribers.get(key) || {
      idPartner: r.idPartner,
      name: r.subscriberName || '(no name)',
      recharges: 0,
      amount: 0,
    };
    line.recharges += 1;
    line.amount = round2(line.amount + amountOf(r));
    if (line.name === '(no name)' && r.subscriberName) line.name = r.subscriberName;
    subscribers.set(key, line);
  }

  return {
    title: 'Recharge Report',
    fileBase: reportFileBase(filters),
    generatedAt: new Date(),
    generatedBy: context.generatedBy,
    filters: reportFilters,
    rows,
    totals: {
      transactions: rows.length,
      successful: successful.length,
      amount,
      subscribers: new Set(successful.map((r) => r.idPartner ?? r.subscriberName)).size,
      average: successful.length ? round2(amount / successful.length) : 0,
      firstSuccessful: successTimes[0] || null,
      lastSuccessful: successTimes[successTimes.length - 1] || null,
    },
    byService: group(serviceOf, SERVICE_OPTIONS.map((o) => o.label)),
    byType: group(typeOf, KIND_OPTIONS.map((o) => o.label)),
    byStatus: Array.from(statusLines.values()).sort((a, b) => statusRank(a.label) - statusRank(b.label)),
    byMethod: Array.from(methods.values()).sort((a, b) => b.amount - a.amount),
    topSubscribers: Array.from(subscribers.values())
      .sort((a, b) => b.amount - a.amount || b.recharges - a.recharges)
      .slice(0, 10),
  };
};

// ------------------------------------------------------------------ CSV

/**
 * One CSV cell.
 *
 * Text starting with = + - @ is run as a formula when the file is opened in Excel, and finance
 * opens every export in Excel, so such text is prefixed with an apostrophe. Numbers are written
 * bare so the amount column still sums.
 */
const cell = (value: string | number | null | undefined): string => {
  if (typeof value === 'number') return String(value);
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** A phone number without its leading +, which Excel would otherwise read as a formula. */
const phone = (v: string | null) => (v || '').trim().replace(/^\+/, '');

const generatedText = (report: RechargeReport) =>
  `${report.generatedAt.toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'long', timeStyle: 'short' })} (BST)`;

export const rechargeReportCsv = (report: RechargeReport): string => {
  const lines: (string | number | null)[][] = [];
  const blank = () => lines.push([]);
  const t = report.totals;

  lines.push([report.title]);
  lines.push(['BTCL Communication Platform · Alaap Cloud']);
  lines.push(['Generated', generatedText(report)]);
  if (report.generatedBy) lines.push(['Generated by', report.generatedBy]);
  blank();

  lines.push(['REPORT FILTERS']);
  report.filters.forEach((f) => lines.push([f.label, f.value]));
  blank();

  lines.push(['SUMMARY']);
  lines.push(['Recharge transactions', t.transactions]);
  lines.push(['Successful recharges', t.successful]);
  lines.push(['Amount recharged (BDT)', t.amount.toFixed(2)]);
  lines.push(['Subscribers who recharged', t.subscribers]);
  lines.push(['Average recharge (BDT)', t.average.toFixed(2)]);
  lines.push(['First successful recharge', t.firstSuccessful ? formatBst(t.firstSuccessful) : '—']);
  lines.push(['Last successful recharge', t.lastSuccessful ? formatBst(t.lastSuccessful) : '—']);
  blank();

  const breakdown = (title: string, head: string, items: ReportLine[]) => {
    lines.push([title]);
    lines.push([head, 'Transactions', 'Successful', 'Amount (BDT)']);
    items.forEach((l) => lines.push([l.label, l.transactions, l.successful, l.amount.toFixed(2)]));
    lines.push([
      'Total',
      items.reduce((s, l) => s + l.transactions, 0),
      items.reduce((s, l) => s + l.successful, 0),
      round2(items.reduce((s, l) => s + l.amount, 0)).toFixed(2),
    ]);
    blank();
  };
  breakdown('BY SERVICE', 'Service', report.byService);
  breakdown('BY TYPE', 'Type', report.byType);

  lines.push(['BY STATUS']);
  lines.push(['Status', 'Transactions', 'Amount (BDT)']);
  report.byStatus.forEach((l) => lines.push([l.label, l.transactions, l.amount.toFixed(2)]));
  blank();

  lines.push(['BY PAYMENT METHOD (successful recharges)']);
  lines.push(['Payment method', 'Recharges', 'Amount (BDT)']);
  report.byMethod.forEach((l) => lines.push([l.label, l.successful, l.amount.toFixed(2)]));
  blank();

  lines.push(['TOP SUBSCRIBERS (successful recharges)']);
  lines.push(['Rank', 'Subscriber', 'Partner ID', 'Recharges', 'Amount (BDT)']);
  report.topSubscribers.forEach((s, i) =>
    lines.push([i + 1, s.name, s.idPartner ?? '', s.recharges, s.amount.toFixed(2)])
  );
  blank();

  lines.push(['RECHARGE DETAILS']);
  lines.push([
    'SL', 'Date & Time (BST)', 'Service', 'Type', 'Package ID', 'Subscriber', 'Partner ID', 'Mobile',
    'Email', 'Amount (BDT)', 'Payment Gateway', 'Payment Method', 'Transaction ID', 'Bank Transaction ID',
    'Status',
  ]);
  report.rows.forEach((r, i) =>
    lines.push([
      i + 1,
      formatBst(r.createdAt),
      serviceOf(r),
      typeOf(r),
      r.idPackage ?? '',
      r.subscriberName || '',
      r.idPartner ?? '',
      phone(r.subscriberMobile || r.partnerContact),
      r.subscriberEmail || '',
      amountOf(r).toFixed(2),
      r.paymentGateway || '',
      r.paymentMethod || '',
      r.transactionId || r.orderId || '',
      r.bankTranId || '',
      statusLabel(r.status),
    ])
  );
  lines.push(['Total successful amount (BDT)', '', '', '', '', '', '', '', '', t.amount.toFixed(2)]);

  return lines.map((line) => line.map(cell).join(',')).join('\r\n');
};

// ------------------------------------------------------------------ PDF

const esc = (v: string | number | null | undefined) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const bdt = (n: number) =>
  n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const REPORT_CSS = `
@page { size: A4 landscape; margin: 12mm 10mm 14mm;
  @bottom-left { content: "BTCL Communication Platform · Recharge Report · Confidential"; font-size: 8px; color: #94a3b8; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: 8px; color: #94a3b8; } }
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, "Segoe UI", Roboto, "Noto Sans Bengali", Helvetica, Arial, sans-serif;
  color: #1f2937; font-size: 10.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #0D529E;
  padding-bottom: 8px; margin-bottom: 12px; }
.brand { font-size: 12px; font-weight: 700; color: #0D529E; letter-spacing: .02em; }
h1 { margin: 2px 0 0; font-size: 22px; color: #1F3C71; }
.scope { color: #64748b; font-size: 11px; margin-top: 2px; }
.meta { text-align: right; color: #64748b; font-size: 10px; line-height: 1.5; }
h2 { font-size: 12.5px; color: #0D529E; margin: 14px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #dbe5f1;
  break-after: avoid; }
.filters { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 18px; background: #f5f8fc;
  border: 1px solid #dbe5f1; border-radius: 6px; padding: 8px 10px; }
.filters div { display: flex; gap: 6px; }
.filters .k { color: #64748b; min-width: 62px; }
.filters .v { font-weight: 600; color: #1F3C71; }
.tiles { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.tile { border: 1px solid #dbe5f1; border-radius: 6px; padding: 7px 9px; }
.tile .n { font-size: 16px; font-weight: 700; color: #1F3C71; font-variant-numeric: tabular-nums; }
.tile .n.money { color: #15803d; }
.tile .l { color: #64748b; font-size: 9.5px; margin-top: 1px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
th { background: #0D529E; color: #fff; text-align: left; font-weight: 600; padding: 4px 6px; font-size: 9.5px; }
td { border-bottom: 1px solid #e5eaf1; padding: 3.5px 6px; vertical-align: top; }
tr:nth-child(even) td { background: #f8fafc; }
.num { text-align: right; white-space: nowrap; }
tr.total td { font-weight: 700; background: #eef3f9; border-top: 1.5px solid #0D529E; }
.section { break-inside: avoid; }
.details table { font-size: 9px; }
.details th { font-size: 8.5px; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
.id { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 8.5px; word-break: break-all; }
.pill { display: inline-block; padding: 0 5px; border-radius: 8px; font-size: 8.5px; font-weight: 600; }
.pill.ok { background: #dcfce7; color: #15803d; } .pill.wait { background: #fef3c7; color: #b45309; }
.pill.bad { background: #fee2e2; color: #b91c1c; } .pill.off { background: #e5e7eb; color: #4b5563; }
.empty { color: #64748b; padding: 10px 0; }
.footer { margin-top: 12px; padding-top: 6px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 9px;
  text-align: center; }
`;

const pillClass = (label: string) =>
  label === 'Success' ? 'ok' : label === 'Pending' || label === 'Initiated' ? 'wait' : label === 'Failed' ? 'bad' : 'off';

export const rechargeReportHtml = (report: RechargeReport): string => {
  const t = report.totals;

  const lineTable = (head: string, items: ReportLine[]) =>
    items.length === 0
      ? '<div class="empty">No recharges.</div>'
      : `<table><thead><tr><th>${esc(head)}</th><th class="num">Transactions</th><th class="num">Successful</th>` +
        `<th class="num">Amount (BDT)</th></tr></thead><tbody>` +
        items
          .map(
            (l) =>
              `<tr><td>${esc(l.label)}</td><td class="num">${l.transactions}</td><td class="num">${l.successful}</td>` +
              `<td class="num">${bdt(l.amount)}</td></tr>`
          )
          .join('') +
        `<tr class="total"><td>Total</td><td class="num">${items.reduce((s, l) => s + l.transactions, 0)}</td>` +
        `<td class="num">${items.reduce((s, l) => s + l.successful, 0)}</td>` +
        `<td class="num">${bdt(round2(items.reduce((s, l) => s + l.amount, 0)))}</td></tr></tbody></table>`;

  const statusTable =
    report.byStatus.length === 0
      ? '<div class="empty">No recharges.</div>'
      : '<table><thead><tr><th>Status</th><th class="num">Transactions</th><th class="num">Amount (BDT)</th></tr></thead><tbody>' +
        report.byStatus
          .map(
            (l) =>
              `<tr><td><span class="pill ${pillClass(l.label)}">${esc(l.label)}</span></td>` +
              `<td class="num">${l.transactions}</td><td class="num">${bdt(l.amount)}</td></tr>`
          )
          .join('') +
        '</tbody></table>';

  const methodTable =
    report.byMethod.length === 0
      ? '<div class="empty">No successful recharges.</div>'
      : '<table><thead><tr><th>Payment method</th><th class="num">Recharges</th><th class="num">Amount (BDT)</th></tr></thead><tbody>' +
        report.byMethod
          .map((l) => `<tr><td>${esc(l.label)}</td><td class="num">${l.successful}</td><td class="num">${bdt(l.amount)}</td></tr>`)
          .join('') +
        '</tbody></table>';

  const subscriberTable =
    report.topSubscribers.length === 0
      ? '<div class="empty">No successful recharges.</div>'
      : '<table><thead><tr><th class="num">#</th><th>Subscriber</th><th class="num">Partner ID</th>' +
        '<th class="num">Recharges</th><th class="num">Amount (BDT)</th></tr></thead><tbody>' +
        report.topSubscribers
          .map(
            (s, i) =>
              `<tr><td class="num">${i + 1}</td><td>${esc(s.name)}</td><td class="num">${esc(s.idPartner ?? '—')}</td>` +
              `<td class="num">${s.recharges}</td><td class="num">${bdt(s.amount)}</td></tr>`
          )
          .join('') +
        '</tbody></table>';

  const detailRows =
    report.rows.length === 0
      ? '<tr><td colspan="11" class="empty">No recharges match these filters.</td></tr>'
      : report.rows
          .map((r, i) => {
            const status = statusLabel(r.status);
            return (
              `<tr><td class="num">${i + 1}</td><td style="white-space:nowrap">${esc(formatBst(r.createdAt))}</td>` +
              `<td>${esc(serviceOf(r))}</td><td>${esc(typeOf(r))}${r.kind === 'PREPAID' && r.idPackage != null ? ` <span style="color:#64748b">#${esc(r.idPackage)}</span>` : ''}</td>` +
              `<td>${esc(r.subscriberName || '—')}</td><td class="num">${esc(r.idPartner ?? '—')}</td>` +
              `<td style="white-space:nowrap">${esc(r.subscriberMobile || r.partnerContact || '—')}</td>` +
              `<td class="num">${bdt(amountOf(r))}</td><td>${esc(methodOf(r))}</td>` +
              `<td class="id">${esc(r.transactionId || r.orderId || '—')}</td>` +
              `<td><span class="pill ${pillClass(status)}">${esc(status)}</span></td></tr>`
            );
          })
          .join('') +
        `<tr class="total"><td colspan="7">Total successful amount (${t.successful} of ${t.transactions} recharges)</td>` +
        `<td class="num">${bdt(t.amount)}</td><td colspan="3"></td></tr>`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<title>${esc(report.fileBase)}</title>
<style>${REPORT_CSS}</style></head>
<body>
<div class="header">
  <div>
    <div class="brand">BTCL Communication Platform · Alaap Cloud</div>
    <h1>${esc(report.title)}</h1>
    <div class="scope">Top-ups and prepaid bundles · Hosted IP PBX, Contact Center, Voice Broadcasting, A2P SMS</div>
  </div>
  <div class="meta">
    Generated ${esc(generatedText(report))}<br />
    ${report.generatedBy ? `by ${esc(report.generatedBy)}<br />` : ''}
    Confidential — for authorised staff only
  </div>
</div>

<h2>Report filters</h2>
<div class="filters">
  ${report.filters.map((f) => `<div><span class="k">${esc(f.label)}</span><span class="v">${esc(f.value)}</span></div>`).join('')}
</div>

<h2>Summary</h2>
<div class="tiles">
  <div class="tile"><div class="n">${t.transactions}</div><div class="l">Recharge transactions</div></div>
  <div class="tile"><div class="n">${t.successful}</div><div class="l">Successful recharges</div></div>
  <div class="tile"><div class="n money">${bdt(t.amount)}</div><div class="l">Amount recharged (BDT)</div></div>
  <div class="tile"><div class="n">${t.subscribers}</div><div class="l">Subscribers who recharged</div></div>
  <div class="tile"><div class="n">${bdt(t.average)}</div><div class="l">Average recharge (BDT)</div></div>
</div>

<div class="grid2">
  <div class="section"><h2>By service</h2>${lineTable('Service', report.byService)}</div>
  <div class="section"><h2>By type</h2>${lineTable('Type', report.byType)}</div>
  <div class="section"><h2>By status</h2>${statusTable}</div>
  <div class="section"><h2>By payment method (successful)</h2>${methodTable}</div>
</div>

<div class="section"><h2>Top subscribers (successful recharges)</h2>${subscriberTable}</div>

<div class="details">
  <h2>Recharge details</h2>
  <table>
    <thead><tr>
      <th class="num">SL</th><th>Date &amp; Time (BST)</th><th>Service</th><th>Type</th><th>Subscriber</th>
      <th class="num">Partner ID</th><th>Mobile</th><th class="num">Amount (BDT)</th><th>Payment method</th>
      <th>Transaction ID</th><th>Status</th>
    </tr></thead>
    <tbody>${detailRows}</tbody>
  </table>
</div>

<div class="footer">BTCL Communication Platform · Recharge Report · Generated ${esc(generatedText(report))} · Confidential</div>
<script>window.onload = function () { setTimeout(function () { window.print(); }, 400); };</script>
</body></html>`;
};

/** Shown in the print window while the rows are being fetched. */
export const PREPARING_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Preparing report…</title></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1F3C71;display:flex;align-items:center;justify-content:center;height:90vh">
<div style="text-align:center"><div style="font-size:18px;font-weight:600">Preparing the Recharge Report…</div>
<div style="color:#64748b;margin-top:6px;font-size:13px">The save-as-PDF dialog opens when it is ready.</div></div></body></html>`;
