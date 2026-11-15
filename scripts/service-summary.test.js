/**
 * Tests for the Service Summary Report's client side: what the page makes of the backend's
 * payload, which columns it builds for each service, and what the CSV export writes.
 *
 * The aggregation is the backend's (ServiceTrafficReportTest covers it). What can go wrong here
 * is the translation: a figure read as NaN, a measure the engine never wrote turned into 0.00,
 * an unknown partner shown as "null", traffic a direction cannot attribute looking like a
 * missing name, a ratio of "not applicable" printed as 0%, an ACD or PDD column appearing for
 * Bulk SMS, or a header that does not line up with its rows. These run the real
 * normaliseServiceTrafficReport, columnsFor and serviceTrafficReportCsv from src/lib.
 *
 * The repo has no test runner, so this is a plain node script:  npm run test:service-summary
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ts = require(path.join(ROOT, 'node_modules/typescript'));

const load = (relPath, stubs) => {
  const src = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('require', 'exports', 'module', js)((id) => stubs[id] ?? require(id), mod.exports, mod);
  return mod.exports;
};

const client = load('src/lib/api-client/serviceTraffic.ts', {
  axios: {
    default: {
      get: async () => ({ data: [] }),
      post: async () => ({ data: {} }),
      isCancel: () => false,
      isAxiosError: () => false,
    },
  },
  '@/config/api': {
    API_BASE_URL: 'https://example.invalid',
    API_ENDPOINTS: { reports: { serviceTraffic: '/t', trafficServices: '/s', trafficPartners: '/p' } },
  },
});
const report = load('src/lib/reports/serviceTrafficReport.ts', {
  '@/lib/api-client/serviceTraffic': client,
});

// ── fixtures: October 2026, as the live summaries hold it ──────────────────────────────────────
/** A direction with everything absent, so a fixture only states what it means to state. */
const leg = (over) => ({
  totalCalls: 0, successfulCalls: 0, connectedCalls: 0,
  actualUnits: 0, billedUnits: 0, chargeableUnits: null,
  revenue: 0, ansCost: null, carrierCost: null, vat: null,
  asr: null, acd: null, pdd: null,
  ...over,
});

const row = (over) => ({
  period: null, customerId: null, customerName: null, ansId: null, ansName: null,
  icxId: null, icxName: null, paymentModel: null,
  outgoing: leg({}), incoming: leg({}),
  totalBilledUnits: 0, totalRevenue: 0, btrcShare: 0,
  ...over,
});

/**
 * Hosted PBX by customer. INVENTED FIGURES, deliberately round so a total can be checked by
 * eye: one large customer with both directions, and one with incoming traffic only. Incoming
 * keeps VAT and PDD but no chargeable duration and no costs, because the engine does not write
 * them that way round -- that asymmetry is the point of the fixture, not the amounts.
 */
const PBX = {
  service: 'pbx', serviceLabel: 'Hosted PBX', unit: 'minutes',
  asrAvailable: true, acdAvailable: true,
  asrBasis: 'answered ÷ attempted calls, from the billing summaries', asrUnavailableReason: null,
  measures: ['chargeableUnits', 'ansCost', 'carrierCost', 'vat', 'pdd'],
  btrcSharePercent: 2,
  fromDate: '2026-10-01', toDate: '2026-10-31', groupInterval: '', groupBy: ['customer'],
  tables: ['sum_voice_day_03', 'sum_voice_day_02'], unattributable: [],
  paymentModelAvailable: true, paymentModelUnavailableReason: null, mixedPaymentModelRows: 0,
  rows: [
    row({
      customerId: 101, customerName: 'Meghna Textiles Ltd',
      outgoing: leg({
        totalCalls: 1000000, successfulCalls: 250000, connectedCalls: 250000,
        actualUnits: 500000, billedUnits: 520000, chargeableUnits: 525000,
        revenue: 200000, ansCost: 60000, carrierCost: 8000, vat: 30000,
        asr: 25, acd: 2, pdd: 5,
      }),
      incoming: leg({
        totalCalls: 400000, successfulCalls: 380000, connectedCalls: 380000,
        actualUnits: 100000, billedUnits: 104000, revenue: 10000, vat: 1500,
        asr: 95, acd: 0.26, pdd: 1.5,
      }),
      totalBilledUnits: 624000, totalRevenue: 210000, btrcShare: 4200,
    }),
    row({
      customerId: 102, customerName: 'Northern Regional Office',
      incoming: leg({
        totalCalls: 500, successfulCalls: 400, actualUnits: 800, billedUnits: 820,
        revenue: 50, vat: 7.5, asr: 80, acd: 2.05, pdd: 2,
      }),
      totalBilledUnits: 820, totalRevenue: 50, btrcShare: 1,
    }),
  ],
  totals: {
    rows: 2,
    outgoing: leg({
      totalCalls: 1000000, successfulCalls: 250000, connectedCalls: 250000,
      actualUnits: 500000, billedUnits: 520000, chargeableUnits: 525000,
      revenue: 200000, ansCost: 60000, carrierCost: 8000, vat: 30000,
      asr: 25, acd: 2, pdd: 5,
    }),
    incoming: leg({
      totalCalls: 400500, successfulCalls: 380400, connectedCalls: 380400,
      actualUnits: 100800, billedUnits: 104820, revenue: 10050, vat: 1507.5,
      asr: 94.98, acd: 0.26, pdd: 1.5,
    }),
    totalBilledUnits: 624820, totalRevenue: 210050, btrcShare: 4201,
  },
};

/** Bulk SMS by customer: ASR counted from the message records, no ACD, no PDD. */
const SMS = {
  service: 'sms', serviceLabel: 'Bulk SMS', unit: 'SMS units',
  asrAvailable: true, acdAvailable: false,
  asrBasis: 'delivered ÷ submitted messages, from campaign_task', asrUnavailableReason: null,
  measures: ['chargeableUnits', 'ansCost', 'carrierCost', 'vat'],
  btrcSharePercent: 2,
  fromDate: '2026-10-01', toDate: '2026-10-31', groupInterval: '', groupBy: ['customer'],
  tables: ['sum_voice_day_01', 'sum_voice_day_02'], unattributable: [],
  rows: [
    row({
      customerId: 201, customerName: 'Padma Logistics Ltd',
      outgoing: leg({
        totalCalls: 200000, successfulCalls: 190000, actualUnits: 250000, billedUnits: 250000,
        chargeableUnits: 250000, revenue: 6250, ansCost: 25000, carrierCost: 6250,
        vat: 937.5, asr: 95,
      }),
      incoming: leg({
        totalCalls: 300000, successfulCalls: 300000, actualUnits: 500000, billedUnits: 500000,
        revenue: 12500,
      }),
      totalBilledUnits: 750000, totalRevenue: 18750, btrcShare: 375,
    }),
  ],
  totals: {
    rows: 1,
    outgoing: leg({
      totalCalls: 200000, successfulCalls: 190000, actualUnits: 250000, billedUnits: 250000,
      chargeableUnits: 250000, revenue: 6250, ansCost: 25000, carrierCost: 6250,
      vat: 937.5, asr: 95,
    }),
    incoming: leg({
      totalCalls: 300000, successfulCalls: 300000, actualUnits: 500000, billedUnits: 500000,
      revenue: 12500,
    }),
    totalBilledUnits: 750000, totalRevenue: 18750, btrcShare: 375,
  },
};

/** Bulk SMS by ANS and month, where the message records cannot attribute a ratio. */
const SMS_BY_ANS = {
  ...SMS,
  groupInterval: 'Monthly', groupBy: ['ans'],
  asrBasis: null,
  asrUnavailableReason:
    'Bulk SMS counts deliveries per customer, not per ANS, so no answer ratio is reported for this grouping',
  rows: [
    row({
      period: '2026-10', ansId: 2, ansName: 'Jamuna Telecom',
      outgoing: leg({
        totalCalls: 120000, successfulCalls: 120000, actualUnits: 120000, billedUnits: 120000,
        chargeableUnits: 120000, revenue: 3000, ansCost: 12000, carrierCost: 3000, vat: 450,
      }),
      incoming: leg({
        totalCalls: 370000, successfulCalls: 370000, actualUnits: 580000, billedUnits: 580000,
        revenue: 14500,
      }),
      totalBilledUnits: 700000, totalRevenue: 17500, btrcShare: 350,
    }),
  ],
  // No ratio anywhere, as the backend leaves it when it cannot attribute one to this grouping.
  totals: {
    ...SMS.totals,
    outgoing: { ...SMS.totals.outgoing, asr: null },
    incoming: { ...SMS.totals.incoming, asr: null },
  },
};

const AT = new Date('2026-11-09T06:00:00.000Z');

let failures = 0;
const results = [];
const test = (name, fn) => {
  try {
    fn();
    results.push(['PASS', name]);
  } catch (e) {
    failures++;
    results.push(['FAIL', `${name}\n        ${e.message}`]);
  }
};
const eq = (actual, expected, what) => {
  if (actual !== expected) {
    throw new Error(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};
const csvRows = (csv) =>
  csv.split('\r\n').map((line) => {
    const cells = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') { cells.push(cur); cur = ''; }
      else cur += ch;
    }
    cells.push(cur);
    return cells;
  });
const rowStarting = (csv, first) => {
  const found = csvRows(csv).find((cells) => cells[0] === first);
  if (!found) throw new Error(`no CSV row starting "${first}"`);
  return found;
};

// ── what the page makes of the payload ────────────────────────────────────────────────────────
test('a well-formed payload comes through unchanged', () => {
  const r = client.normaliseServiceTrafficReport(PBX);
  eq(r.service, 'pbx', 'service');
  eq(r.unit, 'minutes', 'unit');
  eq(r.asrAvailable, true, 'ASR offered');
  eq(r.acdAvailable, true, 'ACD offered');
  eq(r.rows.length, 2, 'rows');
  eq(r.rows[0].outgoing.totalCalls, 1000000, 'attempts');
  eq(r.rows[0].outgoing.chargeableUnits, 525000, 'chargeable minutes');
  eq(r.rows[0].outgoing.pdd, 5, 'PDD');
  eq(r.totals.totalRevenue, 210050.00, 'total revenue');
  eq(r.measures.join('|'), 'chargeableUnits|ansCost|carrierCost|vat|pdd', 'measures');
});

test('figures sent as strings become numbers and absent counts read as zero', () => {
  const r = client.normaliseServiceTrafficReport({
    rows: [{ customerId: '7', outgoing: { revenue: '12.50', billedUnits: '3' } }],
    totals: { rows: '1' },
  });
  eq(r.rows[0].customerId, 7, 'id');
  eq(r.rows[0].outgoing.revenue, 12.5, 'revenue');
  eq(r.rows[0].outgoing.billedUnits, 3, 'units');
  eq(r.rows[0].outgoing.totalCalls, 0, 'absent count');
  eq(r.totals.rows, 1, 'totals.rows');
});

test('a measure the engine never wrote stays null rather than becoming zero', () => {
  const r = client.normaliseServiceTrafficReport(PBX);
  // The engine writes duration1 and the costs on outgoing rows only.
  eq(r.rows[0].incoming.chargeableUnits, null, 'incoming chargeable');
  eq(r.rows[0].incoming.ansCost, null, 'incoming ANS cost');
  eq(r.rows[0].incoming.carrierCost, null, 'incoming carrier cost');
  eq(r.totals.incoming.chargeableUnits, null, 'totals incoming chargeable');
  // What it does keep is still there.
  eq(r.rows[0].incoming.vat, 1500, 'incoming VAT');
});

test('a bad unit, dimension or measure in the payload cannot poison the page', () => {
  const r = client.normaliseServiceTrafficReport({
    unit: '', groupBy: ['customer', 'switch', null], measures: ['vat', 'nonsense'],
    unattributable: 'ans', rows: [], totals: {},
  });
  eq(r.unit, 'minutes', 'unit falls back');
  eq(r.groupBy.join('|'), 'customer', 'unknown dimension dropped');
  eq(r.measures.join('|'), 'vat', 'unknown measure dropped');
  eq(r.unattributable.length, 0, 'non-array ignored');
});

test('Bulk SMS carries an answer ratio but no average duration', () => {
  const r = client.normaliseServiceTrafficReport(SMS);
  eq(r.asrAvailable, true, 'ASR offered');
  eq(r.acdAvailable, false, 'no ACD');
  eq(r.rows[0].outgoing.asr, 95, 'counted ratio');
  eq(r.rows[0].outgoing.acd, null, 'no duration');
  eq(r.rows[0].outgoing.pdd, null, 'no post-dial delay');
  eq(r.asrBasis.includes('campaign_task'), true, 'basis named');
  // The printed ratio is the printed columns divided.
  const pct = Math.round((r.rows[0].outgoing.successfulCalls / r.rows[0].outgoing.totalCalls) * 10000) / 100;
  eq(pct, 95, 'ratio matches its columns');
});

test('a grouping the message records cannot attribute says so instead of a ratio', () => {
  const r = client.normaliseServiceTrafficReport(SMS_BY_ANS);
  eq(r.rows[0].outgoing.asr, null, 'no row ASR');
  eq(r.asrUnavailableReason.includes('not per ANS'), true, 'reason given');
});

test('the three kinds of missing name read differently', () => {
  const r = client.normaliseServiceTrafficReport({
    rows: [{ customerId: 999, customerName: null }, { customerId: null, customerName: null }],
    totals: {},
  });
  eq(report.dimensionLabel(r.rows[0], 'customer'), 'Unknown partner #999', 'partner gone from the table');
  eq(report.dimensionLabel(r.rows[1], 'customer'), 'Not attributable', 'direction cannot attribute it');
  eq(report.dimensionLabel({ customerId: 101, customerName: 'Meghna Textiles Ltd' }, 'customer'), 'Meghna Textiles Ltd', 'named');
});

test('nothing at all still returns a report shape', () => {
  const r = client.normaliseServiceTrafficReport(undefined);
  eq(r.rows.length, 0, 'rows');
  eq(r.totals.rows, 0, 'totals');
  eq(r.totals.outgoing.totalCalls, 0, 'totals leg');
  eq(r.tables.length, 0, 'tables');
  eq(r.groupInterval, '', 'interval');
});

// ── the column set ────────────────────────────────────────────────────────────────────────────
test('voice columns carry the dashboard measures on both directions', () => {
  const cols = report.columnsFor(PBX).map((c) => `${c.group}.${c.label}`);
  eq(cols.includes('row.Customer'), true, 'grouped dimension');
  ['Calls', 'Answered', 'ASR', 'ACD', 'PDD', 'Actual minutes', 'Billed minutes'].forEach((label) => {
    eq(cols.includes(`outgoing.${label}`), true, `outgoing ${label}`);
    eq(cols.includes(`incoming.${label}`), true, `incoming ${label}`);
  });
  // Chargeable duration and the costs are outgoing-only, so the incoming half omits them.
  eq(cols.includes('outgoing.Chargeable minutes'), true, 'outgoing chargeable');
  eq(cols.includes('incoming.Chargeable minutes'), false, 'no incoming chargeable column');
  eq(cols.includes('outgoing.ANS cost'), true, 'outgoing ANS cost');
  eq(cols.includes('incoming.ANS cost'), false, 'no incoming ANS cost column');
  eq(cols.includes('incoming.VAT & commission'), true, 'incoming VAT is kept');
  eq(cols.includes('total.Billed minutes'), true, 'total');
});

test('the toggles add and remove whole families of columns', () => {
  const none = report.columnsFor(PBX, { performance: false, revenue: false, cost: false })
    .map((c) => c.label);
  eq(none.includes('ASR'), false, 'no performance');
  eq(none.includes('Revenue'), false, 'no revenue');
  eq(none.includes('ANS cost'), false, 'no cost');
  // What is never optional stays.
  eq(none.includes('Calls'), true, 'calls stay');
  eq(none.includes('Billed minutes'), true, 'billed minutes stay');

  const all = report.columnsFor(PBX).map((c) => c.label);
  eq(all.includes('ASR') && all.includes('Revenue') && all.includes('ICX/IOS cost'), true, 'all on');
});

test('Bulk SMS gets an ASR column but never an ACD or PDD one', () => {
  const cols = report.columnsFor(SMS).map((c) => c.label);
  eq(cols.includes('ASR'), true, 'ASR');
  eq(cols.includes('ACD'), false, 'no ACD');
  eq(cols.includes('PDD'), false, 'no PDD');
  eq(cols.includes('Billed SMS units'), true, 'unit in the label');
  eq(cols.includes('Chargeable SMS units'), true, 'chargeable units');
});

test('a period bucket adds a period column before the grouping', () => {
  const cols = report.columnsFor(SMS_BY_ANS).map((c) => `${c.group}.${c.label}`);
  eq(cols[0], 'row.Period', 'period first');
  eq(cols[1], 'row.ANS', 'then the dimension');
});

test('every column reads a value off a row, and the detail carries no totals line', () => {
  const cols = report.columnsFor(PBX);
  const first = PBX.rows[0];
  cols.forEach((column) => {
    if (typeof column.value(first) !== 'string') throw new Error(`${column.key} did not return a string`);
    // The range's totals are the page's tiles and the export's SUMMARY block. A column that
    // could also print a totals row would let the two disagree.
    if ('total' in column) throw new Error(`${column.key} still carries a totals reader`);
  });
  const byKey = Object.fromEntries(cols.map((c) => [c.key, c]));
  eq(byKey['outgoing.billedUnits'].value(first), '520000.00', 'billed minutes');
  eq(byKey['outgoing.chargeableUnits'].value(first), '525000.00', 'chargeable minutes');
  eq(byKey['outgoing.asr'].value(first), '25.00%', 'ASR');
  eq(byKey['outgoing.pdd'].value(first), '5.00s', 'PDD in seconds');
  eq(byKey['total.revenue'].value(first), '210000.00', "the row's own combined revenue");
});

// ── the CSV export ────────────────────────────────────────────────────────────────────────────
test('the export names the service, period, grouping and source tables', () => {
  const csv = report.serviceTrafficReportCsv(PBX, {
    generatedAt: AT, generatedBy: 'reports.admin', filters: ['Customer: Meghna Textiles Ltd'],
  });
  eq(csvRows(csv)[0][0], 'Hosted PBX Summary Report', 'title');
  eq(rowStarting(csv, 'Period')[1], '2026-10-01 to 2026-10-31 (both days included)', 'period');
  eq(rowStarting(csv, 'Summarised by')[1], 'the whole period', 'bucket');
  eq(rowStarting(csv, 'Grouped by')[1], 'Customer', 'grouping');
  eq(rowStarting(csv, 'Filter')[1], 'Customer: Meghna Textiles Ltd', 'filter line');
  eq(rowStarting(csv, 'Generated by')[1], 'reports.admin', 'generated by');
  eq(rowStarting(csv, 'Source tables')[1], 'sum_voice_day_03 · sum_voice_day_02', 'tables');
  eq(rowStarting(csv, 'ASR is')[1].includes('billing summaries'), true, 'ASR basis');
});

test('the summary block carries every measure each direction keeps', () => {
  const csv = report.serviceTrafficReportCsv(PBX, { generatedAt: AT });
  eq(rowStarting(csv, 'Outgoing calls')[1], '1000000', 'outgoing calls');
  eq(rowStarting(csv, 'Outgoing answered')[1], '250000', 'answered');
  eq(rowStarting(csv, 'Outgoing ASR')[1], '25.00%', 'ASR');
  eq(rowStarting(csv, 'Outgoing PDD (seconds per answered call)')[1], '5.00s', 'PDD');
  eq(rowStarting(csv, 'Outgoing actual minutes')[1], '500000.00', 'actual');
  eq(rowStarting(csv, 'Outgoing billed minutes')[1], '520000.00', 'billed');
  eq(rowStarting(csv, 'Outgoing chargeable minutes')[1], '525000.00', 'chargeable');
  eq(rowStarting(csv, 'Outgoing ANS cost (BDT)')[1], '60000.00', 'ANS cost');
  eq(rowStarting(csv, 'Outgoing ICX/IOS cost (BDT)')[1], '8000.00', 'carrier cost');
  eq(rowStarting(csv, 'Outgoing VAT & commission (BDT)')[1], '30000.00', 'VAT');
  eq(rowStarting(csv, 'Total revenue (BDT)')[1], '210050.00', 'total revenue');
  // The incoming block has no chargeable or cost lines at all.
  eq(csvRows(csv).some((cells) => cells[0] === 'Incoming chargeable minutes'), false, 'no incoming chargeable');
  eq(csvRows(csv).some((cells) => cells[0] === 'Incoming ANS cost (BDT)'), false, 'no incoming ANS cost');
  eq(rowStarting(csv, 'Incoming VAT & commission (BDT)')[1], '1507.50', 'incoming VAT');
});

test('every detail row has exactly as many cells as the header', () => {
  for (const [name, fixture] of [['pbx', PBX], ['sms', SMS], ['sms-by-ans', SMS_BY_ANS]]) {
    const rows = csvRows(report.serviceTrafficReportCsv(fixture, { generatedAt: AT }));
    const headerAt = rows.findIndex((cells) => cells[0] === 'SL');
    const width = rows[headerAt].length;
    for (let i = headerAt + 1; i < rows.length; i++) {
      if (rows[i].length === 1 && rows[i][0] === '') continue;
      eq(rows[i].length, width, `${name} row ${i - headerAt} width`);
    }
  }
});

test('the detail rows carry the figures and end with the last row', () => {
  const rows = csvRows(report.serviceTrafficReportCsv(PBX, { generatedAt: AT }));
  const headerAt = rows.findIndex((cells) => cells[0] === 'SL');
  const header = rows[headerAt];
  const at = (rowIndex, label) => rows[rowIndex][header.indexOf(label)];
  eq(rows[headerAt + 1][1], 'Meghna Textiles Ltd', 'first customer');
  eq(at(headerAt + 1, 'Outgoing Billed minutes'), '520000.00', 'billed minutes');
  eq(at(headerAt + 1, 'Outgoing Chargeable minutes'), '525000.00', 'chargeable minutes');
  eq(at(headerAt + 1, 'Outgoing ASR'), '25.00%', 'ASR');
  // The customer with no outgoing traffic: a dash for the ratio, not 0%.
  eq(at(headerAt + 2, 'Outgoing ASR'), '—', 'no ratio without attempts');
  eq(at(headerAt + 2, 'Incoming Billed minutes'), '820.00', 'incoming billed minutes');
  // No TOTAL line under the detail: the SUMMARY block above already states the range's
  // figures, and printing them twice in one file invites them to be read as two numbers.
  eq(rows.some((cells) => cells[1] === 'TOTAL'), false, 'no totals line under the detail');
  eq(rowStarting(report.serviceTrafficReportCsv(PBX, { generatedAt: AT }), 'Total revenue (BDT)')[1],
    '210050.00', 'the range total is in the summary block instead');
});

test('the SMS export states where its ratio comes from, and why it has no ACD', () => {
  const csv = report.serviceTrafficReportCsv(SMS, { generatedAt: AT });
  eq(rowStarting(csv, 'ASR is')[1].includes('campaign_task'), true, 'basis');
  const note = csvRows(csv).find((cells) => cells[0] === 'Note' && cells[1].includes('no duration'));
  eq(note !== undefined, true, 'ACD note');
  eq(rowStarting(csv, 'Unit')[1], 'SMS units', 'unit');
  eq(rowStarting(csv, 'Outgoing ASR')[1], '95.00%', 'ratio');
  eq(rowStarting(csv, 'Total billed SMS units')[1], '750000.00', 'total units');
});

test('an SMS grouping with no ratio carries the reason instead of a basis', () => {
  const csv = report.serviceTrafficReportCsv(SMS_BY_ANS, { generatedAt: AT });
  const note = csvRows(csv).find((cells) => cells[0] === 'Note' && cells[1].includes('not per ANS'));
  eq(note !== undefined, true, 'reason in the export');
  eq(rowStarting(csv, 'Outgoing ASR')[1], '—', 'no ratio printed');
  eq(rowStarting(csv, 'Total billed SMS units')[1], '750000.00', 'volumes unaffected');
});

test('the export explains that chargeable duration is one-directional', () => {
  const csv = report.serviceTrafficReportCsv(PBX, { generatedAt: AT });
  const note = csvRows(csv).find((cells) => cells[0] === 'Note' && cells[1].includes('outgoing rows only'));
  eq(note !== undefined, true, 'note present');
});

test('an unattributable dimension is explained in the export', () => {
  const csv = report.serviceTrafficReportCsv(
    { ...PBX, groupBy: ['ans'], unattributable: ['ans'] }, { generatedAt: AT });
  const note = csvRows(csv).find((cells) => cells[0] === 'Note' && cells[1].includes('ANS'));
  eq(note[1].includes('Not attributable'), true, 'explains the row');
});

test('an empty period exports its header and no TOTAL line', () => {
  const empty = { ...PBX, rows: [], totals: { ...PBX.totals, rows: 0 } };
  const rows = csvRows(report.serviceTrafficReportCsv(empty, { generatedAt: AT }));
  eq(rows.some((cells) => cells[0] === 'SL'), true, 'header present');
  eq(rows.some((cells) => cells[1] === 'TOTAL'), false, 'no TOTAL row');
});

test('the file name carries the service and the period', () => {
  eq(report.serviceReportFileBase(PBX), 'service-summary-pbx-2026-10-01-to-2026-10-31', 'pbx');
  eq(report.serviceReportFileBase(SMS), 'service-summary-sms-2026-10-01-to-2026-10-31', 'sms');
});

test("BTRC's share is a column of its own, named with its rate", () => {
  const r = client.normaliseServiceTrafficReport(PBX);
  eq(r.btrcSharePercent, 2, 'rate');
  eq(r.rows[0].btrcShare, 4200, "the first customer's share");
  eq(r.totals.btrcShare, 4201, 'the filtered total share');
  eq(report.btrcShareLabel(r), 'BTRC share (2%)', 'label');
  // A rate written as 2.5 reads as 2.5, and 2.00 reads as 2.
  eq(report.btrcShareLabel({ btrcSharePercent: 2.5 }), 'BTRC share (2.5%)', 'fractional rate');
  eq(report.btrcShareLabel({ btrcSharePercent: 2.0 }), 'BTRC share (2%)', 'whole rate');

  const byKey = Object.fromEntries(report.columnsFor(PBX).map((c) => [c.key, c]));
  eq(byKey['total.btrcShare'].label, 'BTRC share (2%)', 'column label');
  eq(byKey['total.btrcShare'].value(PBX.rows[0]), '4200.00', 'row cell');
  // It is revenue, so the Revenue toggle governs it.
  const noRevenue = report.columnsFor(PBX, { performance: true, revenue: false, cost: true })
    .map((c) => c.key);
  eq(noRevenue.includes('total.btrcShare'), false, 'hidden with revenue off');
});

test("the export states BTRC's share of the filtered total", () => {
  const csv = report.serviceTrafficReportCsv(PBX, { generatedAt: AT });
  eq(rowStarting(csv, 'BTRC share (2%) (BDT)')[1], '4201.00', 'summary line');
  const rows = csvRows(csv);
  const header = rows[rows.findIndex((cells) => cells[0] === 'SL')];
  const at = header.indexOf('Total BTRC share (2%)');
  eq(at > 0, true, 'detail column present');
  eq(rows.find((cells) => cells[1] === 'Meghna Textiles Ltd')[at], '4200.00', "the first customer's share");
  // Stated once, in the summary block, rather than again under the detail.
  eq(rows.some((cells) => cells[1] === 'TOTAL'), false, 'no totals line under the detail');
});

test('ratios print as percentages, and ACD without one', () => {
  eq(report.ratioText(null), '—', 'null');
  eq(report.ratioText(0), '0.00%', 'a measured zero is still a measurement');
  eq(report.ratioText(27.1), '27.10%', 'percent');
  eq(report.ratioText(1.25, ''), '1.25', 'ACD has no suffix');
});

// ── prepaid / postpaid ────────────────────────────────────────────────────────────────────────
//
// The split is the one thing in this report that cannot be read straight off the summary
// tables: they carry no payment-model column, so the backend classifies each bucket from the
// charge-time flag on the event records and says MIXED where a bucket was charged both ways.
// What can go wrong on this side is quiet: a MIXED bucket reading as a missing partner name, an
// unrecognised model becoming a label, or the column appearing when nothing was grouped by it.

const PREPAID_BY_CUSTOMER = {
  ...PBX,
  groupBy: ['customer', 'paymentModel'],
  mixedPaymentModelRows: 1,
  rows: [
    row({
      customerId: 101, customerName: 'Meghna Textiles Ltd', paymentModel: 'PREPAID',
      outgoing: leg({ totalCalls: 100, successfulCalls: 40, actualUnits: 10, billedUnits: 12, revenue: 120 }),
      totalBilledUnits: 12, totalRevenue: 120, btrcShare: 2.4,
    }),
    row({
      customerId: 102, customerName: 'Northern Regional Office', paymentModel: 'POSTPAID',
      outgoing: leg({ totalCalls: 10, successfulCalls: 8, actualUnits: 4, billedUnits: 4, revenue: 40 }),
      totalBilledUnits: 4, totalRevenue: 40, btrcShare: 0.8,
    }),
    row({
      customerId: 401, customerName: 'Switched mid-month', paymentModel: 'MIXED',
      outgoing: leg({ totalCalls: 5, successfulCalls: 5, actualUnits: 2, billedUnits: 2, revenue: 20 }),
      totalBilledUnits: 2, totalRevenue: 20, btrcShare: 0.4,
    }),
  ],
};

test('a model the backend did not send is null, never a guess', () => {
  const normalised = client.normaliseServiceTrafficReport({
    rows: [{ paymentModel: 'PREPAID' }, { paymentModel: 'POSTPAID' }, { paymentModel: 'MIXED' },
           { paymentModel: 'prepaid' }, { paymentModel: 'SOMETHING' }, {}],
  });
  eq(normalised.rows.map((r) => r.paymentModel).join(','),
    'PREPAID,POSTPAID,MIXED,,,', 'only the three exact values survive');
});

test('whether a split was possible, and how much of it was unresolved, both survive', () => {
  const yes = client.normaliseServiceTrafficReport({
    paymentModelAvailable: true, mixedPaymentModelRows: 3, rows: [],
  });
  eq(yes.paymentModelAvailable, true, 'available');
  eq(yes.mixedPaymentModelRows, 3, 'the count of buckets it could not settle');
  eq(yes.paymentModelUnavailableReason, null, 'no reason when it worked');

  const no = client.normaliseServiceTrafficReport({
    paymentModelAvailable: false,
    paymentModelUnavailableReason: 'This service records no charge-time flag.',
    rows: [],
  });
  eq(no.paymentModelAvailable, false, 'unavailable');
  eq(no.paymentModelUnavailableReason, 'This service records no charge-time flag.', 'and why');
  // Absent must not read as available: that would offer a filter that cannot be honoured.
  eq(client.normaliseServiceTrafficReport({ rows: [] }).paymentModelAvailable, false, 'absent');
});

test('payment model is a column only when it was grouped by', () => {
  const withIt = report.columnsFor(PREPAID_BY_CUSTOMER).map((c) => c.key);
  eq(withIt.includes('paymentModel'), true, 'grouped by it');
  const withoutIt = report.columnsFor(PBX).map((c) => c.key);
  eq(withoutIt.includes('paymentModel'), false, 'not grouped by it');
});

test('each model is named, and MIXED reads as a result rather than a missing name', () => {
  const column = report.columnsFor(PREPAID_BY_CUSTOMER).find((c) => c.key === 'paymentModel');
  eq(column.label, 'Payment model', 'header');
  const [prepaid, postpaid, mixed] = PREPAID_BY_CUSTOMER.rows;
  eq(column.value(prepaid), 'Prepaid', 'prepaid');
  eq(column.value(postpaid), 'Postpaid', 'postpaid');
  // Not "Not attributable" and not "Unknown partner #..." -- it is neither of those things.
  eq(column.value(mixed), 'Mixed', 'charged both ways in the same bucket');
});

test('a row with no model at all is a dash, not an empty cell', () => {
  const column = report.columnsFor(PREPAID_BY_CUSTOMER).find((c) => c.key === 'paymentModel');
  eq(column.value(row({ customerId: 1, customerName: 'X' })), '—', 'never grouped, never set');
});

test('the export carries the payment model beside the customer', () => {
  const csv = report.serviceTrafficReportCsv(PREPAID_BY_CUSTOMER, { generatedAt: AT });
  const rows = csvRows(csv);
  const header = rows[rows.findIndex((cells) => cells[0] === 'SL')];
  const at = header.indexOf('Payment model');
  eq(at > 0, true, 'the column is in the file');
  eq(rows.find((cells) => cells[1] === 'Meghna Textiles Ltd')[at], 'Prepaid', 'prepaid row');
  eq(rows.find((cells) => cells[1] === 'Switched mid-month')[at], 'Mixed', 'mixed row');
});


// ── the direction dropdown: one half of the traffic, or both ──────────────────────────────────

const groupsOf = (columns) => [...new Set(columns.map((c) => c.group))];

test('both directions is the side-by-side table, unchanged', () => {
  const r = client.normaliseServiceTrafficReport(PBX);
  const columns = report.columnsFor(r, report.ALL_COLUMNS, 'both');
  eq(groupsOf(columns).join(','), 'row,outgoing,incoming,total', 'groups');
});

test('one direction drops the other half and the Total block with it', () => {
  const r = client.normaliseServiceTrafficReport(PBX);
  const out = report.columnsFor(r, report.ALL_COLUMNS, 'outgoing');
  eq(groupsOf(out).join(','), 'row,outgoing', 'outgoing only');
  const incoming = report.columnsFor(r, report.ALL_COLUMNS, 'incoming');
  eq(groupsOf(incoming).join(','), 'row,incoming', 'incoming only');
  // The Total block adds the two directions together; with one shown it would only repeat it.
  eq(out.some((c) => c.group === 'total'), false, 'no total block');
});

test('a single direction still reports the regulatory share, on its own revenue', () => {
  const r = client.normaliseServiceTrafficReport(PBX);
  const out = report.columnsFor(r, report.ALL_COLUMNS, 'outgoing');
  const share = out.find((c) => c.key === 'outgoing.btrcShare');
  if (!share) throw new Error('no BTRC share column on the outgoing view');
  eq(share.label, 'BTRC share (2%)', 'named with its rate');
  // 466,508.74 outgoing revenue at 2% -- not the 9,722.26 of both directions combined.
  eq(share.value(r.rows[0]), '4000.00', "the row's outgoing share");
});

test('the combined view keeps reporting the share of both directions', () => {
  const r = client.normaliseServiceTrafficReport(PBX);
  const both = report.columnsFor(r, report.ALL_COLUMNS, 'both');
  const share = both.find((c) => c.key === 'total.btrcShare');
  eq(share.value(r.rows[0]), '4200.00', 'the backend figure, untouched');
});

test('the export says which direction it was taken in, and carries only that half', () => {
  const r = client.normaliseServiceTrafficReport(PBX);
  const csv = report.serviceTrafficReportCsv(r, { generatedAt: AT }, report.ALL_COLUMNS, 'incoming');
  eq(rowStarting(csv, 'Direction')[1], 'Incoming', 'the direction is stated');
  const headers = report.detailHeaders(r, report.ALL_COLUMNS, 'incoming');
  eq(headers.some((h) => h.startsWith('Outgoing ')), false, 'no outgoing columns');
  eq(headers.some((h) => h.startsWith('Incoming ')), true, 'incoming columns');
});

// ── the overview: every service's totals, one row each ────────────────────────────────────────

const entry = (over) => ({ key: 'pbx', label: 'Hosted PBX', unit: 'minutes', report: null, error: null, ...over });

const OVERVIEW = [
  entry({ report: client.normaliseServiceTrafficReport(PBX) }),
  entry({
    key: 'sms', label: 'Bulk SMS', unit: 'SMS units',
    report: client.normaliseServiceTrafficReport(SMS),
  }),
];

test('the overview totals money across services but never their units', () => {
  const columns = report.overviewColumnsFor('outgoing', report.ALL_COLUMNS);
  const by = (key) => columns.find((c) => c.key === key);
  // Minutes and SMS units are different things; a sum of the two would be a number with no
  // meaning, so the column says so rather than printing one.
  eq(by('actualUnits').total(OVERVIEW), '-', 'actual units are not added up');
  eq(by('billedUnits').total(OVERVIEW), '-', 'billed units are not added up');
  eq(by('unit').value(OVERVIEW[0]), 'minutes', "each row carries its own unit");
  eq(by('unit').value(OVERVIEW[1]), 'SMS units', 'and the other its own');
  // Money is money.
  const revenue = Number(by('revenue').total(OVERVIEW));
  const expected = OVERVIEW.reduce((a, e) => a + e.report.totals.outgoing.revenue, 0);
  eq(revenue.toFixed(2), expected.toFixed(2), 'revenue does add up');
});

test('the overview follows the direction dropdown', () => {
  const out = report.overviewColumnsFor('outgoing', report.ALL_COLUMNS).find((c) => c.key === 'revenue');
  const inc = report.overviewColumnsFor('incoming', report.ALL_COLUMNS).find((c) => c.key === 'revenue');
  const both = report.overviewColumnsFor('both', report.ALL_COLUMNS).find((c) => c.key === 'revenue');
  const pbx = OVERVIEW[0];
  eq(out.value(pbx), pbx.report.totals.outgoing.revenue.toFixed(2), 'outgoing');
  eq(inc.value(pbx), pbx.report.totals.incoming.revenue.toFixed(2), 'incoming');
  eq(
    both.value(pbx),
    (pbx.report.totals.outgoing.revenue + pbx.report.totals.incoming.revenue).toFixed(2),
    'both added together'
  );
});

test('a service that could not be read keeps its row and is left out of the totals', () => {
  const broken = [OVERVIEW[0], entry({ key: 'sms', label: 'Bulk SMS', unit: 'SMS units', error: 'Host unreachable.' })];
  const columns = report.overviewColumnsFor('outgoing', report.ALL_COLUMNS);
  const by = (key) => columns.find((c) => c.key === key);
  eq(by('service').value(broken[1]), 'Bulk SMS', 'the row survives');
  eq(by('revenue').value(broken[1]), '-', 'with no figure invented for it');
  eq(
    by('revenue').total(broken),
    OVERVIEW[0].report.totals.outgoing.revenue.toFixed(2),
    'and the total is of what could be read'
  );
});

test('the overview export states the direction and why units are not totalled', () => {
  const csv = report.serviceOverviewCsv(
    OVERVIEW,
    { fromDate: '2026-10-01', toDate: '2026-10-31' },
    'outgoing',
    { generatedAt: AT }
  );
  eq(rowStarting(csv, 'Direction')[1], 'Outgoing', 'direction');
  const notes = csvRows(csv).filter((c) => c[0] === 'Note').map((c) => c[1]).join(' ');
  if (!notes.includes('not added up across services')) {
    throw new Error('the export does not say why the units are not totalled');
  }
  const header = csvRows(csv).find((c) => c[0] === 'Service');
  if (!header) throw new Error('no overview header row');
  const total = csvRows(csv).find((c) => c[0] === 'ALL SERVICES');
  if (!total) throw new Error('no overview total row');
});

test('an unreadable service is named in the export rather than dropped', () => {
  const broken = [OVERVIEW[0], entry({ key: 'sms', label: 'Bulk SMS', unit: 'SMS units', error: 'Host unreachable.' })];
  const csv = report.serviceOverviewCsv(
    broken, { fromDate: '2026-10-01', toDate: '2026-10-31' }, 'outgoing', { generatedAt: AT }
  );
  const notes = csvRows(csv).filter((c) => c[0] === 'Note').map((c) => c[1]).join(' ');
  if (!notes.includes('Bulk SMS could not be read')) throw new Error('the failure is not stated');
});

for (const [state, name] of results) console.log(`  ${state}  ${name}`);
console.log(`\n${results.length - failures}/${results.length} passed`);
process.exit(failures === 0 ? 0 : 1);
