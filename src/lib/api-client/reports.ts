import axios from 'axios';
import {
  API_BASE_URL,
  API_ENDPOINTS,
  BULK_SMS_BASE_URL,
  HCC_BASE_URL,
  PBX_BASE_URL,
  VBS_BASE_URL,
} from '@/config/api';

/**
 * Sales reporting across every BTCL service backend.
 *
 * Each service (main, Hosted PBX, Call Center, Voice Broadcast, Bulk SMS) is a separate
 * deployment with its own database and its own `packagepurchase` table — there is no single
 * place to query. So, exactly as the partner Purchases tab does, this fans out to all of them
 * and merges the results client-side.
 *
 * That is viable because the volumes are small (tens of rows per service, not millions). If
 * sales ever grow into the tens of thousands, this should move to a server-side aggregate with
 * real date filtering — `/package/get-all-purchase` applies its filters *after* pagination, so
 * it cannot do the job today.
 *
 * A partial failure is reported rather than hidden. A sales figure that silently omits a
 * service because its backend was down would be worse than no figure at all.
 */

/** One service backend to collect sales from. */
interface SalesSource {
  url: string;
  /** Stable key used in CSV output and grouping. */
  key: string;
  /** What an admin calls this service. */
  label: string;
}

const SALES_SOURCES: SalesSource[] = [
  { url: API_BASE_URL, key: 'main', label: 'Main Services' },
  { url: PBX_BASE_URL, key: 'pbx', label: 'Hosted PBX' },
  { url: HCC_BASE_URL, key: 'hcc', label: 'Call Center' },
  { url: VBS_BASE_URL, key: 'vbs', label: 'Voice Broadcast' },
  { url: BULK_SMS_BASE_URL, key: 'sms', label: 'Bulk SMS' },
];

export interface SaleRecord {
  /** Unique across services — service ids collide because each has its own sequence. */
  uid: string;
  service: string;
  serviceLabel: string;
  purchaseDate: string;
  partnerName: string;
  packageName: string;
  price: number;
  vat: number;
  ait: number;
  total: number;
  status: string;
}

export interface SalesFetchResult {
  sales: SaleRecord[];
  /** Services that answered. */
  succeeded: string[];
  /** Services that did not, with the reason — surfaced in the UI as a warning. */
  failed: { label: string; reason: string }[];
}

interface RawPurchase {
  id?: number;
  purchaseDate?: string;
  partnerName?: string | null;
  packageName?: string | null;
  price?: number | null;
  vat?: number | null;
  ait?: number | null;
  total?: number | null;
  status?: string | null;
}

const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'string' ? parseFloat(value) : (value as number);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Pull every purchase from one backend.
 *
 * A large page size is requested deliberately: `/package/get-all-purchase` filters after
 * paginating, so asking for everything and filtering here is the only way to get a correct
 * result set out of it.
 */
const fetchFromSource = async (
  source: SalesSource,
  authToken: string
): Promise<SaleRecord[]> => {
  const response = await axios.post(
    `${source.url}${API_ENDPOINTS.package.getAllPurchase}`,
    { page: 0, size: 100000 },
    {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      timeout: 30000,
    }
  );

  const body = response.data;
  const rows: RawPurchase[] = Array.isArray(body)
    ? body
    : Array.isArray(body?.content)
      ? body.content
      : [];

  return rows
    .filter((row) => row && row.purchaseDate)
    .map((row) => {
      const price = toNumber(row.price);
      const vat = toNumber(row.vat);
      const ait = toNumber(row.ait);
      return {
        uid: `${source.key}:${row.id ?? Math.random().toString(36).slice(2)}`,
        service: source.key,
        serviceLabel: source.label,
        purchaseDate: row.purchaseDate as string,
        partnerName: row.partnerName || 'Unknown',
        packageName: row.packageName || '—',
        price,
        vat,
        ait,
        // Prefer the stored total; fall back to the components rather than inventing
        // discount arithmetic that finance might not agree with.
        total: row.total != null ? toNumber(row.total) : price + vat + ait,
        status: row.status || '—',
      };
    });
};

/** Collect sales from every backend concurrently, keeping partial results usable. */
export const getAllSales = async (authToken: string): Promise<SalesFetchResult> => {
  const settled = await Promise.allSettled(
    SALES_SOURCES.map((source) => fetchFromSource(source, authToken))
  );

  const sales: SaleRecord[] = [];
  const succeeded: string[] = [];
  const failed: { label: string; reason: string }[] = [];

  settled.forEach((result, index) => {
    const source = SALES_SOURCES[index];
    if (result.status === 'fulfilled') {
      succeeded.push(source.label);
      sales.push(...result.value);
    } else {
      const error = result.reason;
      const reason = axios.isAxiosError(error)
        ? error.response
          ? `HTTP ${error.response.status}`
          : error.code === 'ECONNABORTED'
            ? 'timed out'
            : 'unreachable'
        : 'failed';
      failed.push({ label: source.label, reason });
      console.error(`❌ Sales fetch failed for ${source.label}:`, error);
    }
  });

  // Newest first, which is what an admin opening a report expects to see.
  sales.sort(
    (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
  );

  return { sales, succeeded, failed };
};

// ---------------------------------------------------------------- grouping

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface PeriodGroup {
  key: string;
  label: string;
  count: number;
  price: number;
  vat: number;
  ait: number;
  total: number;
}

const startOfWeek = (date: Date): Date => {
  const copy = new Date(date);
  // Monday-based week, matching how BTCL reports business weeks.
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/** Bucket key + human label for a sale under the chosen period. */
export const periodKeyFor = (
  dateInput: string,
  period: ReportPeriod
): { key: string; label: string } => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return { key: 'unknown', label: 'Unknown date' };
  }

  if (period === 'daily') {
    const key = date.toLocaleDateString('en-CA'); // YYYY-MM-DD, locale-stable
    return { key, label: key };
  }

  if (period === 'weekly') {
    const start = startOfWeek(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const key = start.toLocaleDateString('en-CA');
    return {
      key,
      label: `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString(
        'en-GB',
        { day: '2-digit', month: 'short', year: 'numeric' }
      )}`,
    };
  }

  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  return {
    key,
    label: date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
  };
};

export const groupSalesByPeriod = (
  sales: SaleRecord[],
  period: ReportPeriod
): PeriodGroup[] => {
  const buckets = new Map<string, PeriodGroup>();

  sales.forEach((sale) => {
    const { key, label } = periodKeyFor(sale.purchaseDate, period);
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      existing.price += sale.price;
      existing.vat += sale.vat;
      existing.ait += sale.ait;
      existing.total += sale.total;
    } else {
      buckets.set(key, {
        key,
        label,
        count: 1,
        price: sale.price,
        vat: sale.vat,
        ait: sale.ait,
        total: sale.total,
      });
    }
  });

  return Array.from(buckets.values()).sort((a, b) => b.key.localeCompare(a.key));
};

/** Totals per service, for the "which service earns what" breakdown. */
export const groupSalesByService = (sales: SaleRecord[]) => {
  const buckets = new Map<string, { label: string; count: number; total: number }>();
  sales.forEach((sale) => {
    const existing = buckets.get(sale.service);
    if (existing) {
      existing.count += 1;
      existing.total += sale.total;
    } else {
      buckets.set(sale.service, { label: sale.serviceLabel, count: 1, total: sale.total });
    }
  });
  return Array.from(buckets.values()).sort((a, b) => b.total - a.total);
};

// -------------------------------------------------------------------- CSV

const csvCell = (value: string | number): string => {
  const text = String(value ?? '');
  // Quote when the value could otherwise break the row, and double any embedded quotes.
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * Build the CSV an admin downloads.
 *
 * Columns follow the requested SL, Date, Price, Client Name, Service Name, plus the package
 * and the tax components — a sales figure quoted without VAT and AIT is not something finance
 * can reconcile against an invoice.
 */
export const buildSalesCsv = (sales: SaleRecord[]): string => {
  const header = [
    'SL',
    'Date',
    'Client Name',
    'Service Name',
    'Package',
    'Price (BDT)',
    'VAT (BDT)',
    'AIT (BDT)',
    'Total (BDT)',
    'Status',
  ];

  const rows = sales.map((sale, index) => {
    const date = new Date(sale.purchaseDate);
    const printedDate = Number.isNaN(date.getTime())
      ? sale.purchaseDate
      : date.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

    return [
      index + 1,
      printedDate,
      sale.partnerName,
      sale.serviceLabel,
      sale.packageName,
      sale.price.toFixed(2),
      sale.vat.toFixed(2),
      sale.ait.toFixed(2),
      sale.total.toFixed(2),
      sale.status,
    ]
      .map(csvCell)
      .join(',');
  });

  return [header.map(csvCell).join(','), ...rows].join('\r\n');
};

/** Trigger a browser download. The BOM makes Excel read UTF-8 (and Bangla names) correctly. */
export const downloadCsv = (csv: string, filename: string): void => {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
