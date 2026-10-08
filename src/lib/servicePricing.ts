/**
 * Slab pricing for Voice Broadcasting and Bulk SMS.
 *
 * Admins edit the slabs at /admin/pricing; TelcoREST stores them in tenant_master and
 * PaymentGateWay refuses any purchase whose amounts differ from what these functions give.
 * So the arithmetic here must match PaymentGateWay's SlabPricingValidator exactly:
 *
 *   price = ceil(qty × rate)      VAT = ceil(price × 15 / 100)      total = price + VAT
 *
 * It is done in whole numbers. In floating point 100 × 0.28 is 28.000000000000004, which
 * ceil() turned into 29, so customers were charged a taka too much.
 */

export type PricedService = 'vbs' | 'sms';

export interface PricingSlab {
  nameEn: string;
  nameBn: string;
  minQty: number;
  /** Inclusive upper bound; null means open-ended ("50,001+"). */
  maxQty: number | null;
  /** BDT per message before VAT, at most four decimals. */
  rate: number;
  /** Package in the service's own database that a purchase in this slab is recorded against. */
  packageId: number;
  conditionsApply: boolean;
}

export interface PricingLimits {
  /** Smallest total, VAT included. */
  minTotal: number;
  /** Largest total, VAT included; null means no limit. */
  maxTotal: number | null;
  /** Largest message count per purchase; null means no limit. */
  maxQuantity: number | null;
}

export interface ServicePricing {
  service: PricedService;
  limits: PricingLimits;
  slabs: PricingSlab[];
  updatedAt: string | null;
  /** Only filled in for administrators. */
  updatedBy: string | null;
}

export type ServicePricingMap = Partial<Record<PricedService, ServicePricing>>;

export const VAT_PERCENT = 15;
const RATE_SCALE = 10000;

/** Rate as a whole number of 1/10000 taka, so no float error reaches the ceiling. */
const rateUnits = (rate: number) => Math.round(rate * RATE_SCALE);

export const findSlab = (slabs: PricingSlab[], qty: number): PricingSlab | null =>
  slabs.find((s) => qty >= s.minQty && (s.maxQty === null || qty <= s.maxQty)) ?? null;

export interface Quote {
  slab: PricingSlab | null;
  price: number;
  vat: number;
  total: number;
  /** No slab covers this quantity. */
  noSlab: boolean;
  underMin: boolean;
  overMaxTotal: boolean;
  overMaxQuantity: boolean;
  /** True when the quantity may be bought as it stands. */
  ok: boolean;
}

export const priceFor = (qty: number, rate: number) => Math.ceil((qty * rateUnits(rate)) / RATE_SCALE);

export const vatFor = (price: number) => Math.ceil((price * VAT_PERCENT) / 100);

export const quote = (pricing: ServicePricing, qty: number): Quote => {
  const slab = qty >= 1 ? findSlab(pricing.slabs, qty) : null;
  const price = slab ? priceFor(qty, slab.rate) : 0;
  const vat = vatFor(price);
  const total = price + vat;
  const { minTotal, maxTotal, maxQuantity } = pricing.limits;
  const noSlab = qty >= 1 && !slab;
  const underMin = !!slab && total < minTotal;
  const overMaxTotal = !!slab && maxTotal !== null && total > maxTotal;
  const overMaxQuantity = maxQuantity !== null && qty > maxQuantity;
  return {
    slab,
    price,
    vat,
    total,
    noSlab,
    underMin,
    overMaxTotal,
    overMaxQuantity,
    ok: !!slab && !underMin && !overMaxTotal && !overMaxQuantity,
  };
};

/** Lowest rate across the slabs, for "Starting from" lines. */
export const lowestRate = (pricing: ServicePricing | undefined): number | null =>
  pricing && pricing.slabs.length ? Math.min(...pricing.slabs.map((s) => s.rate)) : null;

/** The largest quantity that can be bought, if there is one. */
export const maxBuyableQuantity = (pricing: ServicePricing): number | null => {
  const last = pricing.slabs[pricing.slabs.length - 1];
  const caps = [pricing.limits.maxQuantity, last?.maxQty ?? null].filter(
    (v): v is number => v !== null
  );
  return caps.length ? Math.min(...caps) : null;
};

export const slabName = (slab: PricingSlab, locale: string) =>
  locale === 'en' ? slab.nameEn : slab.nameBn || slab.nameEn;

export const formatRange = (slab: PricingSlab) =>
  slab.maxQty === null
    ? `${slab.minQty.toLocaleString()}+`
    : `${slab.minQty.toLocaleString()} – ${slab.maxQty.toLocaleString()}`;

/**
 * Same checks TelcoREST runs on save (ServicePricingRules), so the admin page can point at the
 * field before the request is sent. The server's answer is still the one that counts.
 */
export const firstProblem = (limits: PricingLimits, slabs: PricingSlab[]): string | null => {
  if (!Number.isFinite(limits.minTotal) || limits.minTotal < 0) return 'Minimum total must be zero or more';
  if (limits.maxTotal !== null && limits.maxTotal < limits.minTotal)
    return 'Maximum total cannot be below the minimum total';
  if (!slabs.length) return 'At least one slab is required';
  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    const label = `Slab ${i + 1}`;
    if (!s.nameEn.trim()) return `${label}: the English name is required`;
    if (!s.nameBn.trim()) return `${label}: the Bangla name is required`;
    if (s.nameEn.trim().length > 100 || s.nameBn.trim().length > 100)
      return `${label}: names can be at most 100 characters`;
    if (!Number.isInteger(s.minQty)) return `${label}: the starting message count is required`;
    if (i === 0 && s.minQty !== 1) return `${label} must start at 1 message`;
    if (i > 0) {
      const prevMax = slabs[i - 1].maxQty;
      if (prevMax === null) return `Slab ${i} has no upper limit, so only the last slab can be open-ended`;
      if (s.minQty !== prevMax + 1)
        return `${label} must start at ${prevMax + 1}, right after the previous slab, with no gap or overlap`;
    }
    if (s.maxQty !== null && (!Number.isInteger(s.maxQty) || s.maxQty < s.minQty))
      return `${label}: the upper limit cannot be below the starting count`;
    if (!Number.isFinite(s.rate) || s.rate <= 0) return `${label}: the rate must be greater than 0`;
    if (s.rate > 100) return `${label}: the rate cannot be more than ৳100 per message`;
    if (Math.abs(s.rate * RATE_SCALE - Math.round(s.rate * RATE_SCALE)) > 1e-6)
      return `${label}: the rate can have at most 4 decimal places`;
    if (!Number.isInteger(s.packageId) || s.packageId <= 0) return `${label}: a package ID is required`;
  }
  const last = slabs[slabs.length - 1];
  if (limits.maxQuantity !== null && limits.maxQuantity < last.minQty)
    return 'Maximum messages per purchase cannot be below where the last slab starts';
  return null;
};

/** "0.40", "0.325", "0.3250" → at least two decimals, up to four, never rounded away. */
export const formatRate = (rate: number) =>
  rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
