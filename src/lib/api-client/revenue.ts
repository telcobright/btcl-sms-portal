import axios from 'axios';
import { PAYMENT_BASE_URL } from '@/config/api';

/**
 * SSLCommerz recharge records for the BTCL Revenue Office.
 *
 * Served by the PaymentGateWay service, which owns payment_transactions — not by this
 * portal's Prisma database. The portal's own /api/payment/* routes are a receipt screen:
 * they persist nothing and never call SSLCommerz validation, so no figure in a revenue
 * report may originate there. Only rows the IPN wrote after val_id validation count.
 */

/** Money is only counted once the gateway settled it. COMPLETED is the settled state here. */
export const SETTLED_STATUSES = ['COMPLETED', 'SUCCESS', 'VALID', 'VALIDATED'] as const;

/** Statuses production actually writes, in the order the filter should offer them. */
export const STATUS_OPTIONS = [
  { value: 'COMPLETED', label: 'Success' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'EXPIRED', label: 'Expired' },
] as const;

/**
 * Service filter values are store_type, not the display name, so renaming a service
 * never breaks a saved filter or a bookmarked report URL.
 */
export const SERVICE_OPTIONS = [
  { value: 'pbx', label: 'Hosted IP PBX' },
  { value: 'vbs', label: 'Voice Broadcasting' },
  { value: 'cc', label: 'Hosted Contact Center' },
  { value: 'sms', label: 'A2P SMS' },
  { value: 'wifi', label: 'WiFi' },
] as const;

export interface RevenueTransaction {
  storeId: string | null;
  serviceName: string | null;
  storeType: string | null;
  transactionId: string | null;
  orderId: string | null;
  bankTranId: string | null;
  /** UTC, no offset. Render with formatBst below. */
  createdAt: string | null;
  paymentCompletedAt: string | null;
  amount: string | null;
  storeAmount: string | null;
  currency: string | null;
  status: string | null;
  subscriberName: string | null;
  subscriberMobile: string | null;
  subscriberEmail: string | null;
  idPartner: number | null;
  idPackage: number | null;
}

export interface RevenuePage {
  data: RevenueTransaction[];
  totalItems: number;
  page: number;
  size: number;
  totalPages: number;
  /** Sum over the whole filtered set, settled rows only — not just this page. */
  settledAmount: string | null;
  settledCount: number;
}

export interface RevenueFilters {
  from?: string;
  to?: string;
  storeId?: string;
  /** store_type values, comma-joined by the caller */
  service?: string;
  status?: string;
  idPartner?: number;
  q?: string;
  page?: number;
  size?: number;
}

const toParams = (f: RevenueFilters) => {
  const p = new URLSearchParams();
  if (f.from) p.set('from', f.from);
  if (f.to) p.set('to', f.to);
  if (f.storeId) p.set('storeId', f.storeId);
  if (f.service) p.set('service_', f.service);
  if (f.status) p.set('status', f.status);
  if (f.idPartner != null) p.set('idPartner', String(f.idPartner));
  if (f.q) p.set('q', f.q);
  if (f.page != null) p.set('page', String(f.page));
  if (f.size != null) p.set('size', String(f.size));
  return p;
};

export const getRevenueTransactions = async (
  filters: RevenueFilters,
  authToken?: string
): Promise<RevenuePage> => {
  const { data } = await axios.get(
    `${PAYMENT_BASE_URL}/api/payment/revenue/transactions?${toParams(filters).toString()}`,
    authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : undefined
  );
  return data;
};

/**
 * URL for the CSV export.
 *
 * Built from the same filters as the table so the file always matches what is on
 * screen — the auditor's first question is why the total differs from the export.
 */
export const revenueExportUrl = (filters: RevenueFilters): string =>
  `${PAYMENT_BASE_URL}/api/payment/revenue/export?${toParams(filters).toString()}`;

/**
 * Render a UTC timestamp in Bangladesh Standard Time.
 *
 * The API sends a bare local-date-time with no offset, so Date would parse it in the
 * viewer's own zone. Shifting by a fixed +6 is correct for BST, which has no DST.
 */
export const formatBst = (utc: string | null): string => {
  if (!utc) return '—';
  const d = new Date(`${utc.replace(' ', 'T')}Z`);
  if (Number.isNaN(d.getTime())) return utc;
  const b = new Date(d.getTime() + 6 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(b.getUTCDate())}/${p(b.getUTCMonth() + 1)}/${b.getUTCFullYear()} `
       + `${p(b.getUTCHours())}:${p(b.getUTCMinutes())}:${p(b.getUTCSeconds())}`;
};

export const isSettled = (status: string | null): boolean =>
  !!status && (SETTLED_STATUSES as readonly string[]).includes(status);
