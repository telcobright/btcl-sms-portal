/**
 * Tests for Section C of the IPTSP Excel export (bi-lateral SMS connectivity).
 *
 * Section C feeds a regulatory return, so the behaviour worth pinning is as much about what the
 * export must NOT write as what it must: an unknown E1 or an unestablished international figure
 * has to leave an empty cell, never a zero that reads as a measurement. These run the real
 * downloadIptspXlsx and downloadBtrcXlsx from src/lib/api-client/regulatoryReport.ts against the
 * real templates in public/templates, then read the produced workbooks back.
 *
 * The repo has no test runner, so this is a plain node script:  npm run test:section-c
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ts = require(path.join(ROOT, 'node_modules/typescript'));
const ExcelJS = require(path.join(ROOT, 'node_modules/exceljs'));

// ── load the export module with browser bits stubbed ──────────────────────────────────────────
let captured = null;
const loadModule = () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/api-client/regulatoryReport.ts'), 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;

  class CapturingBlob {
    constructor(parts) {
      captured = Buffer.concat(parts.map((p) => Buffer.from(p)));
    }
  }
  global.Blob = CapturingBlob;
  global.fetch = async (url) => {
    const buf = fs.readFileSync(path.join(ROOT, 'public', String(url).replace(/^\//, '')));
    return { ok: true, status: 200, arrayBuffer: async () => buf };
  };
  global.URL.createObjectURL = () => 'blob:test';
  global.URL.revokeObjectURL = () => {};
  global.document = {
    createElement: () => ({ click() {}, set href(_v) {}, set download(_v) {} }),
    body: { appendChild() {}, removeChild() {} },
  };

  const stubs = {
    axios: { default: {} },
    '@/config/api': { API_BASE_URL: 'https://example.invalid', API_ENDPOINTS: {} },
    exceljs: Object.assign({}, ExcelJS, { default: ExcelJS }),
  };
  const mod = { exports: {} };
  new Function('require', 'exports', 'module', js)((id) => stubs[id] ?? require(id), mod.exports, mod);
  return mod.exports;
};

const api = loadModule();

// ── fixtures ──────────────────────────────────────────────────────────────────────────────────
const zone = (name) => ({
  zone: name,
  prepaidIndividual: 0, prepaidCorporateNumbers: 0, prepaidCorporateChannels: 0,
  postpaidIndividual: 0, postpaidCorporateNumbers: 0, postpaidCorporateChannels: 0,
});

/** September 2026, as verified against btcl_sms.sum_voice_day_02 / _01. */
const SEPTEMBER_SECTION_C = [
  { ansPstnName: 'Robi Axiata PLC.', e1: null, intlSmsIn: null, intlSmsOut: null, domSmsIn: 574432, domSmsOut: 117086 },
  { ansPstnName: 'GrameenPhone Ltd', e1: null, intlSmsIn: null, intlSmsOut: null, domSmsIn: 40900, domSmsOut: 129433 },
  { ansPstnName: 'Banglalink Digital Communications Ltd.', e1: null, intlSmsIn: null, intlSmsOut: null, domSmsIn: 7436, domSmsOut: 37157 },
  { ansPstnName: 'Teletalk Bangladesh Limited', e1: null, intlSmsIn: null, intlSmsOut: null, domSmsIn: 4309, domSmsOut: 6885 },
];

const report = (bilateralSms) => ({
  operatorName: 'Bangladesh Telecommunications Company Limited',
  licenseType: 'Nationwide',
  operationStartDate: '26/03/2021',
  reportingMonth: 'September',
  reportingYear: 2026,
  activeSubscribers: [zone('Central')],
  provisionedSubscribers: [zone('Central')],
  iptspIptsp: {
    outOnnetMinutes: 1, outOnnetCalls: 1, outOtherMinutes: 1, outOtherCalls: 1,
    inOnnetMinutes: 1, inOnnetCalls: 1, inOtherMinutes: 1, inOtherCalls: 1,
  },
  icxRows: [{
    icxName: 'BTCL ICX (combined)', e1Count: 0,
    outOffnetMinutes: 0, outOffnetCalls: 0, outIntlMinutes: 0, outIntlCalls: 0,
    inOffnetMinutes: 0, inOffnetCalls: 0, inIntlMinutes: 0, inIntlCalls: 0,
  }],
  icxConnectivity: [{ icxName: 'BTCL ICX Mohakhali', e1: 62 }],
  pops: [{ address: 'BTCL Moghbazar', mediaGateways: 1 }],
  bilateralSms,
  btrc: {
    subscribers: 69,
    subscriberAppBased: 0,
    subscriberNonAppIndividual: 1,
    subscriberNonAppCorporate: 68,
    callVolume: {
      domMobileIn: 0, domMobileOut: 0, domOthersIn: 55934.23, domOthersOut: 663861.4,
      tollFreeIn: 0, tollFreeOut: 0, intlIn: 0, intlOut: 0, total: 719795.63,
    },
    a2pSms: [
      { operator: 'Grameenphone', incoming: 6, outgoing: 589 },
      { operator: 'Robi', incoming: 0, outgoing: 126 },
      { operator: 'Banglalink', incoming: 1, outgoing: 46 },
      { operator: 'Teletalk', incoming: 4, outgoing: 17 },
    ],
    p2pSms: [
      { operator: 'Grameenphone', incoming: 36344, outgoing: 101300 },
      { operator: 'Robi', incoming: 351420, outgoing: 98515 },
      { operator: 'Banglalink', incoming: 6478, outgoing: 27659 },
      { operator: 'Teletalk', incoming: 3965, outgoing: 5664 },
    ],
  },
});

// ── helpers ───────────────────────────────────────────────────────────────────────────────────
const sheetAfter = async (download, arg) => {
  captured = null;
  await download(arg);
  if (!captured) throw new Error('no workbook was produced');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(captured);
  return wb;
};

const raw = (ws, cell) => {
  const v = ws.getCell(cell).value;
  return v && typeof v === 'object' && 'result' in v ? v.result : v;
};

let failures = 0;
const results = [];
const test = async (name, fn) => {
  try {
    await fn();
    results.push(['PASS', name]);
  } catch (e) {
    failures++;
    results.push(['FAIL', `${name}\n        ${e.message}`]);
  }
};
const eq = (actual, expected, what) => {
  if (actual !== expected) throw new Error(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};
const blank = (ws, cell, what) => {
  const v = ws.getCell(cell).value;
  if (v !== null && v !== undefined && v !== '') {
    throw new Error(`${what}: expected ${cell} to be empty, got ${JSON.stringify(v)}`);
  }
};

(async () => {
  // ── aggregation / partner mapping / cell placement ──────────────────────────────────────────
  await test('each counterparty lands on its own row, name in column B', async () => {
    const ws = (await sheetAfter(api.downloadIptspXlsx, report(SEPTEMBER_SECTION_C))).worksheets[0];
    eq(raw(ws, 'B61'), 'Robi Axiata PLC.', 'B61');
    eq(raw(ws, 'B62'), 'GrameenPhone Ltd', 'B62');
    eq(raw(ws, 'B63'), 'Banglalink Digital Communications Ltd.', 'B63');
    eq(raw(ws, 'B64'), 'Teletalk Bangladesh Limited', 'B64');
  });

  await test('domestic SMS units land in F (incoming) and G (outgoing)', async () => {
    const ws = (await sheetAfter(api.downloadIptspXlsx, report(SEPTEMBER_SECTION_C))).worksheets[0];
    eq(raw(ws, 'F61'), 574432, 'Robi incoming');
    eq(raw(ws, 'G61'), 117086, 'Robi outgoing');
    eq(raw(ws, 'F62'), 40900, 'Grameenphone incoming');
    eq(raw(ws, 'G62'), 129433, 'Grameenphone outgoing');
    eq(raw(ws, 'F63'), 7436, 'Banglalink incoming');
    eq(raw(ws, 'G63'), 37157, 'Banglalink outgoing');
    eq(raw(ws, 'F64'), 4309, 'Teletalk incoming');
    eq(raw(ws, 'G64'), 6885, 'Teletalk outgoing');
  });

  await test('the September totals are the verified 627,077 in and 290,561 out', async () => {
    const ws = (await sheetAfter(api.downloadIptspXlsx, report(SEPTEMBER_SECTION_C))).worksheets[0];
    let incoming = 0;
    let outgoing = 0;
    for (let row = 61; row <= 65; row++) {
      incoming += Number(raw(ws, `F${row}`) ?? 0);
      outgoing += Number(raw(ws, `G${row}`) ?? 0);
    }
    eq(incoming, 627077, 'incoming total');
    eq(outgoing, 290561, 'outgoing total');
  });

  await test('Section C writes under its own headers, and the headers survive', async () => {
    const ws = (await sheetAfter(api.downloadIptspXlsx, report(SEPTEMBER_SECTION_C))).worksheets[0];
    eq(raw(ws, 'A58'), 'C. Bi-Lateral Connectivity of SMS Service', 'section heading');
    eq(raw(ws, 'B59'), 'Name Of ANS/PSTN', 'B59 header');
    eq(raw(ws, 'C59'), 'No. of E1', 'C59 header');
    eq(raw(ws, 'D59'), 'No of International SMS', 'D59 header');
    eq(raw(ws, 'F59'), 'No Of Domestic SMS', 'F59 header');
    eq(raw(ws, 'D60'), 'Incoming SMS', 'D60 header');
    eq(raw(ws, 'E60'), 'Outgoing SMS', 'E60 header');
    eq(raw(ws, 'F60'), 'Incoming SMS', 'F60 header');
    eq(raw(ws, 'G60'), 'Outgoing SMS', 'G60 header');
    eq(raw(ws, 'A61'), 1, 'serial number column untouched');
  });

  // ── the two things that must never be fabricated ────────────────────────────────────────────
  await test('E1 cells stay empty — never a zero', async () => {
    const ws = (await sheetAfter(api.downloadIptspXlsx, report(SEPTEMBER_SECTION_C))).worksheets[0];
    for (let row = 61; row <= 64; row++) blank(ws, `C${row}`, 'E1');
  });

  await test('an unestablished international figure stays empty — never a zero', async () => {
    const ws = (await sheetAfter(api.downloadIptspXlsx, report(SEPTEMBER_SECTION_C))).worksheets[0];
    for (let row = 61; row <= 64; row++) {
      blank(ws, `D${row}`, 'international incoming');
      blank(ws, `E${row}`, 'international outgoing');
    }
  });

  await test('a measured international figure is written', async () => {
    const rows = [{ ansPstnName: 'Robi Axiata PLC.', e1: 4, intlSmsIn: 120, intlSmsOut: 7, domSmsIn: 574432, domSmsOut: 117086 }];
    const ws = (await sheetAfter(api.downloadIptspXlsx, report(rows))).worksheets[0];
    eq(raw(ws, 'C61'), 4, 'E1 when known');
    eq(raw(ws, 'D61'), 120, 'international incoming');
    eq(raw(ws, 'E61'), 7, 'international outgoing');
  });

  await test('zero is written when it really is a measured zero', async () => {
    const rows = [{ ansPstnName: 'Robi Axiata PLC.', e1: 0, intlSmsIn: 0, intlSmsOut: 0, domSmsIn: 1, domSmsOut: 2 }];
    const ws = (await sheetAfter(api.downloadIptspXlsx, report(rows))).worksheets[0];
    eq(raw(ws, 'C61'), 0, 'E1 zero');
    eq(raw(ws, 'D61'), 0, 'international incoming zero');
    eq(raw(ws, 'E61'), 0, 'international outgoing zero');
  });

  // ── edges ───────────────────────────────────────────────────────────────────────────────────
  await test('no counterparties leaves the whole section blank', async () => {
    const ws = (await sheetAfter(api.downloadIptspXlsx, report([]))).worksheets[0];
    for (let row = 61; row <= 65; row++) {
      for (const col of ['B', 'C', 'D', 'E', 'F', 'G']) blank(ws, `${col}${row}`, 'empty section');
    }
  });

  await test('a backend that does not send bilateralSms at all still exports', async () => {
    const r = report([]);
    delete r.bilateralSms;
    const ws = (await sheetAfter(api.downloadIptspXlsx, r)).worksheets[0];
    blank(ws, 'B61', 'missing bilateralSms');
    eq(raw(ws, 'A3'), 'Name of the IPTSP Operator: Bangladesh Telecommunications Company Limited', 'rest of report');
  });

  await test('more counterparties than the form has rows writes only five, and not past row 65', async () => {
    const six = ['one', 'two', 'three', 'four', 'five', 'six'].map((n, i) => ({
      ansPstnName: n, e1: null, intlSmsIn: null, intlSmsOut: null, domSmsIn: 10 - i, domSmsOut: 0,
    }));
    const ws = (await sheetAfter(api.downloadIptspXlsx, report(six))).worksheets[0];
    eq(raw(ws, 'B65'), 'five', 'fifth row');
    blank(ws, 'B66', 'row past the end of the section');
  });

  // ── the rest of the report must not move ────────────────────────────────────────────────────
  await test('other IPTSP sections are unchanged', async () => {
    const wb = await sheetAfter(api.downloadIptspXlsx, report(SEPTEMBER_SECTION_C));
    const ws = wb.worksheets[0];
    eq(raw(ws, 'A6'), 'Reporting Month:September', 'header month');
    eq(raw(ws, 'C34'), 1, '2.A minutes');
    eq(raw(ws, 'B51'), 'BTCL ICX Mohakhali', '3.A ICX name');
    eq(raw(ws, 'C51'), 62, '3.A ICX E1');
    eq(raw(ws, 'F51'), 'BTCL Moghbazar', '3.B PoP');
    eq(raw(wb.getWorksheet('this-month-summary'), 'A5'), 'September,2026', 'summary sheet period');
    eq(raw(wb.getWorksheet('user'), 'A2'), '2026-09-30', 'user sheet reporting date');
  });

  await test('the BTRC submission export is untouched', async () => {
    const ws = (await sheetAfter(api.downloadBtrcXlsx, report(SEPTEMBER_SECTION_C))).worksheets[0];
    eq(raw(ws, 'O4'), 6, 'A2P Grameenphone in');
    eq(raw(ws, 'P4'), 589, 'A2P Grameenphone out');
    eq(raw(ws, 'Z4'), 351420, 'P2P Robi in');
    eq(raw(ws, 'AA4'), 98515, 'P2P Robi out');
    eq(raw(ws, 'W4'), 789, 'A2P total');
    eq(raw(ws, 'AF4'), 631345, 'P2P total');
  });

  for (const [state, name] of results) console.log(`  ${state}  ${name}`);
  console.log(`\n${results.length - failures}/${results.length} passed`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
