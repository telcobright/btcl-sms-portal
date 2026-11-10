'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileSearch,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  getNidVerificationLog,
  nidCredentialErrorMessage,
  type NidVerificationAttempt,
  type NidVerificationLog,
} from '@/lib/api-client/nidCredential';

/**
 * Every NID verification attempt: the number, what the Election Commission returned, and what
 * the applicant was told. Written by the NIDVerification service; the NID and the EC's reply
 * are stored encrypted and decrypted by TelcoREST for admins only.
 *
 * The outcome filter's counts follow the search and dates, so they answer "how many failed
 * today, and why" at a glance.
 */

type Outcome = { key: string; label: string; tone: string };

// Order of the filter buttons, and the badge each outcome gets.
const OUTCOMES: Outcome[] = [
  { key: 'VERIFIED', label: 'Verified', tone: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'NID_NOT_FOUND', label: 'NID not found', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  { key: 'DETAILS_MISMATCH', label: 'Not verified', tone: 'bg-red-50 text-red-700 border-red-200' },
  { key: 'INVALID_REQUEST', label: 'Rejected by EC', tone: 'bg-red-50 text-red-700 border-red-200' },
  { key: 'SERVICE_UNAVAILABLE', label: 'EC unavailable', tone: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'MALFORMED_REQUEST', label: 'Bad request', tone: 'bg-gray-100 text-gray-700 border-gray-200' },
  { key: 'UNCLASSIFIED', label: 'Error', tone: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const outcomeOf = (row: NidVerificationAttempt): Outcome => {
  const key = row.verified ? 'VERIFIED' : row.reason || 'UNCLASSIFIED';
  return (
    OUTCOMES.find((o) => o.key === key) ?? {
      key,
      label: key,
      tone: 'bg-gray-100 text-gray-700 border-gray-200',
    }
  );
};

const PAGE_SIZE = 50;

const formatBst = (value: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const prettyJson = (raw: string | null) => {
  if (!raw) return null;
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
};

/** One line saying what the EC answered — or why it never did. */
const ecSummary = (row: NidVerificationAttempt): { main: string; sub: string | null } => {
  if (row.ecHttpStatus != null) {
    const parts = [`HTTP ${row.ecHttpStatus}`];
    if (row.ecStatus) parts.push(row.ecStatus);
    if (row.ecStatusCode && row.ecStatusCode !== row.ecStatus) parts.push(row.ecStatusCode);
    if (row.ecVerified != null) parts.push(`verified=${row.ecVerified}`);
    const sub = row.ecError
      ? row.ecErrorField
        ? `${row.ecError} (field: ${row.ecErrorField})`
        : row.ecError
      : null;
    return { main: parts.join(' · '), sub };
  }
  if (row.stage === 'request') return { main: 'Not sent to the EC', sub: row.detail };
  if (row.stage === 'auth') return { main: 'Our EC login failed', sub: row.error };
  return { main: 'No answer from the EC', sub: row.error };
};

const today = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); // yyyy-MM-dd

export default function VerificationLog() {
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [result, setResult] = useState('');
  const [page, setPage] = useState(0);
  // What the table currently shows; the inputs above only apply on Search.
  const [applied, setApplied] = useState({ q: '', from: '', to: '' });

  const [data, setData] = useState<NidVerificationLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    setLoading(true);
    try {
      const next = await getNidVerificationLog(
        {
          q: applied.q || undefined,
          from: applied.from || undefined,
          to: applied.to || undefined,
          result: result || undefined,
          page,
          size: PAGE_SIZE,
        },
        authToken
      );
      setData(next);
      setError(null);
    } catch (err) {
      setError(nidCredentialErrorMessage(err, 'Could not load the verification log.'));
    } finally {
      setLoading(false);
    }
  }, [applied, result, page]);

  useEffect(() => {
    load();
  }, [load]);

  const applySearch = () => {
    setOpen(null);
    setPage(0);
    setApplied({ q: search.trim(), from, to });
  };

  const chooseResult = (key: string) => {
    setOpen(null);
    setPage(0);
    setResult(key);
  };

  const counts = data?.counts ?? {};
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const total = data?.total ?? 0;
  const firstShown = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const lastShown = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <section
      id="verification-log"
      className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1F3C71] flex items-center gap-2">
            <FileSearch className="w-4 h-4" />
            Verification log
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Every NID check: the number, what the Election Commission returned, and what the
            applicant was told. Times are Bangladesh time.
          </p>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-[#0D529E] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <form
        className="px-6 py-4 flex flex-wrap items-end gap-3 border-b border-gray-100"
        onSubmit={(e) => {
          e.preventDefault();
          applySearch();
        }}
      >
        <label className="flex-1 min-w-[220px]">
          <span className="block text-xs font-medium text-gray-600 mb-1">NID, EC request ID or IP</span>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. 1990123456789012"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30 focus:border-[#0D529E]"
            />
          </div>
        </label>
        <label>
          <span className="block text-xs font-medium text-gray-600 mb-1">From</span>
          <input
            type="date"
            value={from}
            max={to || today()}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30 focus:border-[#0D529E]"
          />
        </label>
        <label>
          <span className="block text-xs font-medium text-gray-600 mb-1">To</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            max={today()}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30 focus:border-[#0D529E]"
          />
        </label>
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-[#0D529E] text-white text-sm font-medium rounded-lg hover:bg-[#1F3C71] transition-colors"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
        {(applied.q || applied.from || applied.to) && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setFrom('');
              setTo('');
              setOpen(null);
              setPage(0);
              setApplied({ q: '', from: '', to: '' });
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-[#0D529E]"
          >
            Clear
          </button>
        )}
      </form>

      {/* Outcome filter, with counts for the current search and dates */}
      <div className="px-6 py-3 flex flex-wrap gap-2 border-b border-gray-100">
        <FilterChip active={result === ''} onClick={() => chooseResult('')} label="All" count={allCount} />
        <FilterChip
          active={result === 'FAILED'}
          onClick={() => chooseResult('FAILED')}
          label="All failures"
          count={allCount - (counts.VERIFIED ?? 0)}
        />
        {OUTCOMES.filter((o) => o.key === result || (counts[o.key] ?? 0) > 0).map((o) => (
          <FilterChip
            key={o.key}
            active={result === o.key}
            onClick={() => chooseResult(o.key)}
            label={o.label}
            count={counts[o.key] ?? 0}
          />
        ))}
      </div>

      {error && (
        <div className="mx-6 my-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {data && !data.decryptable && (
        <div className="mx-6 my-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            The backend has no NID encryption key, so only the last four digits of each NID are
            shown and the EC&apos;s full reply is hidden.
          </span>
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading the verification log…
        </div>
      ) : data && !data.available ? (
        <p className="px-6 py-10 text-sm text-gray-500 text-center">
          Nothing recorded yet. The NID verification service starts recording each attempt once it
          is updated to the version with this log.
        </p>
      ) : data && data.rows.length === 0 ? (
        <p className="px-6 py-10 text-sm text-gray-500 text-center">No attempts match.</p>
      ) : data ? (
        <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <Th>Time</Th>
                <Th>NID</Th>
                <Th>Result</Th>
                <Th>What the EC returned</Th>
                <Th>EC request ID</Th>
                <Th>Caller IP</Th>
                <Th>{''}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.rows.map((row) => {
                const outcome = outcomeOf(row);
                const ec = ecSummary(row);
                const isOpen = open === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr
                      className={`cursor-pointer align-top ${isOpen ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}
                      onClick={() => setOpen(isOpen ? null : row.id)}
                    >
                      <Td className="whitespace-nowrap text-gray-700">{formatBst(row.at)}</Td>
                      <Td className="whitespace-nowrap font-mono">
                        {row.nid ?? (row.nidLast4 ? `••••${row.nidLast4}` : '—')}
                        {row.nidType && (
                          <span className="ml-1.5 text-[10px] text-gray-400 font-sans">{row.nidType}-digit</span>
                        )}
                      </Td>
                      <Td>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${outcome.tone}`}
                        >
                          {outcome.label}
                        </span>
                      </Td>
                      <Td className="min-w-[220px]">
                        <div className="font-mono text-xs text-gray-800">{ec.main}</div>
                        {ec.sub && (
                          <div className="text-xs text-gray-500 mt-0.5 break-words line-clamp-2" title={ec.sub}>
                            {ec.sub}
                          </div>
                        )}
                      </Td>
                      <Td className="font-mono text-xs text-gray-600 whitespace-nowrap" title={row.ecRequestId ?? undefined}>
                        {row.ecRequestId
                          ? row.ecRequestId.length > 13
                            ? `${row.ecRequestId.slice(0, 8)}…`
                            : row.ecRequestId
                          : '—'}
                      </Td>
                      <Td className="font-mono text-xs text-gray-600 whitespace-nowrap">{row.clientIp || '—'}</Td>
                      <Td className="text-gray-400">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-blue-50/40">
                        <td colSpan={7} className="px-6 pb-5 pt-1">
                          <AttemptDetail row={row} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {data && data.available && total > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
          <span>
            {firstShown}–{lastShown} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setOpen(null);
                setPage((p) => Math.max(0, p - 1));
              }}
              disabled={page === 0 || loading}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              Newer
            </button>
            <button
              onClick={() => {
                setOpen(null);
                setPage((p) => p + 1);
              }}
              disabled={lastShown >= total || loading}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Older
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function AttemptDetail({ row }: { row: NidVerificationAttempt }) {
  const json = prettyJson(row.ecResponse);
  const stage =
    row.stage === 'request'
      ? 'Rejected before reaching the EC'
      : row.stage === 'auth'
        ? 'Stopped at our login to the EC'
        : 'Answered by the EC';
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <dl className="space-y-2 text-sm">
        <Detail label="Applicant was told" value={row.detail || (row.verified ? 'NID Verified' : '—')} />
        <Detail label="Stage" value={stage} />
        {row.ecRequestId && <Detail label="EC request ID" value={row.ecRequestId} mono />}
        {row.ecErrorField && <Detail label="EC error field" value={row.ecErrorField} mono />}
        {row.error && <Detail label="Our error" value={row.error} mono />}
        <Detail
          label="Timing"
          value={[
            row.ecMs != null ? `EC call ${(row.ecMs / 1000).toFixed(2)} s` : null,
            row.totalMs != null ? `total ${(row.totalMs / 1000).toFixed(2)} s` : null,
          ]
            .filter(Boolean)
            .join(' · ') || '—'}
        />
        <Detail label="Website" value={row.origin || '—'} mono />
      </dl>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          EC response (raw)
        </p>
        {json ? (
          <pre className="text-xs bg-white border border-gray-200 rounded-lg p-3 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {json}
          </pre>
        ) : (
          <p className="text-xs text-gray-500">
            {row.ecHttpStatus == null ? 'The EC did not answer this attempt.' : 'Not available.'}
          </p>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <dt className="w-36 shrink-0 text-gray-500">{label}</dt>
      <dd className={`text-gray-900 break-words min-w-0 ${mono ? 'font-mono text-xs leading-5' : ''}`}>{value}</dd>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-[#0D529E] text-white border-[#0D529E]'
          : 'bg-white text-gray-700 border-gray-300 hover:border-[#0D529E] hover:text-[#0D529E]'
      }`}
    >
      {label}
      <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-gray-400'}`}>{count.toLocaleString()}</span>
    </button>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left font-semibold px-3 py-2.5 whitespace-nowrap ${className}`}>{children}</th>;
}

function Td({
  children,
  className = '',
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <td className={`px-3 py-3 ${className}`} title={title}>
      {children}
    </td>
  );
}
