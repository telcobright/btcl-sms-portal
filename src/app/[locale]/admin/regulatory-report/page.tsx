'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  downloadBtrcXlsx,
  downloadIptspXlsx,
  getRegulatoryReport,
  MONTH_NAMES,
  SAMPLE_REPORT,
  smsTotal,
  totalIcx,
  totalSubscribers,
  zoneHeadCount,
  type IcxRow,
  type OperatorSmsRow,
  type RegulatoryMonthlyReport,
  type SubscriberZoneRow,
} from '@/lib/api-client/regulatoryReport';

/**
 * ROLE_ADMIN-only IPTSP / BTRC monthly regulatory report.
 *
 * The admin picks a month; the backend returns every figure both monthly returns need, computed
 * straight from the CDR/summary databases. The page renders the operator's detailed IPTSP report
 * and the flat BTRC submission from that one object, and exports the BTRC row as CSV.
 *
 * Until the backend endpoint is deployed the fetch fails and the page shows SAMPLE_REPORT (real
 * January 2026 figures) behind a prominent "sample data" banner — never presented as live.
 */

// Minutes carry two decimals (billing minutes); counts are whole numbers.
const min = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v: number) => v.toLocaleString('en-US');

const now = new Date();
// Default to the most recently completed month.
const DEFAULT_YEAR = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
const DEFAULT_MONTH = now.getMonth() === 0 ? 12 : now.getMonth(); // 1–12, previous month
const YEARS = Array.from({ length: DEFAULT_YEAR - 2021 + 1 }, (_, i) => 2021 + i).reverse();

export default function RegulatoryReportPage() {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [year, setYear] = useState(DEFAULT_YEAR);

  const [report, setReport] = useState<RegulatoryMonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRegulatoryReport(authToken, { month, year });
      setReport(data);
    } catch {
      // Endpoint not deployed yet (or unreachable): fall back to labelled sample so the
      // layout stays reviewable. The banner below makes clear it is not live data.
      setReport({ ...SAMPLE_REPORT, reportingMonth: MONTH_NAMES[month - 1], reportingYear: year });
      setError('The report backend is not available yet — showing sample figures.');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const [downloading, setDownloading] = useState(false);
  const [reportType, setReportType] = useState<'btrc' | 'iptsp'>('btrc');

  const handleDownload = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      if (reportType === 'iptsp') {
        await downloadIptspXlsx(report);
      } else {
        await downloadBtrcXlsx(report);
      }
    } catch {
      setError('Could not build the Excel file (template missing?).');
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Building the monthly report…
      </div>
    );
  }

  if (!report) return null;

  const activeTotal = totalSubscribers(report.activeSubscribers);
  const provTotal = totalSubscribers(report.provisionedSubscribers);
  const icxTotal = totalIcx(report.icxRows);
  const ii = report.iptspIptsp;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3C71] flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#0D529E]" />
            IPTSP / BTRC Monthly Report
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Regulatory return for {report.reportingMonth}, {report.reportingYear} — computed from
            call and subscriber data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#0D529E] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as 'btrc' | 'iptsp')}
            aria-label="Report to download"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30 focus:border-[#0D529E]"
          >
            <option value="btrc">BTRC Submission</option>
            <option value="iptsp">IPTSP Detailed Report</option>
          </select>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D529E] text-white text-sm font-medium rounded-lg hover:bg-[#1F3C71] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Building…' : `Download ${reportType === 'iptsp' ? 'IPTSP' : 'BTRC'} Excel`}
          </button>
        </div>
      </div>

      {/* ---------------- Month picker ---------------- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30 focus:border-[#0D529E]"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30 focus:border-[#0D529E]"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 ml-auto">
            <CalendarDays className="w-4 h-4" />
            Reporting period: {report.reportingMonth} {report.reportingYear}
          </div>
        </div>
      </div>

      {report.isSample && (
        <div className="mb-5 flex items-start gap-2 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Sample data — not a live figure.</p>
            <p className="mt-0.5">
              {error ?? 'The report backend endpoint is not deployed yet.'} The numbers below are a
              fixed January 2026 sample so the layout can be reviewed. Do not submit them.
            </p>
          </div>
        </div>
      )}

      {/* ---------------- Operator info ---------------- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0D529E]/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[#0D529E]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm">
            <InfoLine label="Operator" value={report.operatorName} />
            <InfoLine label="License type" value={report.licenseType} />
            <InfoLine label="Operation start" value={report.operationStartDate} />
          </div>
        </div>
      </div>

      {/* ---------------- 1A. Active subscribers ---------------- */}
      <Section title="1.A  Active Subscribers (RGB — Revenue Generating Base)">
        <SubscriberTable rows={report.activeSubscribers} total={activeTotal} />
      </Section>

      {/* ---------------- 1B. Provisioned subscribers ---------------- */}
      <Section title="1.B  Provisioned Subscribers (in the system)">
        <SubscriberTable rows={report.provisionedSubscribers} total={provTotal} />
      </Section>

      {/* ---------------- 2A. IPTSP–IPTSP minutes ---------------- */}
      <Section title="2.A  IPTSP–IPTSP Call-Minutes (Billing Minutes)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <Th>Topic</Th>
                <Th align="right">Outgoing — On-net</Th>
                <Th align="right">Outgoing — Other IPTSP</Th>
                <Th align="right">Incoming — On-net</Th>
                <Th align="right">Incoming — Other IPTSP</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <Td className="font-medium text-gray-900">Sum of Call Minutes</Td>
                <Td align="right">{min(ii.outOnnetMinutes)}</Td>
                <Td align="right">{min(ii.outOtherMinutes)}</Td>
                <Td align="right">{min(ii.inOnnetMinutes)}</Td>
                <Td align="right">{min(ii.inOtherMinutes)}</Td>
              </tr>
              <tr>
                <Td className="font-medium text-gray-900">Sum of No. of Calls</Td>
                <Td align="right" className="text-gray-500">{num(ii.outOnnetCalls)}</Td>
                <Td align="right" className="text-gray-500">{num(ii.outOtherCalls)}</Td>
                <Td align="right" className="text-gray-500">{num(ii.inOnnetCalls)}</Td>
                <Td align="right" className="text-gray-500">{num(ii.inOtherCalls)}</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* ---------------- 2B. ICX–IPTSP minutes ---------------- */}
      <Section title="2.B  ICX–IPTSP Call-Minutes (Billing Minutes)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <Th>Name of ICX</Th>
                <Th align="right">E1</Th>
                <Th align="right">Out — Off-net</Th>
                <Th align="right">Out — International</Th>
                <Th align="right">In — Off-net</Th>
                <Th align="right">In — International</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.icxRows.map((icx) => (
                <IcxRows key={icx.icxName} icx={icx} />
              ))}
              <tr className="bg-gray-50 font-semibold">
                <Td className="text-[#1F3C71]">Total — Call Minutes</Td>
                <Td align="right" className="text-gray-400">—</Td>
                <Td align="right" className="text-[#0D529E]">{min(icxTotal.outOffnetMinutes)}</Td>
                <Td align="right" className="text-[#0D529E]">{min(icxTotal.outIntlMinutes)}</Td>
                <Td align="right" className="text-[#0D529E]">{min(icxTotal.inOffnetMinutes)}</Td>
                <Td align="right" className="text-[#0D529E]">{min(icxTotal.inIntlMinutes)}</Td>
              </tr>
              <tr className="bg-gray-50 text-gray-500">
                <Td className="font-medium">Total — No. of Calls</Td>
                <Td align="right">—</Td>
                <Td align="right">{num(icxTotal.outOffnetCalls)}</Td>
                <Td align="right">{num(icxTotal.outIntlCalls)}</Td>
                <Td align="right">{num(icxTotal.inOffnetCalls)}</Td>
                <Td align="right">{num(icxTotal.inIntlCalls)}</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* ---------------- 3. Capacity ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Section title="3.A  ICX Connectivity & Capacity" noMargin>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>S/N</Th>
                  <Th>Name of ICX</Th>
                  <Th align="right">No. of E1</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.icxConnectivity.map((c, i) => (
                  <tr key={c.icxName}>
                    <Td className="text-gray-400">{i + 1}</Td>
                    <Td className="font-medium text-gray-900">{c.icxName}</Td>
                    <Td align="right">{num(c.e1)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="3.B  PoP & Media Gateway" noMargin>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>S/N</Th>
                  <Th>PoP Address</Th>
                  <Th align="right">Media Gateways</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.pops.map((p, i) => (
                  <tr key={p.address}>
                    <Td className="text-gray-400">{i + 1}</Td>
                    <Td className="font-medium text-gray-900">{p.address}</Td>
                    <Td align="right">{num(p.mediaGateways)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {/* ---------------- BTRC flat submission ---------------- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#0D529E]/5">
          <h2 className="text-base font-semibold text-[#1F3C71]">BTRC Submission Summary</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            The same month re-bucketed into the regulator&apos;s categories — this is what the
            &quot;Download BTRC CSV&quot; button exports.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Subscribers + call volume */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <StatTile label="Subscribers" value={num(report.btrc.subscribers)} />
            <StatTile label="Total Call Volume (min)" value={min(report.btrc.callVolume.total)} accent />
            <StatTile
              label="A2P SMS (total)"
              value={num(smsTotal(report.btrc.a2pSms).incoming + smsTotal(report.btrc.a2pSms).outgoing)}
            />
            <StatTile
              label="P2P SMS (total)"
              value={num(smsTotal(report.btrc.p2pSms).incoming + smsTotal(report.btrc.p2pSms).outgoing)}
            />
          </div>

          {/* Call volume breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>Call Volume Category</Th>
                  <Th align="right">Incoming</Th>
                  <Th align="right">Outgoing</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <CallVolumeRow label="Domestic (Mobile Dialer)" inc={report.btrc.callVolume.domMobileIn} out={report.btrc.callVolume.domMobileOut} />
                <CallVolumeRow label="Domestic (Others)" inc={report.btrc.callVolume.domOthersIn} out={report.btrc.callVolume.domOthersOut} />
                <CallVolumeRow label="Domestic (Toll Free / LTFS)" inc={report.btrc.callVolume.tollFreeIn} out={report.btrc.callVolume.tollFreeOut} />
                <CallVolumeRow label="International" inc={report.btrc.callVolume.intlIn} out={report.btrc.callVolume.intlOut} />
                <tr className="bg-gray-50 font-semibold">
                  <Td className="text-[#1F3C71]">Total</Td>
                  <Td align="right" colSpan={2} className="text-[#0D529E]">
                    {min(report.btrc.callVolume.total)}
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SMS per operator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SmsTable title="A2P SMS (per operator)" rows={report.btrc.a2pSms} />
            <SmsTable title="P2P SMS (per operator)" rows={report.btrc.p2pSms} />
          </div>
        </div>
      </div>

      {report.generatedAt && (
        <p className="text-xs text-gray-400 text-right">
          Generated {new Date(report.generatedAt).toLocaleString('en-GB')}
        </p>
      )}
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function SubscriberTable({ rows, total }: { rows: SubscriberZoneRow[]; total: SubscriberZoneRow }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <Th rowSpan={2}>S/N</Th>
            <Th rowSpan={2}>Zone</Th>
            <Th align="center" colSpan={3}>Prepaid</Th>
            <Th align="center" colSpan={3}>Postpaid</Th>
            <Th align="right" rowSpan={2}>Total</Th>
          </tr>
          <tr>
            <Th align="right">Individual</Th>
            <Th align="right">Corp (No.)</Th>
            <Th align="right">Corp (Ch.)</Th>
            <Th align="right">Individual</Th>
            <Th align="right">Corp (No.)</Th>
            <Th align="right">Corp (Ch.)</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={row.zone} className="hover:bg-gray-50">
              <Td className="text-gray-400">{i + 1}</Td>
              <Td className="font-medium text-gray-900">{row.zone}</Td>
              <Td align="right">{num(row.prepaidIndividual)}</Td>
              <Td align="right">{num(row.prepaidCorporateNumbers)}</Td>
              <Td align="right">{num(row.prepaidCorporateChannels)}</Td>
              <Td align="right">{num(row.postpaidIndividual)}</Td>
              <Td align="right">{num(row.postpaidCorporateNumbers)}</Td>
              <Td align="right">{num(row.postpaidCorporateChannels)}</Td>
              <Td align="right" className="font-medium text-gray-700">{num(zoneHeadCount(row))}</Td>
            </tr>
          ))}
          <tr className="bg-gray-50 font-semibold">
            <Td />
            <Td className="text-[#1F3C71]">Total</Td>
            <Td align="right">{num(total.prepaidIndividual)}</Td>
            <Td align="right">{num(total.prepaidCorporateNumbers)}</Td>
            <Td align="right">{num(total.prepaidCorporateChannels)}</Td>
            <Td align="right">{num(total.postpaidIndividual)}</Td>
            <Td align="right">{num(total.postpaidCorporateNumbers)}</Td>
            <Td align="right">{num(total.postpaidCorporateChannels)}</Td>
            <Td align="right" className="text-[#0D529E]">{num(zoneHeadCount(total))}</Td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function IcxRows({ icx }: { icx: IcxRow }) {
  return (
    <>
      <tr className="hover:bg-gray-50">
        <Td className="font-medium text-gray-900" rowSpan={2}>{icx.icxName}</Td>
        <Td align="right" rowSpan={2}>{num(icx.e1Count)}</Td>
        <Td align="right">{min(icx.outOffnetMinutes)}</Td>
        <Td align="right">{min(icx.outIntlMinutes)}</Td>
        <Td align="right">{min(icx.inOffnetMinutes)}</Td>
        <Td align="right">{min(icx.inIntlMinutes)}</Td>
      </tr>
      <tr className="hover:bg-gray-50 text-gray-500">
        <Td align="right" className="text-xs">{num(icx.outOffnetCalls)} calls</Td>
        <Td align="right" className="text-xs">{num(icx.outIntlCalls)} calls</Td>
        <Td align="right" className="text-xs">{num(icx.inOffnetCalls)} calls</Td>
        <Td align="right" className="text-xs">{num(icx.inIntlCalls)} calls</Td>
      </tr>
    </>
  );
}

function CallVolumeRow({ label, inc, out }: { label: string; inc: number; out: number }) {
  return (
    <tr className="hover:bg-gray-50">
      <Td className="font-medium text-gray-900">{label}</Td>
      <Td align="right">{min(inc)}</Td>
      <Td align="right">{min(out)}</Td>
    </tr>
  );
}

function SmsTable({ title, rows }: { title: string; rows: OperatorSmsRow[] }) {
  const total = smsTotal(rows);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <h3 className="text-sm font-semibold text-[#1F3C71] px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="text-gray-500">
            <tr>
              <Th>Operator</Th>
              <Th align="right">Incoming</Th>
              <Th align="right">Outgoing</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.operator} className="hover:bg-gray-50">
                <Td className="font-medium text-gray-900">{r.operator}</Td>
                <Td align="right">{num(r.incoming)}</Td>
                <Td align="right">{num(r.outgoing)}</Td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold">
              <Td className="text-[#1F3C71]">Total</Td>
              <Td align="right" className="text-[#0D529E]">{num(total.incoming)}</Td>
              <Td align="right" className="text-[#0D529E]">{num(total.outgoing)}</Td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  noMargin,
}: {
  title: string;
  children: React.ReactNode;
  noMargin?: boolean;
}) {
  return (
    <section className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${noMargin ? '' : 'mb-6'}`}>
      <h2 className="text-base font-semibold text-[#1F3C71] px-6 py-4 border-b border-gray-100">
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1.5 break-words ${accent ? 'text-[#0D529E]' : 'text-[#1F3C71]'}`}>
        {value}
      </p>
    </div>
  );
}

function Th({
  children,
  align = 'left',
  colSpan,
  rowSpan,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  colSpan?: number;
  rowSpan?: number;
}) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th colSpan={colSpan} rowSpan={rowSpan} className={`font-semibold px-4 py-2.5 whitespace-nowrap border border-gray-100 ${alignClass}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
  align = 'left',
  colSpan,
  rowSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={`px-4 py-2.5 whitespace-nowrap border border-gray-100 ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}
    >
      {children}
    </td>
  );
}
