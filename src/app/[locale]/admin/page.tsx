'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getAllPartners, Partner, getPartnerTypeLabel } from '@/lib/api-client/admin';
import { PBX_BASE_URL, VBS_BASE_URL, HCC_BASE_URL, API_ENDPOINTS } from '@/config/api';

interface ServiceStats { subscribers: number; active: number; revenue: number; }
const EMPTY: ServiceStats = { subscribers: 0, active: 0, revenue: 0 };

export default function AdminDashboard() {
  const params = useParams();
  const locale = params.locale || 'en';
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState(0);
  const [recent, setRecent] = useState<Partner[]>([]);
  const [svc, setSvc] = useState({ pbx: EMPTY, hcc: EMPTY, vbs: EMPTY });

  useEffect(() => {
    (async () => {
      try {
        const t = localStorage.getItem('authToken');
        if (!t) return;
        const all = await getAllPartners({ page: 0, size: 1000, partnerName: null, partnerType: null }, t);
        const list = (Array.isArray(all) ? all : []).filter((p) => [3, 4, 5, 6].includes(p.partnerType));
        setCustomers(list.length);
        setRecent([...list].filter((p) => p.date1).sort((a, b) => new Date(b.date1!).getTime() - new Date(a.date1!).getTime()).slice(0, 4));

        const stats: any = { pbx: { ...EMPTY }, hcc: { ...EMPTY }, vbs: { ...EMPTY } };
        const urls = [{ k: 'pbx', u: PBX_BASE_URL }, { k: 'hcc', u: HCC_BASE_URL }, { k: 'vbs', u: VBS_BASE_URL }];
        const sample = list.slice(0, 30);
        await Promise.allSettled(urls.map(async ({ k, u }) => {
          const subs = new Set<number>(); let act = 0, rev = 0;
          await Promise.allSettled(sample.map(async (p) => {
            try {
              const r = await fetch(`${u}${API_ENDPOINTS.package.getPurchaseForPartner}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ idPartner: p.idPartner }) });
              if (r.ok) { const d = await r.json(); const v = (Array.isArray(d) ? d : []).filter((x: any) => x.idPackage !== 9999); if (v.length) { subs.add(p.idPartner); v.forEach((x: any) => { if (x.status === 'ACTIVE') act++; rev += x.total || x.price || 0; }); } }
            } catch {}
          }));
          stats[k] = { subscribers: subs.size, active: act, revenue: rev };
        }));
        setSvc(stats);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-120px)]">
      <svg className="w-8 h-8 animate-spin text-[#00A651]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
    </div>
  );

  const totalActive = svc.pbx.active + svc.hcc.active + svc.vbs.active;
  const totalRev = svc.pbx.revenue + svc.hcc.revenue + svc.vbs.revenue;

  const services = [
    { k: 'pbx', name: 'Hosted PBX', icon: '📞', grad: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', s: svc.pbx, portal: 'https://hippbx.btcliptelephony.gov.bd:5174/', plans: 'Bronze / Silver / Gold' },
    { k: 'hcc', name: 'Contact Center', icon: '👥', grad: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', s: svc.hcc, portal: 'https://hcc.btcliptelephony.gov.bd/', plans: 'Basic (per agent)' },
    { k: 'vbs', name: 'Voice Broadcast', icon: '📢', grad: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', s: svc.vbs, portal: 'https://vbs.btcliptelephony.gov.bd/', plans: 'Basic / Standard / Enterprise' },
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4 overflow-hidden">
      {/* Row 1: Header + Stats */}
      <div className="flex gap-4 shrink-0">
        {/* Banner */}
        <div className="flex-1 bg-gradient-to-r from-[#00A651] to-[#004D28] rounded-xl p-5 flex items-center min-w-0">
          <div>
            <h1 className="text-lg font-bold text-white">BTCL Service Dashboard</h1>
            <p className="text-white/60 text-xs mt-0.5">IP Telephony Services Overview</p>
          </div>
        </div>
        {/* Stats */}
        {[
          { label: 'Customers', value: customers, icon: '👤', color: 'text-[#00A651]', bg: 'bg-green-50' },
          { label: 'Active Plans', value: totalActive, icon: '📋', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Revenue', value: `৳${totalRev.toLocaleString()}`, icon: '💰', color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center text-base`}>{s.icon}</div>
            <div>
              <p className={`text-xl font-bold ${s.color} leading-tight`}>{s.value}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Service Cards */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        {services.map((sv) => (
          <div key={sv.k} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className={`bg-gradient-to-r ${sv.grad} px-4 py-2.5 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{sv.icon}</span>
                <span className="text-sm font-bold text-white">{sv.name}</span>
              </div>
              <a href={sv.portal} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/80 hover:text-white">Portal →</a>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className={`${sv.bg} ${sv.border} border rounded-lg px-2 py-2 text-center`}>
                  <p className={`text-lg font-bold ${sv.text} leading-tight`}>{sv.s.subscribers}</p>
                  <p className="text-[9px] text-gray-500 uppercase">Subscribers</p>
                </div>
                <div className={`${sv.bg} ${sv.border} border rounded-lg px-2 py-2 text-center`}>
                  <p className={`text-lg font-bold ${sv.text} leading-tight`}>{sv.s.active}</p>
                  <p className="text-[9px] text-gray-500 uppercase">Active</p>
                </div>
                <div className={`${sv.bg} ${sv.border} border rounded-lg px-2 py-2 text-center`}>
                  <p className={`text-lg font-bold ${sv.text} leading-tight`}>৳{sv.s.revenue.toLocaleString()}</p>
                  <p className="text-[9px] text-gray-500 uppercase">Revenue</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Plans: <span className="text-gray-600 font-medium">{sv.plans}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 3: Recent Customers + Quick Links */}
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Recent Customers */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="text-sm font-bold text-gray-900">Recent Customers</h2>
            <Link href={`/${locale}/admin/partners`} className="text-[10px] text-[#00A651] hover:underline font-medium">View All →</Link>
          </div>
          <div className="flex-1 overflow-hidden space-y-1">
            {recent.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No customers yet</p>
            ) : recent.map((p, i) => (
              <Link key={p.idPartner} href={`/${locale}/admin/partners/${p.idPartner}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${i % 3 === 0 ? 'bg-[#00A651]' : i % 3 === 1 ? 'bg-blue-500' : 'bg-purple-500'}`}>
                  {p.partnerName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.partnerName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{p.email || 'No email'}</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-[#00A651]">{getPartnerTypeLabel(p.partnerType)}</span>
                <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col min-h-0">
          <h2 className="text-sm font-bold text-gray-900 mb-3 shrink-0">Quick Links</h2>
          <div className="flex-1 overflow-hidden space-y-1">
            {[
              { label: 'Manage Partners', href: `/${locale}/admin/partners`, icon: '👤', color: 'bg-green-50 text-[#00A651]' },
              { label: 'PBX Portal', href: 'https://hippbx.btcliptelephony.gov.bd:5174/', icon: '📞', color: 'bg-blue-50 text-blue-600', ext: true },
              { label: 'Contact Center', href: 'https://hcc.btcliptelephony.gov.bd/', icon: '👥', color: 'bg-purple-50 text-purple-600', ext: true },
              { label: 'Voice Broadcast', href: 'https://vbs.btcliptelephony.gov.bd/', icon: '📢', color: 'bg-orange-50 text-orange-600', ext: true },
              { label: 'User Dashboard', href: `/${locale}/dashboard`, icon: '🏠', color: 'bg-gray-100 text-gray-600' },
              { label: 'Pricing Page', href: `/${locale}/pricing`, icon: '💳', color: 'bg-emerald-50 text-emerald-600' },
            ].map((l) => {
              const cls = "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group";
              const inner = (
                <>
                  <div className={`w-7 h-7 ${l.color} rounded-md flex items-center justify-center text-xs`}>{l.icon}</div>
                  <span className="text-sm text-gray-700 flex-1">{l.label}</span>
                  {l.ext ? (
                    <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  ) : (
                    <svg className="w-3 h-3 text-gray-300 group-hover:text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  )}
                </>
              );
              return l.ext ? (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
              ) : (
                <Link key={l.label} href={l.href} className={cls}>{inner}</Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
