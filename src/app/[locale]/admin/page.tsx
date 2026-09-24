"use client";

import {
  API_BASE_URL,
  API_ENDPOINTS,
  BULK_SMS_BASE_URL,
  BULK_SMS_PORTAL_URL,
  HCC_BASE_URL,
  PBX_BASE_URL,
  VBS_BASE_URL,
} from "@/config/api";
import {
  getAllPartners,
  getPartnerCategoryCounts,
  getPartnerListSummary,
  getPartnerTypeLabel,
  Partner,
} from "@/lib/api-client/admin";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// The admin dashboard.
//
// Every figure here is the same one the previous layout showed, from the same
// loader: the batched all-products request with its per-service and
// per-partner climb-down, and the progressive document review with its
// per-partner fallback. What changed is the reading order — the standing
// totals moved onto the header band, each service leads with its revenue and
// its share of the total, and documents to review, the only panel that holds
// work, takes the widest column.
//
// The layout it replaced is kept at /admin/classic, so going back is a URL
// rather than a rebuild.
// ═══════════════════════════════════════════════════════════════════════════

interface ServicePartner {
  id: number;
  name: string;
  status: string;
  plan: string;
  balance: string;
}

interface ServiceStats {
  subscribers: number;
  active: number;
  revenue: number;
  partners: ServicePartner[];
}

// Per-service package counts cost one request per partner (there is no batched
// equivalent), so these bound the blast radius of that fan-out.
const SERVICE_CONCURRENCY = 6;
const SERVICE_TIMEOUT_MS = 15000;
// Consecutive transport failures before a service is written off for this load.
const FAILURE_CUTOFF = 3;
// Partners per batched request. The service caps a single call at 500 ids.
const SUMMARY_CHUNK = 100;
// Longer than a single-partner call: this one answers for a hundred of them.
const SUMMARY_TIMEOUT_MS = 30000;

/** One partner's package standing on one service, from /package/list-purchase-summary. */
interface PurchaseSummaryRow {
  idPartner: number;
  subscribed: boolean;
  activeCount: number;
  revenue: number;
  status: string | null;
  plan: string | null;
  balance: number;
  uom: string | null;
}

/** Runs `fn` over `items`, never more than `limit` at a time. */
async function mapWithLimit<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    // Each worker keeps claiming the next index, so a slow item delays only itself.
    while (next < items.length) {
      const i = next++;
      await fn(items[i]);
    }
  });
  await Promise.all(workers);
}

const EMPTY: ServiceStats = { subscribers: 0, active: 0, revenue: 0, partners: [] };

interface DocReviewItem {
  id: number;
  name: string;
  email: string | null;
  partnerType: number;
  date: string | null;
  status: "pending" | "rejected" | "approved";
  detail: string;
}

interface ServiceCard {
  k: string;
  name: string;
  icon: string;
  grad: string;
  bg: string;
  border: string;
  text: string;
  ring: string;
  s: ServiceStats;
  portal: string;
  plans: string;
}

export default function AdminDashboard() {
  const params = useParams();
  const locale = params.locale || "en";
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState(0);
  // Null until loaded, and stays null if the call fails, so the cards can show a dash
  // rather than a zero that reads as a real count.
  const [categoryCounts, setCategoryCounts] =
    useState<Awaited<ReturnType<typeof getPartnerCategoryCounts>>>(null);
  const [recent, setRecent] = useState<Partner[]>([]);
  const [svc, setSvc] = useState({ pbx: EMPTY, hcc: EMPTY, vbs: EMPTY, sms: EMPTY });
  const [openSvc, setOpenSvc] = useState<ServiceCard | null>(null); // whose subscriber list is shown
  const [docReviews, setDocReviews] = useState<DocReviewItem[]>([]);
  const [reviewLoading, setReviewLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = localStorage.getItem("authToken");
        if (!t) {
          setLoading(false);
          setReviewLoading(false);
          return;
        }
        const all = await getAllPartners(
          { page: 0, size: 1000, partnerName: null, partnerType: null },
          t,
        );
        if (cancelled) return;
        const list = (Array.isArray(all) ? all : []).filter((p) =>
          [3, 4, 5, 6].includes(p.partnerType),
        );
        setCustomers(list.length);

        // Category lives on partner_extra, not on the Partner entity, so it needs its own
        // (single, aggregate) query rather than being derived from the list above.
        getPartnerCategoryCounts(t).then((counts) => {
          if (!cancelled) setCategoryCounts(counts);
        });
        setRecent(
          [...list]
            .filter((p) => p.date1)
            .sort((a, b) => new Date(b.date1!).getTime() - new Date(a.date1!).getTime())
            .slice(0, 5),
        );

        const stats: Record<string, ServiceStats> = {
          pbx: { ...EMPTY },
          hcc: { ...EMPTY },
          vbs: { ...EMPTY },
          sms: { ...EMPTY },
        };
        const urls = [
          { k: "pbx", u: PBX_BASE_URL },
          { k: "hcc", u: HCC_BASE_URL },
          { k: "vbs", u: VBS_BASE_URL },
          { k: "sms", u: BULK_SMS_BASE_URL },
        ];
        // All customers (not a 30-partner sample) so per-service counts are accurate.
        const sample = list;
        const byId = new Map(sample.map((p) => [p.idPartner, p]));

        /**
         * Package standing for a chunk of partners in one call.
         *
         * Returns null when the service has no such endpoint yet, which is the signal to
         * fall back — the portal and the services deploy separately, so this ships before
         * the backend reaches all four.
         */
        const fetchSummary = async (
          base: string,
          ids: number[],
        ): Promise<PurchaseSummaryRow[] | null> => {
          try {
            const r = await fetch(`${base}${API_ENDPOINTS.package.listPurchaseSummary}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
              body: JSON.stringify({ idPartners: ids }),
              signal: AbortSignal.timeout(SUMMARY_TIMEOUT_MS),
            });
            if (!r.ok) return null;
            const d = await r.json();
            return Array.isArray(d) ? (d as PurchaseSummaryRow[]) : null;
          } catch {
            return null;
          }
        };

        /**
         * Every product in one request, from our own backend.
         *
         * It reads each product's schema directly — four of them share this operator's
         * database server and the fifth is reachable from it — so there is no second
         * token, no second origin, and nothing to fall back to. Returns null when the
         * backend predates this endpoint, which is the signal to use the old fan-out
         * below; the portal and the services deploy separately.
         */
        const fetchCombined = async (): Promise<Record<string, unknown> | null> => {
          try {
            const r = await fetch(`${API_BASE_URL}${API_ENDPOINTS.package.allServicesSummary}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
              body: JSON.stringify({ idPartners: sample.map((p) => p.idPartner) }),
              signal: AbortSignal.timeout(SUMMARY_TIMEOUT_MS),
            });
            if (!r.ok) return null;
            const d = await r.json();
            return d && typeof d === "object" && !Array.isArray(d) ? d : null;
          } catch {
            return null;
          }
        };

        // Turns one product's rows into the card the dashboard shows. The rows are the
        // same shape the batched per-service endpoint returned, so this is the same
        // mapping that was already being done four times over.
        const cardFrom = (product: Record<string, unknown>): ServiceStats => {
          const parts: ServicePartner[] = [];
          ((product?.partners as PurchaseSummaryRow[]) ?? []).forEach((row) => {
            if (!row?.subscribed) return;
            const partner = byId.get(row.idPartner);
            const balance = Number(row.balance) || 0;
            parts.push({
              id: row.idPartner,
              name: partner?.partnerName || `#${row.idPartner}`,
              status: row.status || "—",
              plan: row.plan || "—",
              balance: balance ? `${balance.toLocaleString()} ${row.uom ?? ""}`.trim() : "—",
            });
          });
          parts.sort((a, b) => a.name.localeCompare(b.name));
          return {
            subscribers: Number(product?.subscribers) || 0,
            active: Number(product?.activeCount) || 0,
            revenue: Number(product?.revenue) || 0,
            partners: parts,
          };
        };

        const combined = await fetchCombined();
        if (combined) {
          urls.forEach(({ k }) => {
            const product = combined[k] as Record<string, unknown> | undefined;
            // A product the backend could not read keeps its empty card and says so in
            // its own error field; the other three still render.
            if (product && !product.error) {
              stats[k] = cardFrom(product);
            }
          });
        } else
          await Promise.allSettled(
            urls.map(async ({ k, u }) => {
              const subs = new Set<number>();
              const parts: ServicePartner[] = [];
              let act = 0,
                rev = 0;
              // There is no batched per-service equivalent of this endpoint, so the
              // counts cost one request per partner. Left unbounded that is a burst of
              // hundreds per service; cap how many are in flight at once.
              //
              // A service that is down costs one *failed* request per partner, each
              // held open until the gateway gives up — which is how a single dead
              // backend fills the console with hundreds of errors and stalls the card.
              // Count consecutive transport failures and stop asking after a few.
              let consecutiveFailures = 0;
              let abandoned = false;

              const loadPartner = async (p: Partner) => {
                if (abandoned) return;
                try {
                  const r = await fetch(`${u}${API_ENDPOINTS.package.getPurchaseForPartner}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
                    body: JSON.stringify({ idPartner: p.idPartner }),
                    signal: AbortSignal.timeout(SERVICE_TIMEOUT_MS),
                  });
                  // A reply of any status means the service answered, so this is not
                  // the kind of failure the cutoff is meant to catch.
                  consecutiveFailures = 0;
                  if (r.ok) {
                    const d = await r.json();
                    const v = (Array.isArray(d) ? d : []).filter(
                      (x: { idPackage?: number }) => x.idPackage !== 9999,
                    );
                    if (v.length) {
                      subs.add(p.idPartner);
                      v.forEach((x: { status?: string; total?: number; price?: number }) => {
                        if (x.status === "ACTIVE") act++;
                        rev += x.total || x.price || 0;
                      });
                      // Build a one-line summary for this partner in this service.
                      const activeP = v.filter((x: { status?: string }) => x.status === "ACTIVE");
                      const rows = activeP.length ? activeP : v;
                      let balSum = 0;
                      let uom = "";
                      rows.forEach(
                        (x: { packageAccounts?: { balanceAfter?: number; uom?: string }[] }) =>
                          (x.packageAccounts || []).forEach((a) => {
                            balSum += a.balanceAfter || 0;
                            if (a.uom) uom = a.uom;
                          }),
                      );
                      parts.push({
                        id: p.idPartner,
                        name: p.partnerName || `#${p.idPartner}`,
                        status: activeP.length ? "ACTIVE" : v[0]?.status || "—",
                        plan: (activeP[0] || v[0])?.packageName || "—",
                        balance: balSum ? `${balSum.toLocaleString()} ${uom}`.trim() : "—",
                      });
                    }
                  }
                } catch {
                  // Network error, abort or timeout — the service did not answer.
                  consecutiveFailures += 1;
                  if (consecutiveFailures >= FAILURE_CUTOFF) abandoned = true;
                }
              };

              // Preferred path: ask for every partner at once, in chunks. Falls through to
              // the per-partner loop above only while a service is still on a build without
              // the batch endpoint.
              let batched = true;
              for (let i = 0; i < sample.length; i += SUMMARY_CHUNK) {
                const slice = sample.slice(i, i + SUMMARY_CHUNK);
                const rows = await fetchSummary(
                  u,
                  slice.map((p) => p.idPartner),
                );
                if (!rows) {
                  batched = false;
                  break;
                }
                rows.forEach((row) => {
                  if (!row?.subscribed) return;
                  const partner = byId.get(row.idPartner);
                  subs.add(row.idPartner);
                  act += Number(row.activeCount) || 0;
                  rev += Number(row.revenue) || 0;
                  const balance = Number(row.balance) || 0;
                  parts.push({
                    id: row.idPartner,
                    name: partner?.partnerName || `#${row.idPartner}`,
                    status: row.status || "—",
                    plan: row.plan || "—",
                    balance: balance ? `${balance.toLocaleString()} ${row.uom ?? ""}`.trim() : "—",
                  });
                });
              }

              if (!batched) {
                // Start clean: a partial batch must not be double counted by the fallback.
                subs.clear();
                parts.length = 0;
                act = 0;
                rev = 0;
                await mapWithLimit(sample, SERVICE_CONCURRENCY, loadPartner);
              }

              parts.sort((a, b) => a.name.localeCompare(b.name));
              stats[k] = { subscribers: subs.size, active: act, revenue: rev, partners: parts };
            }),
          );
        if (cancelled) return;
        setSvc(stats as typeof svc);

        // Dashboard core is ready — render it now; doc reviews load in the background.
        setLoading(false);

        // Document review status for ALL partners (mandatory docs only), throttled in
        // batches so we don't fire hundreds of requests at once.
        const MANDATORY = ["nidfront", "nidback", "tradelicense", "tin"];
        const toReview = [...list]
          .filter((p) => p.date1)
          .sort((a, b) => new Date(b.date1!).getTime() - new Date(a.date1!).getTime());

        // Turns mandatory-document counts into the row the panel shows. Shared by the
        // batched path and the per-partner fallback so both classify identically.
        const itemFrom = (p: Partner, pending: number, rejected: number): DocReviewItem | null => {
          const approved = MANDATORY.length - pending - rejected;
          const base = {
            id: p.idPartner,
            name: p.partnerName,
            email: p.email,
            partnerType: p.partnerType,
            date: p.date1,
          };
          const daysAgo = p.date1
            ? Math.floor((Date.now() - new Date(p.date1).getTime()) / 86400000)
            : 0;
          const daysLabel =
            daysAgo === 0 ? "Today" : daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;
          if (rejected > 0)
            return { ...base, status: "rejected", detail: `${rejected} rejected · ${daysLabel}` };
          if (pending > 0)
            return { ...base, status: "pending", detail: `${pending} pending · ${daysLabel}` };
          if (approved === MANDATORY.length)
            return { ...base, status: "approved", detail: `All approved · ${daysLabel}` };
          return null;
        };

        // Fallback for a backend older than the mandatory-* fields: read one partner's
        // statuses directly. Kept so the panel stays correct whatever ships first,
        // rather than silently reporting nothing outstanding.
        const buildItem = async (p: Partner): Promise<DocReviewItem | null> => {
          try {
            const r = await fetch(`${API_BASE_URL}${API_ENDPOINTS.partner.getDocumentStatuses}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
              body: JSON.stringify({ id: p.idPartner }),
            });
            if (!r.ok) return null;
            const statuses: Record<string, { status: string }> = await r.json();
            const pending = MANDATORY.filter(
              (d) => !statuses[d] || statuses[d].status === "PENDING",
            ).length;
            const rejected = MANDATORY.filter((d) => statuses[d]?.status === "REJECTED").length;
            return itemFrom(p, pending, rejected);
          } catch {
            return null;
          }
        };

        setReviewLoading(true);
        const collected: DocReviewItem[] = [];
        // list-summary returns the mandatory-document counts for many partners at once,
        // so this panel costs a request per chunk rather than one per partner. Chunked
        // rather than sent as a single list so the SQL stays a sane size and the panel
        // still fills in progressively.
        const CHUNK = 100;
        for (let i = 0; i < toReview.length; i += CHUNK) {
          if (cancelled) return;
          const slice = toReview.slice(i, i + CHUNK);
          const summaries = await getPartnerListSummary(
            slice.map((p) => p.idPartner),
            t,
          );
          if (cancelled) return;
          const byPartner = new Map(summaries.map((x) => [x.idPartner, x]));

          // Partners the batch could not answer for — an older backend with no
          // mandatory-* fields, or a row missing from the response — fall back to a
          // direct read. Normally this list is empty.
          const needsFallback: Partner[] = [];
          slice.forEach((p) => {
            const summary = byPartner.get(p.idPartner);
            if (!summary || summary.mandatoryPending === undefined) {
              needsFallback.push(p);
              return;
            }
            const item = itemFrom(p, summary.mandatoryPending, summary.mandatoryRejected ?? 0);
            if (item) collected.push(item);
          });

          if (needsFallback.length) {
            const results = await Promise.allSettled(needsFallback.map(buildItem));
            results.forEach((res) => {
              if (res.status === "fulfilled" && res.value) collected.push(res.value);
            });
          }

          if (cancelled) return;
          setDocReviews(
            [...collected].sort(
              (a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime(),
            ),
          );
        }
        if (!cancelled) setReviewLoading(false);
      } catch {
        if (!cancelled) {
          setLoading(false);
          setReviewLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="flex flex-col items-center gap-3">
          <span className="block w-9 h-9 rounded-full border-[3px] border-[#0D529E]/20 border-t-[#0D529E] animate-spin" />
          <p className="text-xs text-gray-400">Reading every service…</p>
        </div>
      </div>
    );

  const totalActive = svc.pbx.active + svc.hcc.active + svc.vbs.active + svc.sms.active;
  const totalRev = svc.pbx.revenue + svc.hcc.revenue + svc.vbs.revenue + svc.sms.revenue;
  const totalSubs =
    svc.pbx.subscribers + svc.hcc.subscribers + svc.vbs.subscribers + svc.sms.subscribers;

  const services: ServiceCard[] = [
    {
      k: "pbx",
      name: "Alaap Cloud IP PBX",
      icon: "📞",
      grad: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      ring: "ring-blue-500/25",
      s: svc.pbx,
      portal: "https://ippbx.alaapcloud.gov.bd:5174/",
      plans: "Bronze / Silver / Gold",
    },
    {
      k: "hcc",
      name: "Contact Center",
      icon: "👥",
      grad: "from-purple-500 to-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-700",
      ring: "ring-purple-500/25",
      s: svc.hcc,
      portal: "https://cc.alaapcloud.gov.bd/",
      plans: "Basic (per agent)",
    },
    {
      k: "vbs",
      name: "Voice Broadcast",
      icon: "📢",
      grad: "from-orange-500 to-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
      ring: "ring-orange-500/25",
      s: svc.vbs,
      portal: "https://vbs.alaapcloud.gov.bd/",
      plans: "Basic / Standard / Corporate",
    },
    {
      k: "sms",
      name: "Bulk SMS",
      icon: "💬",
      grad: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      ring: "ring-emerald-500/25",
      s: svc.sms,
      portal: BULK_SMS_PORTAL_URL,
      plans: "Slab-based pricing",
    },
  ];

  // The standing totals, which is what they are: they move by ones over weeks.
  // On the band rather than in six cards of their own, so the services and the
  // review queue below them are what the eye lands on.
  const headline = [
    { label: "Customers", value: customers.toLocaleString(), icon: "👤" },
    {
      label: "Individual",
      value: categoryCounts ? categoryCounts.INDIVIDUAL.toLocaleString() : "—",
      icon: "🧍",
    },
    {
      label: "Corporate",
      value: categoryCounts ? categoryCounts.CORPORATE.toLocaleString() : "—",
      icon: "🏢",
    },
    {
      // Both government forms in one chip: this is a summary, and the split is on the
      // partners list where it can be filtered.
      label: "Government",
      value: categoryCounts
        ? (
            categoryCounts.GOVERNMENT_INDIVIDUAL + categoryCounts.GOVERNMENT_CORPORATE
          ).toLocaleString()
        : "—",
      icon: "🏛️",
    },
    { label: "Active plans", value: totalActive.toLocaleString(), icon: "📋" },
    { label: "Revenue", value: `৳${totalRev.toLocaleString()}`, icon: "💰" },
  ];

  const quickLinks = [
    {
      label: "Manage Partners",
      href: `/${locale}/admin/partners`,
      icon: "👤",
      color: "bg-btcl-primaryLight/10 text-[#0D529E]",
    },
    {
      label: "Sales Reports",
      href: `/${locale}/admin/reports`,
      icon: "📊",
      color: "bg-btcl-primaryLight/10 text-[#0D529E]",
    },
    // Every BTCL portal, so an admin does not have to remember which host and port each
    // one lives on. PBX has three separate entry points — admin, user and the legacy
    // portal — which are easy to confuse from the URL alone.
    {
      label: "Service Portal",
      href: "https://www.alaapcloud.gov.bd",
      icon: "🌐",
      color: "bg-btcl-primaryLight/10 text-[#0D529E]",
      ext: true,
    },
    {
      label: "Alaap PBX Admin",
      href: "https://ippbx.alaapcloud.gov.bd:3001",
      icon: "📞",
      color: "bg-blue-50 text-blue-600",
      ext: true,
    },
    {
      label: "Alaap PBX User",
      href: "https://ippbx.alaapcloud.gov.bd:5174/login",
      icon: "📞",
      color: "bg-blue-50 text-blue-600",
      ext: true,
    },
    {
      label: "Alaap PBX Legacy Portal",
      href: "https://ippbx.alaapcloud.gov.bd",
      icon: "🗄️",
      color: "bg-slate-100 text-slate-600",
      ext: true,
    },
    {
      label: "Contact Center Admin",
      href: "https://cc.alaapcloud.gov.bd:4001/",
      icon: "👥",
      color: "bg-purple-50 text-purple-600",
      ext: true,
    },
    {
      label: "VBS Admin / User",
      href: "https://vbs.alaapcloud.gov.bd/",
      icon: "📢",
      color: "bg-orange-50 text-orange-600",
      ext: true,
    },
    {
      label: "BTCL SMS Portal",
      href: BULK_SMS_PORTAL_URL,
      icon: "💬",
      color: "bg-emerald-50 text-emerald-600",
      ext: true,
    },
    {
      label: "Cateleya CMS",
      href: "https://114.130.145.75:6443/a/login",
      icon: "🛠️",
      color: "bg-rose-50 text-rose-600",
      ext: true,
    },
    {
      label: "Previous dashboard",
      href: `/${locale}/admin/classic`,
      icon: "🕘",
      color: "bg-slate-100 text-slate-600",
    },
    {
      label: "User Dashboard",
      href: `/${locale}/dashboard`,
      icon: "🏠",
      color: "bg-gray-100 text-gray-600",
    },
    {
      label: "Pricing Page",
      href: `/${locale}/pricing`,
      icon: "💳",
      color: "bg-btcl-primaryLight/10 text-btcl-primary",
    },
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* ── Band: who we serve, in one line ───────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0D529E] via-[#1F3C71] to-[#0D529E] p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">BTCL Service Dashboard</h1>
            <p className="mt-0.5 text-xs text-white/60">
              {totalSubs.toLocaleString()} subscription
              {totalSubs === 1 ? "" : "s"} across four services
            </p>
          </div>
          <a
            href="https://www.alaapcloud.gov.bd"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/90 transition hover:bg-white/25"
          >
            Service portal ↗
          </a>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {headline.map((h) => (
            <div key={h.label} className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/60">
                <span>{h.icon}</span>
                {h.label}
              </div>
              <p className="mt-1 text-xl font-extrabold leading-none text-white">{h.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── The four services ─────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {services.map((sv) => {
          // Each service's share of revenue, which the live page leaves the reader
          // to work out from four separate numbers.
          const share = totalRev ? (sv.s.revenue / totalRev) * 100 : 0;
          return (
            <div
              key={sv.k}
              className={`group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 ${sv.ring}`}
            >
              <div className={`flex items-center gap-2.5 bg-gradient-to-br ${sv.grad} px-4 py-3`}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20 text-lg">
                  {sv.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold tracking-tight text-white">{sv.name}</p>
                  <p className="truncate text-[10px] text-white/70">{sv.plans}</p>
                </div>
                <a
                  href={sv.portal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium text-white/90 transition hover:bg-white/30"
                >
                  Portal ↗
                </a>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className={`text-2xl font-extrabold leading-none ${sv.text}`}>
                      ৳{sv.s.revenue.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-400">
                      Revenue
                    </p>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-400">
                    {share.toFixed(0)}% of total
                  </p>
                </div>
                {/* Share of the four, so a quiet service is visible as one. */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-1.5 rounded-full bg-gradient-to-r ${sv.grad}`}
                    style={{ width: `${share}%` }}
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 divide-x divide-gray-100 border-y border-gray-100 py-2.5">
                  <div className="px-1 text-center">
                    <p className="text-lg font-extrabold leading-none text-gray-800">
                      {sv.s.subscribers}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-gray-400">
                      Subscribers
                    </p>
                  </div>
                  <div className="px-1 text-center">
                    <p className="text-lg font-extrabold leading-none text-gray-800">
                      {sv.s.active}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-gray-400">
                      Active plans
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setOpenSvc(sv)}
                  disabled={!sv.s.subscribers}
                  className={`mt-3 w-full rounded-xl py-2.5 text-xs font-semibold ring-1 ring-inset transition ${
                    sv.s.subscribers
                      ? `${sv.bg} ${sv.text} ${sv.border} hover:brightness-[0.97]`
                      : "cursor-not-allowed bg-gray-50 text-gray-400 ring-gray-200"
                  }`}
                >
                  👥 View {sv.s.subscribers} subscriber{sv.s.subscribers === 1 ? "" : "s"} →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── What is waiting, then who is new, then where to go ────────────── */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* The widest column: this is the only one with work in it. */}
        <div className="lg:col-span-2">
          <DocReviewPanel reviews={docReviews} locale={String(locale)} loading={reviewLoading} />
        </div>

        <div className="flex flex-col gap-3">
          {/* Recent Customers */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-btcl-primaryLight/10 text-xs">
                  🆕
                </span>
                Recent customers
              </h2>
              <Link
                href={`/${locale}/admin/partners`}
                className="text-[10px] font-medium text-[#0D529E] hover:underline"
              >
                View All →
              </Link>
            </div>
            <div className="space-y-1">
              {recent.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">No customers yet</p>
              ) : (
                recent.map((p, i) => (
                  <Link
                    key={p.idPartner}
                    href={`/${locale}/admin/partners/${p.idPartner}`}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-gray-50"
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-white ${
                        i % 3 === 0
                          ? "bg-[#0D529E]"
                          : i % 3 === 1
                            ? "bg-blue-500"
                            : "bg-purple-500"
                      }`}
                    >
                      {p.partnerName?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-gray-900">
                        {p.partnerName}
                      </p>
                      <p className="truncate text-[10px] text-gray-400">
                        {p.email || "No email"}
                      </p>
                    </div>
                    <span className="rounded-full bg-btcl-primaryLight/10 px-1.5 py-0.5 text-[9px] font-medium text-[#0D529E]">
                      {getPartnerTypeLabel(p.partnerType)}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex shrink-0 items-center gap-2 text-sm font-bold text-gray-900">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-btcl-primaryLight/10 text-xs">
                🔗
              </span>
              Quick links
            </h2>
            {/* Scrolls: the full portal list is longer than the panel. */}
            <div className="max-h-[320px] flex-1 space-y-1 overflow-y-auto pr-1">
              {quickLinks.map((l) => {
                const cls =
                  "group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50";
                const inner = (
                  <>
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-md text-xs ${l.color}`}
                    >
                      {l.icon}
                    </div>
                    <span className="flex-1 text-sm text-gray-700">{l.label}</span>
                    <span className="text-xs text-gray-300 group-hover:text-[#0D529E]">
                      {l.ext ? "↗" : "→"}
                    </span>
                  </>
                );
                return l.ext ? (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cls}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link key={l.label} href={l.href} className={cls}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* One-click: who uses this service */}
      {openSvc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setOpenSvc(null)}
        >
          <div
            className="flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between bg-gradient-to-br ${openSvc.grad} px-5 py-4`}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 text-xl">
                  {openSvc.icon}
                </span>
                <div>
                  <p className="text-sm font-bold tracking-tight text-white">{openSvc.name}</p>
                  <p className="text-[11px] text-white/75">
                    {openSvc.s.partners.length} subscriber
                    {openSvc.s.partners.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpenSvc(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-xl leading-none text-white/90 transition hover:bg-white/20"
              >
                ×
              </button>
            </div>
            <div className="divide-y divide-gray-50 overflow-y-auto">
              {openSvc.s.partners.map((pt) => (
                <Link
                  key={pt.id}
                  href={`/${locale}/admin/partners/${pt.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-gray-50"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${openSvc.bg} ${openSvc.text}`}
                  >
                    {pt.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {pt.name}{" "}
                      <span className="text-[11px] font-normal text-gray-400">#{pt.id}</span>
                    </p>
                    <p className="truncate text-[11px] text-gray-400">
                      {pt.plan}
                      <span className="sm:hidden"> · {pt.balance}</span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
                      pt.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {pt.status}
                  </span>
                  {/* On a phone the row has no width for a fourth column, so the
                      balance moves under the plan rather than squeezing the name. */}
                  <span className="hidden w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-gray-700 sm:block">
                    {pt.balance}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Doc reviews, with the three states as tabs ─── */
function DocReviewPanel({
  reviews,
  locale,
  loading = false,
}: {
  reviews: DocReviewItem[];
  locale: string;
  loading?: boolean;
}) {
  const [tab, setTab] = useState<"pending" | "rejected" | "approved">("pending");

  const pending = reviews.filter((r) => r.status === "pending");
  const rejected = reviews.filter((r) => r.status === "rejected");
  const approved = reviews.filter((r) => r.status === "approved");

  const tabs = [
    { key: "pending" as const, label: "Pending", count: pending.length, bg: "bg-amber-500" },
    { key: "rejected" as const, label: "Rejected", count: rejected.length, bg: "bg-red-500" },
    { key: "approved" as const, label: "Approved", count: approved.length, bg: "bg-emerald-500" },
  ];

  const current = tab === "pending" ? pending : tab === "rejected" ? rejected : approved;

  const avatarStyle =
    tab === "pending"
      ? "bg-gradient-to-br from-amber-400 to-orange-500"
      : tab === "rejected"
        ? "bg-gradient-to-br from-red-400 to-red-600"
        : "bg-gradient-to-br from-emerald-400 to-emerald-600";

  const hoverStyle =
    tab === "pending"
      ? "hover:bg-amber-50 hover:border-amber-200"
      : tab === "rejected"
        ? "hover:bg-red-50 hover:border-red-200"
        : "hover:bg-emerald-50 hover:border-emerald-200";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-amber-50 text-xs">📄</span>
          Documents to review
        </h2>
        <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
          {loading && (
            <span className="block h-3 w-3 rounded-full border-2 border-[#0D529E]/20 border-t-[#0D529E] animate-spin" />
          )}
          {current.length} partner{current.length !== 1 ? "s" : ""}
          {loading ? " so far" : " loaded"}
        </span>
      </div>

      <div className="mb-3 flex shrink-0 items-center gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
              tab === t.key
                ? `${t.bg} text-white shadow-sm`
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            {t.label}
            <span
              className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                tab === t.key ? "bg-white/25 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Two columns where there is room: this list is the longest on the page. */}
      <div className="grid max-h-[380px] flex-1 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
        {current.length === 0 ? (
          <p className="col-span-full py-8 text-center text-xs text-gray-400">
            {loading
              ? "Loading reviews…"
              : tab === "pending"
                ? "No pending reviews"
                : tab === "rejected"
                  ? "No rejected docs"
                  : "No approved partners yet"}
          </p>
        ) : (
          current.map((r) => (
            <Link
              key={r.id}
              href={`/${locale}/admin/partners/${r.id}`}
              className={`group flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all ${hoverStyle}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white ${avatarStyle}`}
              >
                {r.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-gray-900">{r.name}</p>
                <p className="truncate text-[10px] text-gray-400">{r.detail}</p>
              </div>
              <span className="shrink-0 text-xs text-gray-300 group-hover:text-gray-500">→</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
