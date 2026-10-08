import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import type {
  PricedService,
  PricingLimits,
  PricingSlab,
  ServicePricing,
  ServicePricingMap,
} from '@/lib/servicePricing';

/**
 * Voice Broadcasting / Bulk SMS slab pricing (TelcoREST, tenant_master).
 * See src/lib/servicePricing.ts for the shapes and the price arithmetic.
 */

type RawSlab = Omit<PricingSlab, 'rate'> & { rate: number | string };
type RawPricing = Omit<ServicePricing, 'slabs' | 'limits'> & {
  slabs: RawSlab[];
  limits: { minTotal: number | string; maxTotal: number | string | null; maxQuantity: number | null };
};

const num = (v: number | string) => (typeof v === 'number' ? v : Number(v));

/** BigDecimals may arrive as strings; everything past here works in numbers. */
const normalise = (raw: Record<string, RawPricing>): ServicePricingMap => {
  const out: ServicePricingMap = {};
  for (const [key, p] of Object.entries(raw ?? {})) {
    if (key !== 'vbs' && key !== 'sms') continue;
    out[key] = {
      ...p,
      service: key,
      limits: {
        minTotal: num(p.limits.minTotal),
        maxTotal: p.limits.maxTotal === null ? null : num(p.limits.maxTotal),
        maxQuantity: p.limits.maxQuantity,
      },
      slabs: p.slabs.map((s) => ({ ...s, rate: num(s.rate) })),
    };
  }
  return out;
};

const authHeaders = (authToken: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${authToken}`,
});

/** Public: current slabs and limits of every service. */
export const getServicePricing = async (): Promise<ServicePricingMap> => {
  const response = await axios.post<Record<string, RawPricing>>(
    `${API_BASE_URL}${API_ENDPOINTS.servicePricing.get}`,
    {},
    { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
  );
  return normalise(response.data);
};

/** Admin: the same, plus who last changed each service. */
export const getServicePricingForAdmin = async (authToken: string): Promise<ServicePricingMap> => {
  const response = await axios.post<Record<string, RawPricing>>(
    `${API_BASE_URL}${API_ENDPOINTS.servicePricing.adminDetails}`,
    {},
    { headers: authHeaders(authToken) }
  );
  return normalise(response.data);
};

/** Admin: replace one service's limits and slabs. Returns every service, freshly read. */
export const updateServicePricing = async (
  service: PricedService,
  limits: PricingLimits,
  slabs: PricingSlab[],
  authToken: string
): Promise<ServicePricingMap> => {
  const response = await axios.post<Record<string, RawPricing>>(
    `${API_BASE_URL}${API_ENDPOINTS.servicePricing.update}`,
    { service, limits, slabs },
    { headers: authHeaders(authToken) }
  );
  return normalise(response.data);
};

/** The server's reason when it refuses, or a fallback. */
export const servicePricingErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (error.response?.status === 403) return 'Only an administrator can change service pricing.';
    if (data?.message) return data.message;
  }
  return fallback;
};

const STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

/**
 * Why loading the prices failed, with the HTTP status, e.g. "HTTP 403 Forbidden" or
 * "HTTP 500 Internal Server Error: Table 'tenant_master.service_pricing' doesn't exist".
 * Shown to the customer so a support call can say exactly what went wrong.
 */
export const describeServicePricingError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const res = error.response;
    if (!res) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'Request timed out';
      return 'Network error: no response from the server';
    }
    // HTTP/2 responses carry no status text, so fall back to the standard reason phrase.
    const reason = res.statusText || STATUS_TEXT[res.status] || '';
    const data = res.data as { message?: unknown; error?: unknown; errorCode?: unknown } | string | undefined;
    let detail = '';
    if (data && typeof data === 'object') {
      const m = data.message ?? data.error;
      if (typeof m === 'string') detail = m;
    } else if (typeof data === 'string' && data.trim() && !data.trimStart().startsWith('<')) {
      detail = data.trim().slice(0, 200);
    }
    return `HTTP ${res.status}${reason ? ` ${reason}` : ''}${detail ? `: ${detail}` : ''}`;
  }
  return error instanceof Error ? error.message : 'Unknown error';
};
