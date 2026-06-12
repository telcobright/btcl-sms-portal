'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getAllPartners, Partner, getPartnerTypeLabel } from '@/lib/api-client/admin';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

interface NotificationItem {
  id: number;
  partnerName: string;
  email: string | null;
  partnerType: number;
  date: string | null;
  pendingDocs: number;
  totalDocs: number;
}

export default function AdminNotifications({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setLoading(true);
    try {
      const partners = await getAllPartners({ page: 0, size: 1000, partnerName: null, partnerType: null }, token);
      const list = (Array.isArray(partners) ? partners : []).filter((p) => [3, 4, 5, 6].includes(p.partnerType));

      const sorted = [...list]
        .filter((p) => p.date1)
        .sort((a, b) => new Date(b.date1!).getTime() - new Date(a.date1!).getTime())
        .slice(0, 20);

      const items: NotificationItem[] = [];

      await Promise.allSettled(
        sorted.map(async (p) => {
          try {
            const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.partner.getDocumentStatuses}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ partnerId: p.idPartner }),
            });
            if (!res.ok) return;
            const statuses: Record<string, { status: string }> = await res.json();
            const entries = Object.values(statuses);
            const pending = entries.filter((s) => s.status === 'PENDING').length;
            if (pending > 0) {
              items.push({
                id: p.idPartner,
                partnerName: p.partnerName,
                email: p.email,
                partnerType: p.partnerType,
                date: p.date1,
                pendingDocs: pending,
                totalDocs: entries.length,
              });
            }
          } catch {}
        })
      );

      items.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
      setNotifications(items);
      setLastFetched(Date.now());
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const count = notifications.length;

  const timeAgo = (date: string | null) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open && Date.now() - lastFetched > 30000) fetchNotifications(); }}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[400px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#0D529E] to-[#1F3C71] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              <p className="text-[10px] text-white/60">{count} pending review{count !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); fetchNotifications(); }}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Refresh"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <svg className="w-6 h-6 animate-spin text-[#0D529E]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-400">All caught up!</p>
                <p className="text-xs text-gray-300">No pending reviews</p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={`/${locale}/admin/partners/${n.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-blue-50/50 border-b border-gray-100 last:border-0 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                    {n.partnerName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#0D529E]">{n.partnerName}</p>
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                        {n.pendingDocs} pending
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{n.email || 'No email'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">{getPartnerTypeLabel(n.partnerType)}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">{timeAgo(n.date)}</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-[#0D529E] shrink-0 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
              <Link
                href={`/${locale}/admin/partners`}
                onClick={() => setOpen(false)}
                className="text-xs text-[#0D529E] hover:underline font-medium flex items-center justify-center gap-1"
              >
                View All Partners
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
