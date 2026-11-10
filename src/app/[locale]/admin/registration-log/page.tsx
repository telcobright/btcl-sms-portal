'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  UserPlus,
  XCircle,
} from 'lucide-react';
import {
  getRegistrationEvents,
  getRegistrationJourneys,
  registrationLogErrorMessage,
  type RegistrationJourney,
  type RegistrationJourneyPage,
  type RegistrationLogEvent,
} from '@/lib/api-client/registrationLog';

/**
 * Every self-service registration attempt: who it was, how far they got, and what went wrong.
 *
 * The registration page reports each step (OTP, NID check, documents, submit) and the server
 * records the submit itself, so a row is marked Registered only when an account was actually
 * created. Abandoned means no activity for half an hour without registering.
 */

const STAGES = ['Email & phone', 'NID', 'Documents', 'Submit'];

const EVENT_LABELS: Record<string, string> = {
  PAGE_OPENED: 'Opened the registration page',
  FORM_INVALID: 'Form has errors',
  VALIDATE: 'Checked company, email and phone',
  EMAIL_OTP_SEND: 'Email OTP sent',
  EMAIL_OTP_VERIFY: 'Email OTP checked',
  PHONE_OTP_SEND: 'Phone OTP sent',
  PHONE_OTP_VERIFY: 'Phone OTP checked',
  OTP_RESEND: 'OTP resent',
  NID_OCR: 'NID image read (OCR)',
  NID_DUPLICATE: 'NID already registered',
  NID_VERIFY: 'NID checked with the EC',
  STEP_REACHED: 'Moved to the next step',
  DOCUMENT_TOO_LARGE: 'Document too large',
  SUBMIT: 'Submitted the registration',
  REGISTER: 'Account creation',
  AUTO_LOGIN: 'Automatic sign-in',
  START_OVER: 'Started over',
  CLIENT_ERROR: 'Error on the page',
};

const label = (event: string | null) => (event ? EVENT_LABELS[event] ?? event : '—');

const CATEGORY_LABELS: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  CORPORATE: 'Corporate',
  GOVERNMENT_INDIVIDUAL: 'Govt. Individual',
  GOVERNMENT_CORPORATE: 'Govt. Corporate',
};

const STATE_STYLE: Record<string, { text: string; tone: string }> = {
  REGISTERED: { text: 'Registered', tone: 'bg-green-50 text-green-700 border-green-200' },
  IN_PROGRESS: { text: 'In progress', tone: 'bg-blue-50 text-[#0D529E] border-blue-200' },
  ABANDONED: { text: 'Not registered', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
};

const PAGE_SIZE = 50;

const formatBst = (value: string | null, withSeconds = false) => {
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
    ...(withSeconds ? { second: '2-digit' } : {}),
    hour12: true,
  });
};

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

/** "Chrome on Android" from a user agent — enough to spot a device-specific problem. */
const browserOf = (ua: string | null) => {
  if (!ua) return '—';
  const os = /Android/i.test(ua)
    ? 'Android'
    : /iPhone|iPad|iOS/i.test(ua)
      ? 'iOS'
      : /Windows/i.test(ua)
        ? 'Windows'
        : /Mac OS/i.test(ua)
          ? 'macOS'
          : /Linux/i.test(ua)
            ? 'Linux'
            : 'unknown OS';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /SamsungBrowser/.test(ua)
        ? 'Samsung Internet'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Firefox\//.test(ua)
            ? 'Firefox'
            : /Safari\//.test(ua)
              ? 'Safari'
              : 'Browser';
  return `${browser} on ${os}`;
};

export default function RegistrationLogPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(0);
  const [applied, setApplied] = useState({ q: '', from: '', to: '' });

  const [data, setData] = useState<RegistrationJourneyPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    setLoading(true);
    try {
      const next = await getRegistrationJourneys(
        {
          q: applied.q || undefined,
          from: applied.from || undefined,
          to: applied.to || undefined,
          state: state || undefined,
          page,
          size: PAGE_SIZE,
        },
        authToken
      );
      setData(next);
      setError(null);
    } catch (err) {
      setError(registrationLogErrorMessage(err, 'Could not load the registration log.'));
    } finally {
      setLoading(false);
    }
  }, [applied, state, page]);

  useEffect(() => {
    load();
  }, [load]);

  const applySearch = () => {
    setOpen(null);
    setPage(0);
    setApplied({ q: search.trim(), from, to });
  };

  const chooseState = (next: string) => {
    setOpen(null);
    setPage(0);
    setState(next);
  };

  const counts = data?.counts ?? {};
  const total = data?.total ?? 0;
  const firstShown = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const lastShown = Math.min(total, (page + 1) * PAGE_SIZE);

  const cards: { key: string; title: string; value: number | undefined; hint: string }[] = [
    { key: '', title: 'All attempts', value: counts.total, hint: 'Every registration started' },
    { key: 'REGISTERED', title: 'Registered', value: counts.registered, hint: 'An account was created' },
    {
      key: 'IN_PROGRESS',
      title: 'In progress',
      value: counts.inProgress,
      hint: `Active in the last ${data?.abandonedAfterMinutes ?? 30} minutes`,
    },
    { key: 'ABANDONED', title: 'Not registered', value: counts.abandoned, hint: 'Stopped without an account' },
    { key: 'WITH_ERRORS', title: 'Hit an error', value: counts.withErrors, hint: 'Not registered, at least one failure' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3C71] flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-[#0D529E]" />
            Registration Log
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Every self-service registration attempt: who it was, how far they got, and what went
            wrong. Times are Bangladesh time.
          </p>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#0D529E] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Outcome summary, which doubles as the filter */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {cards.map((c) => (
          <button
            key={c.key || 'all'}
            onClick={() => chooseState(c.key)}
            className={`text-left rounded-xl border p-4 transition-colors ${
              state === c.key
                ? 'border-[#0D529E] bg-[#0D529E]/5 ring-1 ring-[#0D529E]'
                : 'border-gray-200 bg-white hover:border-[#0D529E]/50'
            }`}
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{c.title}</p>
            <p className="text-2xl font-bold text-[#1F3C71] mt-1">{(c.value ?? 0).toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 mt-1">{c.hint}</p>
          </button>
        ))}
      </div>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <form
          className="px-6 py-4 flex flex-wrap items-end gap-3 border-b border-gray-100"
          onSubmit={(e) => {
            e.preventDefault();
            applySearch();
          }}
        >
          <label className="flex-1 min-w-[240px]">
            <span className="block text-xs font-medium text-gray-600 mb-1">
              Email, phone, NID, company or name
            </span>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. 01712345678 or name@example.com"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30 focus:border-[#0D529E]"
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

        {error && (
          <div className="mx-6 my-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading && !data ? (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading the registration log…
          </div>
        ) : data && !data.available ? (
          <p className="px-6 py-12 text-sm text-gray-500 text-center">
            Nothing recorded yet. Attempts are recorded once the backend and the website are updated
            to the version with this log.
          </p>
        ) : data && data.rows.length === 0 ? (
          <p className="px-6 py-12 text-sm text-gray-500 text-center">No registration attempts match.</p>
        ) : data ? (
          <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>Last activity</Th>
                  <Th>Applicant</Th>
                  <Th>Type</Th>
                  <Th>How far</Th>
                  <Th>Status</Th>
                  <Th>Last problem</Th>
                  <Th>{''}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.rows.map((row) => {
                  const isOpen = open === row.journeyId;
                  const style = STATE_STYLE[row.state] ?? STATE_STYLE.ABANDONED;
                  return (
                    <Fragment key={row.journeyId}>
                      <tr
                        className={`cursor-pointer align-top ${isOpen ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}
                        onClick={() => setOpen(isOpen ? null : row.journeyId)}
                      >
                        <Td className="whitespace-nowrap text-gray-700">{formatBst(row.lastEventAt)}</Td>
                        <Td className="min-w-[190px] max-w-[260px]">
                          <div className="font-medium text-gray-900">
                            {row.fullName || row.companyName || <span className="text-gray-400">Not given yet</span>}
                          </div>
                          {row.fullName && row.companyName && row.companyName !== row.fullName && (
                            <div className="text-xs text-gray-500">{row.companyName}</div>
                          )}
                          {row.email && <div className="text-xs text-gray-500 mt-0.5 break-words">{row.email}</div>}
                          {row.phone && <div className="text-xs text-gray-500 whitespace-nowrap">{row.phone}</div>}
                          {!row.email && !row.phone && <div className="text-xs text-gray-400">—</div>}
                        </Td>
                        <Td className="whitespace-nowrap text-xs text-gray-700">
                          {row.customerCategory ? CATEGORY_LABELS[row.customerCategory] ?? row.customerCategory : '—'}
                        </Td>
                        <Td>
                          <Progress row={row} />
                        </Td>
                        <Td>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${style.tone}`}
                          >
                            {style.text}
                          </span>
                          {row.state === 'REGISTERED' && row.idPartner != null && (
                            <div className="text-[11px] text-gray-500 mt-1">Partner #{row.idPartner}</div>
                          )}
                        </Td>
                        <Td className="min-w-[180px] max-w-[260px]">
                          {row.lastError ? (
                            <>
                              <div className="text-xs font-medium text-red-700">{label(row.lastErrorEvent)}</div>
                              <div className="text-xs text-gray-600 line-clamp-2" title={row.lastError}>
                                {row.lastError}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </Td>
                        <Td className="text-gray-400">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-blue-50/40">
                          <td colSpan={7} className="px-6 pb-6 pt-2">
                            <JourneyDetail row={row} locale={locale} />
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
    </div>
  );
}

/** Four stages, filled up to the furthest one reached; the last one red if it stopped on an error. */
function Progress({ row }: { row: RegistrationJourney }) {
  const reached = row.state === 'REGISTERED' ? 4 : Math.max(1, Math.min(4, row.furthestStep ?? 1));
  const stuck = row.state !== 'REGISTERED' && row.lastOutcome === 'FAIL';
  return (
    <div className="flex items-center gap-1" title={`Reached: ${STAGES[reached - 1]}`}>
      {STAGES.map((stage, i) => {
        const n = i + 1;
        const tone =
          n < reached || row.state === 'REGISTERED'
            ? 'bg-green-500'
            : n === reached
              ? stuck
                ? 'bg-red-500'
                : 'bg-[#0D529E]'
              : 'bg-gray-200';
        return <span key={stage} className={`h-1.5 w-6 rounded-full ${tone}`} />;
      })}
      <span className="ml-2 text-xs text-gray-600 whitespace-nowrap">{STAGES[reached - 1]}</span>
    </div>
  );
}

function JourneyDetail({ row, locale }: { row: RegistrationJourney; locale: string }) {
  const [events, setEvents] = useState<RegistrationLogEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    let alive = true;
    getRegistrationEvents(row.journeyId, authToken)
      .then((next) => alive && setEvents(next))
      .catch((err) => alive && setError(registrationLogErrorMessage(err, 'Could not load the steps.')));
    return () => {
      alive = false;
    };
  }, [row.journeyId]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <dl className="space-y-2 text-sm bg-white rounded-lg border border-gray-200 p-4 h-fit">
        <Fact label="Status">
          {row.state === 'REGISTERED' && row.idPartner != null ? (
            <Link
              href={`/${locale}/admin/partners/${row.idPartner}`}
              className="text-[#0D529E] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Registered — partner #{row.idPartner}
            </Link>
          ) : (
            (STATE_STYLE[row.state] ?? STATE_STYLE.ABANDONED).text
          )}
        </Fact>
        <Fact label="Name">{row.fullName || '—'}</Fact>
        <Fact label="Company">{row.companyName || '—'}</Fact>
        <Fact label="Email">{row.email || '—'}</Fact>
        <Fact label="Phone">{row.phone || '—'}</Fact>
        <Fact label="NID">
          {row.nid || row.nidLast4 ? (
            <span className="font-mono text-xs">
              {row.nid ?? `••••${row.nidLast4}`}
              {row.nid && (
                <Link
                  href={`/${locale}/admin/ec-nid-verification?q=${encodeURIComponent(row.nid)}#verification-log`}
                  className="ml-2 font-sans text-[#0D529E] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  EC replies
                </Link>
              )}
            </span>
          ) : (
            '—'
          )}
        </Fact>
        <Fact label="Started">{formatBst(row.startedAt, true)}</Fact>
        <Fact label="Last activity">{formatBst(row.lastEventAt, true)}</Fact>
        <Fact label="Steps / failures">
          {row.eventCount ?? 0} / {row.failureCount ?? 0}
        </Fact>
        <Fact label="Device">{browserOf(row.userAgent)}</Fact>
        <Fact label="IP">
          <span className="font-mono text-xs">{row.clientIp || '—'}</span>
        </Fact>
        <Fact label="Journey ID">
          <span className="font-mono text-[11px] break-all">{row.journeyId}</span>
        </Fact>
      </dl>

      <div className="xl:col-span-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">What happened, in order</p>
        {error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : !events ? (
          <p className="text-sm text-gray-500 flex items-center">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading the steps…
          </p>
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-500">No steps recorded.</p>
        ) : (
          <ol className="relative border-l border-gray-200 ml-2 space-y-3">
            {events.map((ev) => (
              <TimelineItem key={ev.id} ev={ev} />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ ev }: { ev: RegistrationLogEvent }) {
  const icon =
    ev.outcome === 'OK' ? (
      <CheckCircle2 className="w-4 h-4 text-green-600" />
    ) : ev.outcome === 'FAIL' ? (
      <XCircle className="w-4 h-4 text-red-600" />
    ) : (
      <Clock className="w-4 h-4 text-gray-400" />
    );
  let details: Record<string, unknown> | null = null;
  try {
    details = ev.details ? (JSON.parse(ev.details) as Record<string, unknown>) : null;
  } catch {
    details = ev.details ? { details: ev.details } : null;
  }
  const stepText =
    ev.event === 'STEP_REACHED' && ev.step ? `Moved to step ${ev.step}: ${STAGES[ev.step - 1] ?? ''}` : null;

  return (
    <li className="ml-4">
      <span className="absolute -left-2 mt-0.5 bg-white rounded-full">{icon}</span>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-xs text-gray-500 whitespace-nowrap">{formatBst(ev.at, true)}</span>
        <span className={`text-sm font-medium ${ev.outcome === 'FAIL' ? 'text-red-700' : 'text-gray-900'}`}>
          {stepText ?? label(ev.event)}
        </span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded border ${
            ev.source === 'server'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}
          title={
            ev.source === 'server'
              ? 'Recorded by the server — authoritative'
              : 'Reported by the applicant’s browser'
          }
        >
          {ev.source === 'server' ? 'Server' : 'Browser'}
        </span>
        {ev.httpStatus != null && (
          <span className="text-[10px] font-mono text-gray-500">HTTP {ev.httpStatus}</span>
        )}
      </div>
      {ev.message && !stepText && (
        <p className={`text-xs mt-0.5 break-words ${ev.outcome === 'FAIL' ? 'text-red-700' : 'text-gray-600'}`}>
          {ev.message}
        </p>
      )}
      {details && Object.keys(details).length > 0 && <Details value={details} />}
    </li>
  );
}

const DETAIL_LABELS: Record<string, string> = {
  code: 'Code',
  retryAfterSeconds: 'Retry after (s)',
  reason: 'EC reason',
  requestId: 'EC request ID',
  nidType: 'NID digits',
  fields: 'Fields',
  fieldsFound: 'Read from image',
  documents: 'Documents',
  customerType: 'Billing',
  customerPrePaid: 'Prepaid (1) / postpaid (2)',
  idPartner: 'Partner',
  cause: 'Cause',
  exception: 'Exception',
  channel: 'Channel',
  offline: 'Browser offline',
  reachedService: 'Reached the service',
  restarted: 'Restarted',
  locale: 'Language',
  referrer: 'Came from',
  source: 'Where',
  kind: 'Kind',
};

/** Key–value lines; nested objects (fields, documents) one level deep. */
function Details({ value }: { value: Record<string, unknown> }) {
  const entries = Object.entries(value).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (entries.length === 0) return null;
  return (
    <dl className="mt-1 text-xs grid grid-cols-[auto,1fr] gap-x-3 gap-y-0.5">
      {entries.map(([k, v]) => (
        <Fragment key={k}>
          <dt className="text-gray-500">{DETAIL_LABELS[k] ?? k}</dt>
          <dd className="text-gray-800 break-words min-w-0">
            {v && typeof v === 'object' && !Array.isArray(v) ? (
              <ul className="space-y-0.5">
                {Object.entries(v as Record<string, unknown>).map(([nk, nv]) => (
                  <li key={nk}>
                    <span className="text-gray-500">{nk}:</span> {String(nv)}
                  </li>
                ))}
              </ul>
            ) : Array.isArray(v) ? (
              v.join(', ')
            ) : (
              String(v)
            )}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

function Fact({ label: name, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-gray-500">{name}</dt>
      <dd className="text-gray-900 min-w-0 break-words">{children}</dd>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>;
}
