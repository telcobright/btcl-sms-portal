'use client';

import { useCallback, useEffect, useState } from 'react';
import { getEmailLogs, EmailLogEntry, EmailLogPage } from '@/lib/api-client/admin';

const TYPE_OPTIONS = [
  'WELCOME', 'APPROVAL', 'REJECTION', 'REGISTRATION', 'CONTACT',
  'INVOICE', 'EXPIRY', 'BALANCE', 'PASSWORD', 'GENERAL',
];

const TYPE_STYLES: Record<string, string> = {
  WELCOME: 'bg-blue-50 text-blue-700 border-blue-200',
  APPROVAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTION: 'bg-red-50 text-red-700 border-red-200',
  REGISTRATION: 'bg-purple-50 text-purple-700 border-purple-200',
  CONTACT: 'bg-amber-50 text-amber-700 border-amber-200',
  INVOICE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  EXPIRY: 'bg-orange-50 text-orange-700 border-orange-200',
  BALANCE: 'bg-teal-50 text-teal-700 border-teal-200',
  PASSWORD: 'bg-rose-50 text-rose-700 border-rose-200',
  GENERAL: 'bg-gray-100 text-gray-600 border-gray-200',
};

const PAGE_SIZE = 20;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminEmailsPage() {
  const [data, setData] = useState<EmailLogPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<EmailLogEntry | null>(null);

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setLoading(true);
    try {
      const res = await getEmailLogs(
        { page, size: PAGE_SIZE, search: debouncedSearch || null, type: type || null, status: status || null },
        token
      );
      setData(res);
    } catch {
      setData({ content: [], totalElements: 0, totalPages: 0, number: 0, size: PAGE_SIZE });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, type, status]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const rows = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sent Emails</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Every notification email sent by the system (OTP codes excluded). History begins from when logging was enabled.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0D529E] hover:bg-blue-50 rounded-xl border border-gray-200 transition-colors"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipient or subject…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D529E]/20 focus:border-[#0D529E] outline-none"
          />
        </div>
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(0); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0D529E] outline-none text-gray-700"
        >
          <option value="">All types</option>
          {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0D529E] outline-none text-gray-700"
        >
          <option value="">All statuses</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
        </select>
        {(search || type || status) && (
          <button
            onClick={() => { setSearch(''); setType(''); setStatus(''); setPage(0); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-[11px] uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Recipient</th>
              <th className="px-4 py-3 font-semibold">Subject</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-16 text-center">
                <svg className="w-7 h-7 mx-auto animate-spin text-[#0D529E]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-16 text-center text-gray-400">
                <svg className="w-10 h-10 mx-auto text-gray-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                No emails found
              </td></tr>
            ) : rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelected(r)}
                className="hover:bg-blue-50/40 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                <td className="px-4 py-3 text-gray-900 font-medium max-w-[200px] truncate" title={r.recipients}>{r.recipients}</td>
                <td className="px-4 py-3 text-gray-700 max-w-[320px] truncate" title={r.subject || ''}>{r.subject || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TYPE_STYLES[r.type || 'GENERAL'] || TYPE_STYLES.GENERAL}`}>
                    {r.type || 'GENERAL'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.status === 'SENT' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      Sent
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      Failed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            {totalElements > 0
              ? `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalElements)} of ${totalElements}`
              : '0 emails'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">Page {page + 1} of {Math.max(1, totalPages)}</span>
            <button
              onClick={() => setPage((p) => (totalPages && p + 1 >= totalPages ? p : p + 1))}
              disabled={loading || page + 1 >= totalPages}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Drawer header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TYPE_STYLES[selected.type || 'GENERAL'] || TYPE_STYLES.GENERAL}`}>
                    {selected.type || 'GENERAL'}
                  </span>
                  {selected.status === 'SENT' ? (
                    <span className="text-[10px] font-semibold text-emerald-600">✓ Sent</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-red-600">✗ Failed</span>
                  )}
                </div>
                <h2 className="text-base font-bold text-gray-900 truncate">{selected.subject || '(no subject)'}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Meta */}
            <div className="px-6 py-3 border-b border-gray-100 space-y-1.5 text-sm bg-gray-50/50">
              <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">To</span><span className="text-gray-800 break-all">{selected.recipients}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Sent at</span><span className="text-gray-800">{formatDate(selected.createdAt)}</span></div>
              {selected.status === 'FAILED' && selected.errorMessage && (
                <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Error</span><span className="text-red-600 break-all">{selected.errorMessage}</span></div>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-6">
              {selected.isHtml ? (
                <iframe
                  title="Email preview"
                  sandbox=""
                  srcDoc={selected.body || ''}
                  className="w-full h-full min-h-[400px] border border-gray-200 rounded-lg bg-white"
                />
              ) : (
                <pre className="whitespace-pre-wrap break-words text-sm text-gray-700 font-sans">{selected.body || '(empty body)'}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
