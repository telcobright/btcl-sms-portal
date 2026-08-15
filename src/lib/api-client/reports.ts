import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

/**
 * Sales reporting across every BTCL service.
 *
 * This originally fanned out from the browser to all five service gateways. That could never
 * work: each service is a separate deployment with its own AUTHENTICATION service and JWT
 * signing key, so an admin's token is only valid on the tenant that issued it. The other four
 * answered HTTP 500 and the report showed roughly a quarter of actual revenue.
 *
 * It now calls a single endpoint on the main backend, which reads each service's database
 * directly. That removes the cross-tenant token problem and moves date filtering and the
 * partner/package joins into SQL.
 *
 * Per-source status is still surfaced: if one service's database cannot be read, the UI has to
 * say so. A revenue total that silently omits a service is worse than an error, because
 * somebody will reconcile against it.
 */

export interface SaleRecord {
  /** Unique across services — per-database ids collide. */
  uid: string;
  service: string;
  serviceLabel: string;
  purchaseDate: string;
  idPartner?: number;
  partnerName: string;
  /** INDIVIDUAL | CORPORATE | GOVERNMENT_INDIVIDUAL | GOVERNMENT_CORPORATE, or null. */
  customerCategory: string | null;
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

interface SalesReportApiResponse {
  sales?: {
    uid?: string;
    service?: string;
    serviceLabel?: string;
    idPartner?: number;
    partnerName?: string | null;
    customerCategory?: string | null;
    packageName?: string | null;
    purchaseDate?: string;
    price?: number | string | null;
    vat?: number | string | null;
    ait?: number | string | null;
    total?: number | string | null;
    status?: string | null;
  }[];
  sources?: { key?: string; label?: string; ok?: boolean; count?: number; error?: string }[];
  complete?: boolean;
}

const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'string' ? parseFloat(value) : (value as number);
  return Number.isFinite(parsed) ? parsed : 0;
};

export interface SalesQuery {
  fromDate?: string;
  toDate?: string;
  idPartner?: number;
}

/** Fetch merged sales from every service database. */
export const getAllSales = async (
  authToken: string,
  query: SalesQuery = {}
): Promise<SalesFetchResult> => {
  const response = await axios.post<SalesReportApiResponse>(
    `${API_BASE_URL}${API_ENDPOINTS.reports.sales}`,
    query,
    {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      timeout: 60000,
    }
  );

  const body = response.data ?? {};

  const sales: SaleRecord[] = (body.sales ?? [])
    .filter((row) => row && row.purchaseDate)
    .map((row) => {
      const price = toNumber(row.price);
      const vat = toNumber(row.vat);
      const ait = toNumber(row.ait);
      return {
        uid: row.uid || `${row.service}:${row.purchaseDate}`,
        service: row.service || 'unknown',
        serviceLabel: row.serviceLabel || 'Unknown service',
        purchaseDate: row.purchaseDate as string,
        idPartner: row.idPartner,
        partnerName: row.partnerName || 'Unknown',
        customerCategory: row.customerCategory ?? null,
        packageName: row.packageName || '—',
        price,
        vat,
        ait,
        total: row.total != null ? toNumber(row.total) : price + vat + ait,
        status: row.status || '—',
      };
    });

  const succeeded = (body.sources ?? []).filter((s) => s.ok).map((s) => s.label || s.key || '');
  const failed = (body.sources ?? [])
    .filter((s) => !s.ok)
    .map((s) => ({
      label: s.label || s.key || 'Unknown service',
      reason: s.error || 'unreadable',
    }));

  return { sales, succeeded, failed };
};

// ---------------------------------------------------------------- grouping

/** How a customer category reads in the report and its CSV. */
export const customerTypeLabel = (category: string | null | undefined): string => {
  switch (category) {
    case 'INDIVIDUAL':
      return 'Private - Individual';
    case 'CORPORATE':
      return 'Private - Corporate';
    case 'GOVERNMENT_INDIVIDUAL':
      return 'Government - Individual';
    // Pre-split value: government customers were assumed to be organisations.
    case 'GOVERNMENT_CORPORATE':
    case 'GOVERNMENT':
      return 'Government - Corporate';
    default:
      return 'Unclassified';
  }
};

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

// ------------------------------------------------- package sales matrix

/**
 * True when a sale is a genuine service-package purchase.
 *
 * The BTCL daily report counts package sales only — Hosted PBX, A2P SMS, VBS and
 * Contact Center plans — so top-ups and free welcome bonuses are excluded. They are
 * recognisable only by package name: TopUp rows are balance loads, "Welcome Talktime"
 * is a zero-price signup bonus, and anything with "credit" is an internal ledger row
 * (Postpaid_Credit is already excluded server-side; the pattern here is belt and
 * braces).
 */
export const isPackageSale = (sale: SaleRecord): boolean =>
  !/top\s*[-_]?\s*up|welcome|credit/i.test(sale.packageName);

/** Service columns of the BTCL daily report, in its column order. */
export const PACKAGE_MATRIX_SERVICES = [
  { key: 'pbx', label: 'IPPBX' },
  { key: 'sms', label: 'A2P SMS' },
  { key: 'vbs', label: 'VBS' },
  { key: 'hcc', label: 'CC' },
] as const;

export interface PackageMatrixRow {
  /** ISO key for sorting, e.g. 2026-07-01. */
  key: string;
  /** As printed on the report: DD-MM-YYYY. */
  label: string;
  /** Distinct purchasing customers per service key. */
  customers: Record<string, number>;
  customersAll: number;
  /** Revenue (price + VAT + AIT) per service key. */
  revenue: Record<string, number>;
  revenueAll: number;
}

const isoDay = (dateInput: string): string | null => {
  const date = new Date(dateInput);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('en-CA');
};

const printDay = (isoKey: string): string => {
  const [year, month, day] = isoKey.split('-');
  return `${day}-${month}-${year}`;
};

/**
 * The BTCL daily matrix: one row per date, customer counts and revenue per service.
 *
 * With a From/To range set, every date in the range gets a row — the printed report is
 * a continuous run of dates, empty days included. With no range, only dates that have
 * at least one sale appear, since eight months of mostly-empty rows helps nobody.
 *
 * "All" is the row sum across the four service columns, so the table adds up the way a
 * reader checks it. For customers that means someone buying on two services the same
 * day counts once per service; distinct-across-services would make All disagree with
 * the columns beside it.
 */
export const buildPackageMatrix = (
  sales: SaleRecord[],
  fromDate?: string,
  toDate?: string
): PackageMatrixRow[] => {
  const serviceKeys = new Set<string>(PACKAGE_MATRIX_SERVICES.map((s) => s.key));

  // day -> service -> { partners, revenue }
  const byDay = new Map<string, Map<string, { partners: Set<string>; revenue: number }>>();
  sales.forEach((sale) => {
    if (!serviceKeys.has(sale.service)) return;
    const day = isoDay(sale.purchaseDate);
    if (!day) return;
    let services = byDay.get(day);
    if (!services) {
      services = new Map();
      byDay.set(day, services);
    }
    let cell = services.get(sale.service);
    if (!cell) {
      cell = { partners: new Set(), revenue: 0 };
      services.set(sale.service, cell);
    }
    cell.partners.add(String(sale.idPartner ?? sale.partnerName));
    cell.revenue += sale.total;
  });

  let days: string[];
  if (fromDate && toDate && fromDate <= toDate) {
    days = [];
    const cursor = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T00:00:00`);
    // Hard stop at ~5 years of rows so a typoed year cannot hang the browser.
    while (cursor <= end && days.length < 1830) {
      days.push(cursor.toLocaleDateString('en-CA'));
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    days = Array.from(byDay.keys()).sort();
  }

  return days.map((day) => {
    const services = byDay.get(day);
    const customers: Record<string, number> = {};
    const revenue: Record<string, number> = {};
    let customersAll = 0;
    let revenueAll = 0;
    PACKAGE_MATRIX_SERVICES.forEach(({ key }) => {
      const cell = services?.get(key);
      customers[key] = cell ? cell.partners.size : 0;
      revenue[key] = cell ? cell.revenue : 0;
      customersAll += customers[key];
      revenueAll += revenue[key];
    });
    return { key: day, label: printDay(day), customers, customersAll, revenue, revenueAll };
  });
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
    'Customer Type',
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
      customerTypeLabel(sale.customerCategory),
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

/**
 * CSV in the BTCL daily-report layout: a Date column, then customer counts per service,
 * then revenue per service. CSV has no merged cells, so the two group titles sit on
 * their own line above the service names — Excel renders it the way the printed form
 * reads.
 */
export const buildPackageMatrixCsv = (rows: PackageMatrixRow[]): string => {
  const services = PACKAGE_MATRIX_SERVICES;
  const groupLine = [
    'Date',
    'Total Number Of Customer',
    ...Array(services.length).fill(''),
    'Total Revenue',
    ...Array(services.length).fill(''),
  ];
  const headerLine = [
    '',
    ...services.map((s) => s.label),
    'All',
    ...services.map((s) => s.label),
    'All',
  ];
  const dataLines = rows.map((row) => [
    row.label,
    ...services.map((s) => String(row.customers[s.key])),
    String(row.customersAll),
    ...services.map((s) => row.revenue[s.key].toFixed(2)),
    row.revenueAll.toFixed(2),
  ]);
  return [groupLine, headerLine, ...dataLines]
    .map((line) => line.map(csvCell).join(','))
    .join('\r\n');
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
