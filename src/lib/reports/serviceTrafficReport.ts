import {
  DIMENSION_LABELS,
  DIRECTION_LABELS,
  MEASURE_LABELS,
  PAYMENT_MODEL_LABELS,
  type ServiceTrafficReport,
  type TrafficDimension,
  type ServiceOverviewEntry,
  type TrafficDirection,
  type TrafficLeg,
  type TrafficMeasure,
  type TrafficRow,
} from '@/lib/api-client/serviceTraffic';

/**
 * The Service Summary Report as a spreadsheet, and the column set the page and the export share.
 *
 * One definition of the columns, used by both, so the screen and the file can never disagree
 * about what a column is or what order they are in. Neither carries a totals line under the
 * detail: the figures for the selected range are the page's headline tiles and the export's
 * SUMMARY block, and the detail is read date by date. The measures are the dashboard's own:
 * calls, answered calls, actual / billed / chargeable duration, revenue, ANS and carrier cost,
 * VAT, and ASR / ACD / PDD — each one included only where the service actually keeps it, so a
 * column of blanks never appears.
 */

/** One CSV cell, quoted when it has to be. */
const cell = (value: string | number | null | undefined): string => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const fixed2 = (n: number | null): string => (n === null || !Number.isFinite(n) ? '—' : n.toFixed(2));

/** A ratio, or an em dash where there was nothing to take a ratio of. */
export const ratioText = (value: number | null, suffix = '%'): string =>
  value === null ? '—' : `${value.toFixed(2)}${suffix}`;

/** A count, or an em dash — a count of nothing is still a count, so only null dashes. */
const countText = (value: number | null): string =>
  value === null ? '—' : Math.round(value).toLocaleString('en-BD');

/**
 * How a grouped row is named for one dimension.
 *
 * Three different absences, three different words: a dimension that was not grouped by has no
 * cell at all, a partner the table no longer names is shown by its id, and traffic this
 * direction cannot attribute says so rather than looking like a missing name.
 */
export const dimensionLabel = (row: TrafficRow, dimension: TrafficDimension): string => {
  // Payment model is not a partner, so none of the three partner absences apply to it. A row
  // with no model at all means the report was not grouped by one, and the column is not drawn.
  if (dimension === 'paymentModel') {
    return row.paymentModel ? PAYMENT_MODEL_LABELS[row.paymentModel] ?? row.paymentModel : '—';
  }
  const id = dimension === 'customer' ? row.customerId : dimension === 'ans' ? row.ansId : row.icxId;
  const name = dimension === 'customer' ? row.customerName : dimension === 'ans' ? row.ansName : row.icxName;
  if (name) return name;
  if (id !== null) return `Unknown partner #${id}`;
  return 'Not attributable';
};

/** service-summary-pbx-2026-10-01-to-2026-10-31 */
export const serviceReportFileBase = (
  report: Pick<ServiceTrafficReport, 'service' | 'fromDate' | 'toDate'>
): string => `service-summary-${report.service || 'report'}-${report.fromDate}-to-${report.toDate}`;

/** Which families of columns to show, as the dashboard's toggles name them. */
export interface ColumnToggles {
  performance: boolean;
  revenue: boolean;
  cost: boolean;
}

export const ALL_COLUMNS: ColumnToggles = { performance: true, revenue: true, cost: true };

export type ColumnGroup = 'row' | 'outgoing' | 'incoming' | 'total';

/** One column: where it sits, what it is called, and how to read it off a row. */
export interface Column {
  key: string;
  group: ColumnGroup;
  label: string;
  numeric: boolean;
  /** The cell for a row, already formatted. */
  value: (row: TrafficRow) => string;
}

const legOf = (row: TrafficRow, group: 'outgoing' | 'incoming'): TrafficLeg =>
  group === 'outgoing' ? row.outgoing : row.incoming;

const totalsLeg = (report: ServiceTrafficReport, group: 'outgoing' | 'incoming'): TrafficLeg =>
  group === 'outgoing' ? report.totals.outgoing : report.totals.incoming;

/**
 * Whether a direction keeps a measure at all.
 *
 * Decided from the totals, which are over every row returned: the service may keep a measure on
 * one direction only, and a column of dashes tells the reader nothing.
 */
const legHas = (report: ServiceTrafficReport, group: 'outgoing' | 'incoming',
                measure: TrafficMeasure): boolean => {
  const leg = totalsLeg(report, group);
  switch (measure) {
    case 'chargeableUnits': return leg.chargeableUnits !== null;
    case 'ansCost': return leg.ansCost !== null;
    case 'carrierCost': return leg.carrierCost !== null;
    case 'vat': return leg.vat !== null;
    case 'pdd': return leg.pdd !== null;
    default: return false;
  }
};

const measureValue = (leg: TrafficLeg, measure: TrafficMeasure): string => {
  switch (measure) {
    case 'chargeableUnits': return fixed2(leg.chargeableUnits);
    case 'ansCost': return fixed2(leg.ansCost);
    case 'carrierCost': return fixed2(leg.carrierCost);
    case 'vat': return fixed2(leg.vat);
    case 'pdd': return leg.pdd === null ? '—' : `${leg.pdd.toFixed(2)}s`;
    default: return '—';
  }
};

/**
 * The columns for one report, in reading order.
 *
 * Both directions carry the same measures in the same order, so the two halves of the table can
 * be compared down the page, and a measure a direction does not keep is left out of that half
 * rather than filled with dashes.
 */
export const columnsFor = (
  report: ServiceTrafficReport,
  show: ColumnToggles = ALL_COLUMNS,
  direction: TrafficDirection = 'both'
): Column[] => {
  const unit = report.unit;
  const columns: Column[] = [];
  const legs = direction === 'both'
    ? (['outgoing', 'incoming'] as const)
    : ([direction] as const);

  if (report.groupInterval) {
    columns.push({
      key: 'period', group: 'row', label: 'Period', numeric: false,
      value: (row) => row.period ?? '—',
    });
  }
  report.groupBy.forEach((dimension) => {
    columns.push({
      key: dimension, group: 'row', label: DIMENSION_LABELS[dimension], numeric: false,
      value: (row) => dimensionLabel(row, dimension),
    });
  });
  if (columns.length === 0) {
    columns.push({
      key: 'all', group: 'row', label: 'Traffic', numeric: false,
      value: () => 'All',
    });
  }

  legs.forEach((group) => {
    const push = (key: string, label: string, read: (leg: TrafficLeg) => string) =>
      columns.push({
        key: `${group}.${key}`, group, label, numeric: true,
        value: (row) => read(legOf(row, group)),
      });

    push('totalCalls', 'Calls', (leg) => countText(leg.totalCalls));
    push('successfulCalls', 'Answered', (leg) => countText(leg.successfulCalls));
    if (show.performance && report.asrAvailable) {
      push('asr', 'ASR', (leg) => ratioText(leg.asr));
    }
    if (show.performance && report.acdAvailable) {
      push('acd', 'ACD', (leg) => ratioText(leg.acd, ''));
    }
    if (show.performance && legHas(report, group, 'pdd')) {
      push('pdd', MEASURE_LABELS.pdd, (leg) => measureValue(leg, 'pdd'));
    }
    push('actualUnits', `Actual ${unit}`, (leg) => fixed2(leg.actualUnits));
    push('billedUnits', `Billed ${unit}`, (leg) => fixed2(leg.billedUnits));
    if (legHas(report, group, 'chargeableUnits')) {
      push('chargeableUnits', `Chargeable ${unit}`, (leg) => measureValue(leg, 'chargeableUnits'));
    }
    if (show.revenue) {
      push('revenue', 'Revenue', (leg) => fixed2(leg.revenue));
      if (legHas(report, group, 'vat')) {
        push('vat', MEASURE_LABELS.vat, (leg) => measureValue(leg, 'vat'));
      }
    }
    if (show.cost) {
      if (legHas(report, group, 'ansCost')) {
        push('ansCost', MEASURE_LABELS.ansCost, (leg) => measureValue(leg, 'ansCost'));
      }
      if (legHas(report, group, 'carrierCost')) {
        push('carrierCost', MEASURE_LABELS.carrierCost, (leg) => measureValue(leg, 'carrierCost'));
      }
    }
    // One direction on its own has no "Total" block to carry the regulatory share, so it is
    // taken on that direction's revenue -- the same rate on the figures actually shown, rather
    // than a share of traffic the reader asked not to see.
    if (direction !== 'both' && show.revenue) {
      push('btrcShare', btrcShareLabel(report), (leg) => fixed2(share(leg.revenue, report)));
    }
  });

  // The Total block exists to add the two directions together. With one direction shown it
  // would only repeat that direction's own columns, so it is left out.
  if (direction === 'both') {
    columns.push({
      key: 'total.billedUnits', group: 'total', label: `Billed ${unit}`, numeric: true,
      value: (row) => fixed2(row.totalBilledUnits),
    });
    if (show.revenue) {
      columns.push({
        key: 'total.revenue', group: 'total', label: 'Revenue', numeric: true,
        value: (row) => fixed2(row.totalRevenue),
      });
      // Named with its rate: the share is a regulatory percentage someone else sets, and a
      // column headed only "BTRC share" would not say which rate produced the figure.
      columns.push({
        key: 'total.btrcShare', group: 'total', label: btrcShareLabel(report), numeric: true,
        value: (row) => fixed2(row.btrcShare),
      });
    }
  }
  return columns;
};

/**
 * The regulatory share of one figure, at the rate the report was built with.
 *
 * The backend applies this to a row's combined revenue; applied here to one direction it is the
 * same arithmetic on a smaller base, so a single-direction view and the combined view agree
 * when their revenues do.
 */
export const share = (
  revenue: number,
  report: Pick<ServiceTrafficReport, 'btrcSharePercent'>
): number => (Number.isFinite(revenue) ? (revenue * report.btrcSharePercent) / 100 : 0);

/** "BTRC share (2%)" — the rate is part of the name, not a footnote. */
export const btrcShareLabel = (report: Pick<ServiceTrafficReport, 'btrcSharePercent'>): string =>
  `BTRC share (${trimRate(report.btrcSharePercent)}%)`;

/** 2 rather than 2.00, and 2.5 kept, so the label reads as the rate was written. */
const trimRate = (percent: number): string =>
  Number.isFinite(percent) ? String(Number(percent.toFixed(2))) : '0';

/** The header a direction's block carries, so the table needs no repetition per column. */
export const GROUP_LABELS: Record<ColumnGroup, string> = {
  row: '',
  outgoing: 'Outgoing',
  incoming: 'Incoming',
  total: 'Total',
};

export interface ServiceReportMeta {
  /** Who exported it, from the token's subject, or null when the token cannot be read. */
  generatedBy?: string | null;
  /** The filters in force, as the page shows them, e.g. ['Customer: Acme Ltd']. */
  filters?: string[];
  /** Fixed in tests; the moment of export otherwise. */
  generatedAt?: Date;
}

/** The export's detail header: the group each column belongs to, then the column. */
export const detailHeaders = (
  report: ServiceTrafficReport,
  show: ColumnToggles = ALL_COLUMNS,
  direction: TrafficDirection = 'both'
): string[] => [
  'SL',
  ...columnsFor(report, show, direction).map((column) =>
    column.group === 'row' ? column.label : `${GROUP_LABELS[column.group]} ${column.label}`
  ),
];

export const serviceTrafficReportCsv = (
  report: ServiceTrafficReport,
  meta: ServiceReportMeta = {},
  show: ColumnToggles = ALL_COLUMNS,
  direction: TrafficDirection = 'both'
): string => {
  const lines: (string | number | null)[][] = [];
  const blank = () => lines.push([]);
  const columns = columnsFor(report, show, direction);
  const t = report.totals;

  lines.push([`${report.serviceLabel || report.service} Summary Report`]);
  lines.push(['BTCL Communication Platform · Alaap Cloud']);
  lines.push(['Period', `${report.fromDate} to ${report.toDate} (both days included)`]);
  lines.push(['Summarised by', report.groupInterval || 'the whole period']);
  lines.push(['Direction', DIRECTION_LABELS[direction]]);
  lines.push(['Grouped by', report.groupBy.map((d) => DIMENSION_LABELS[d]).join(' · ') || 'nothing']);
  (meta.filters ?? []).forEach((f) => lines.push(['Filter', f]));
  lines.push(['Unit', report.unit]);
  lines.push(['Generated', (meta.generatedAt ?? new Date()).toISOString()]);
  if (meta.generatedBy) lines.push(['Generated by', meta.generatedBy]);
  // Named so a figure can be traced to the table it came from on whichever deployment made it.
  lines.push(['Source tables', report.tables.join(' · ') || '—']);
  if (report.asrAvailable && report.asrBasis) lines.push(['ASR is', report.asrBasis]);
  if (report.asrUnavailableReason) lines.push(['Note', report.asrUnavailableReason]);
  if (!report.acdAvailable) {
    lines.push(['Note', `A ${report.serviceLabel} message has a billable length and no duration, `
      + 'so no average duration is reported.']);
  }
  if (report.measures.includes('chargeableUnits') && t.incoming.chargeableUnits === null) {
    lines.push(['Note', 'Chargeable duration is written on outgoing rows only, so the incoming '
      + 'side reports none rather than zero.']);
  }
  report.unattributable.forEach((d) =>
    lines.push(['Note', `Incoming rows carry no ${DIMENSION_LABELS[d]}, so their traffic is reported `
      + 'on a row marked "Not attributable".'])
  );
  blank();

  lines.push(['SUMMARY']);
  lines.push(['Rows', t.rows]);
  (['outgoing', 'incoming'] as const).forEach((group) => {
    const leg = totalsLeg(report, group);
    const name = GROUP_LABELS[group];
    lines.push([`${name} calls`, leg.totalCalls]);
    lines.push([`${name} answered`, leg.successfulCalls]);
    if (report.asrAvailable) lines.push([`${name} ASR`, ratioText(leg.asr)]);
    if (report.acdAvailable) {
      lines.push([`${name} ACD (${report.unit} per answered call)`, ratioText(leg.acd, '')]);
    }
    if (leg.pdd !== null) lines.push([`${name} PDD (seconds per answered call)`, measureValue(leg, 'pdd')]);
    lines.push([`${name} actual ${report.unit}`, fixed2(leg.actualUnits)]);
    lines.push([`${name} billed ${report.unit}`, fixed2(leg.billedUnits)]);
    if (leg.chargeableUnits !== null) {
      lines.push([`${name} chargeable ${report.unit}`, fixed2(leg.chargeableUnits)]);
    }
    lines.push([`${name} revenue (BDT)`, fixed2(leg.revenue)]);
    if (leg.vat !== null) lines.push([`${name} VAT & commission (BDT)`, fixed2(leg.vat)]);
    if (leg.ansCost !== null) lines.push([`${name} ANS cost (BDT)`, fixed2(leg.ansCost)]);
    if (leg.carrierCost !== null) lines.push([`${name} ICX/IOS cost (BDT)`, fixed2(leg.carrierCost)]);
  });
  lines.push([`Total billed ${report.unit}`, fixed2(t.totalBilledUnits)]);
  lines.push(['Total revenue (BDT)', fixed2(t.totalRevenue)]);
  // Of the filtered total, so a report narrowed to one customer states that customer's share.
  lines.push([`${btrcShareLabel(report)} (BDT)`, fixed2(t.btrcShare)]);
  blank();

  lines.push(['DETAIL']);
  lines.push(detailHeaders(report, show, direction));
  // No totals line: the SUMMARY block above carries the range's totals, and repeating them
  // under the detail would state the same figures twice in one file.
  report.rows.forEach((row, i) => lines.push([i + 1, ...columns.map((column) => column.value(row))]));

  return lines.map((line) => line.map(cell).join(',')).join('\r\n');
};

// -- the overview: every service's totals, one row each ------------------------------------

/** One column of the overview table. */
export interface OverviewColumn {
  key: string;
  label: string;
  numeric: boolean;
  value: (entry: ServiceOverviewEntry) => string;
  /** The all-services figure, or an em dash where adding the services up would be wrong. */
  total: (entries: ServiceOverviewEntry[]) => string;
}

const entryLeg = (entry: ServiceOverviewEntry, direction: TrafficDirection): TrafficLeg | null => {
  if (!entry.report) return null;
  const t = entry.report.totals;
  return direction === 'incoming' ? t.incoming : t.outgoing;
};

/** Adds one figure across the services that could be read, skipping the ones that could not. */
const sumOver = (
  entries: ServiceOverviewEntry[],
  read: (entry: ServiceOverviewEntry) => number | null
): number =>
  entries.reduce((acc, entry) => {
    const v = read(entry);
    return acc + (v === null || !Number.isFinite(v) ? 0 : v);
  }, 0);

/**
 * The overview's columns.
 *
 * Deliberately NOT a copy of the detail columns. Services are measured in different things --
 * minutes for voice, SMS units for messages -- so the unit is a column of its own and the
 * duration figures are never added up across services: a total of "minutes plus SMS units" is
 * a number with no meaning. Money is money, so revenue, VAT and the regulatory share do total.
 */
export const overviewColumnsFor = (
  direction: TrafficDirection = 'outgoing',
  show: ColumnToggles = ALL_COLUMNS
): OverviewColumn[] => {
  const both = direction === 'both';
  /** Outgoing plus incoming where both are asked for, otherwise the one leg. */
  const over = (e: ServiceOverviewEntry, read: (l: TrafficLeg) => number | null): number | null => {
    if (!e.report) return null;
    if (!both) {
      const l = entryLeg(e, direction);
      return l ? read(l) : null;
    }
    const o = read(e.report.totals.outgoing);
    const i = read(e.report.totals.incoming);
    if (o === null && i === null) return null;
    return (o ?? 0) + (i ?? 0);
  };
  const num = (
    key: string,
    label: string,
    read: (l: TrafficLeg) => number | null,
    addable: boolean,
    format: (n: number | null) => string = fixed2
  ): OverviewColumn => ({
    key,
    label,
    numeric: true,
    value: (e) => (e.report ? format(over(e, read)) : '-'),
    total: (list) => (addable ? format(sumOver(list, (e) => over(e, read))) : '-'),
  });

  const columns: OverviewColumn[] = [
    {
      key: 'service',
      label: 'Service',
      numeric: false,
      value: (e) => e.label,
      total: () => 'ALL SERVICES',
    },
    {
      key: 'unit',
      label: 'Unit',
      numeric: false,
      // Carried per row precisely because it differs, which is why the duration columns below
      // are not added up.
      value: (e) => e.unit,
      total: () => '-',
    },
    num('totalCalls', 'Calls', (l) => l.totalCalls, true, (n) => countText(n)),
    num('successfulCalls', 'Answered', (l) => l.successfulCalls, true, (n) => countText(n)),
    num('actualUnits', 'Actual', (l) => l.actualUnits, false),
    num('billedUnits', 'Billed', (l) => l.billedUnits, false),
  ];
  if (show.revenue) {
    columns.push(num('revenue', 'Revenue', (l) => l.revenue, true));
    columns.push(num('vat', MEASURE_LABELS.vat, (l) => l.vat, true));
    columns.push({
      key: 'btrcShare',
      label: 'BTRC share',
      numeric: true,
      value: (e) => {
        if (!e.report) return '-';
        const revenue = over(e, (l) => l.revenue);
        return revenue === null ? '-' : fixed2(share(revenue, e.report));
      },
      total: (list) =>
        fixed2(
          sumOver(list, (e) => {
            if (!e.report) return null;
            const revenue = over(e, (l) => l.revenue);
            return revenue === null ? null : share(revenue, e.report);
          })
        ),
    });
  }
  if (show.cost) {
    columns.push(num('ansCost', MEASURE_LABELS.ansCost, (l) => l.ansCost, true));
    columns.push(num('carrierCost', MEASURE_LABELS.carrierCost, (l) => l.carrierCost, true));
  }
  return columns;
};

/** The overview as a spreadsheet. */
export const serviceOverviewCsv = (
  entries: ServiceOverviewEntry[],
  range: { fromDate: string; toDate: string },
  direction: TrafficDirection = 'outgoing',
  meta: ServiceReportMeta = {},
  show: ColumnToggles = ALL_COLUMNS
): string => {
  const lines: (string | number | null)[][] = [];
  const columns = overviewColumnsFor(direction, show);

  lines.push(['All Services Summary']);
  lines.push(['BTCL Communication Platform - Alaap Cloud']);
  lines.push(['Period', `${range.fromDate} to ${range.toDate} (both days included)`]);
  lines.push(['Direction', DIRECTION_LABELS[direction]]);
  (meta.filters ?? []).forEach((f) => lines.push(['Filter', f]));
  lines.push(['Generated', (meta.generatedAt ?? new Date()).toISOString()]);
  if (meta.generatedBy) lines.push(['Generated by', meta.generatedBy]);
  lines.push([
    'Note',
    'Services are measured in different units, so the duration columns are not added up across '
      + 'services. Money is.',
  ]);
  entries
    .filter((e) => e.error)
    .forEach((e) => lines.push(['Note', `${e.label} could not be read: ${e.error}`]));
  lines.push([]);

  lines.push(columns.map((c) => c.label));
  entries.forEach((entry) => lines.push(columns.map((c) => c.value(entry))));
  lines.push(columns.map((c) => c.total(entries)));

  return lines.map((line) => line.map(cell).join(',')).join('\r\n');
};
