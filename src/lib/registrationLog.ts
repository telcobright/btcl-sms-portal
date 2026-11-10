import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { extractApiError } from '@/lib/api-error';

/**
 * Reports each step of a self-service registration to the admin Registration Log, so BTCL can
 * see whether someone registered and, if not, where they stopped and why.
 *
 * One attempt is one journey, identified by an id kept in sessionStorage: it survives a page
 * refresh in the same tab, and a fresh one starts after a successful registration or "start
 * over". The same id goes with the final submit, so the server's own record of it joins up.
 *
 * Reporting is fire-and-forget. It never throws, never delays the page, and a failure to report
 * is invisible to the applicant. Never pass OTPs, passwords or tokens — the server drops such
 * keys anyway — and pass documents only as type and size.
 */

const STORAGE_KEY = 'btcl.registrationJourneyId';

export type RegistrationEvent =
  | 'PAGE_OPENED'
  | 'FORM_INVALID'
  | 'VALIDATE'
  | 'EMAIL_OTP_SEND'
  | 'EMAIL_OTP_VERIFY'
  | 'PHONE_OTP_SEND'
  | 'PHONE_OTP_VERIFY'
  | 'OTP_RESEND'
  | 'NID_OCR'
  | 'NID_DUPLICATE'
  | 'NID_VERIFY'
  | 'STEP_REACHED'
  | 'DOCUMENT_TOO_LARGE'
  | 'SUBMIT'
  | 'REGISTER'
  | 'AUTO_LOGIN'
  | 'START_OVER'
  | 'CLIENT_ERROR';

export interface RegistrationEventOptions {
  step?: number;
  outcome?: 'OK' | 'FAIL' | 'INFO';
  message?: string | null;
  httpStatus?: number | null;
  /** email, phone, companyName, fullName, category and nid identify the applicant; anything else is shown as detail. */
  data?: Record<string, unknown>;
}

let memoryId: string | null = null;

const newId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  // RFC 4122 v4 from Math.random — only for browsers without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

/** This tab's current registration attempt, made on first use. */
export function registrationJourneyId(): string {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const id = newId();
    sessionStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // Storage blocked (private mode): keep the id for this page load only.
    memoryId = memoryId ?? newId();
    return memoryId;
  }
}

/** End this attempt; the next report starts a new one. */
export function endRegistrationJourney(): void {
  memoryId = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}

/** Report one step. Never throws and never waits. */
export function logRegistration(event: RegistrationEvent, options: RegistrationEventOptions = {}): void {
  try {
    const body = JSON.stringify({
      journeyId: registrationJourneyId(),
      event,
      step: options.step,
      outcome: options.outcome ?? 'INFO',
      message: options.message ? String(options.message).slice(0, 1000) : undefined,
      httpStatus: options.httpStatus ?? undefined,
      data: options.data,
    });
    void fetch(`${API_BASE_URL}${API_ENDPOINTS.registrationLog.event}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      // Lets the report finish even if the page navigates away straight after (e.g. the
      // redirect after registering).
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Reporting must never affect registration.
  }
}

/** HTTP status of an axios error, a fetch Response, or a body carrying one. */
export function httpStatusOf(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const e = error as { response?: { status?: unknown }; status?: unknown };
  const status = e.response?.status ?? e.status;
  return typeof status === 'number' ? status : null;
}

/** Report a failed step with the same message the applicant was shown. */
export function logRegistrationFailure(
  event: RegistrationEvent,
  error: unknown,
  fallbackMessage: string,
  options: Omit<RegistrationEventOptions, 'outcome' | 'message'> = {}
): void {
  const { message, code } = extractApiError(error, fallbackMessage);
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  logRegistration(event, {
    ...options,
    outcome: 'FAIL',
    message,
    httpStatus: options.httpStatus ?? httpStatusOf(error),
    data: {
      ...(options.data ?? {}),
      ...(code ? { code } : {}),
      ...(offline ? { offline: true } : {}),
    },
  });
}

/** Field name → message for a form's current errors; never the values typed. */
export function formErrorSummary(errors: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, value] of Object.entries(errors ?? {})) {
    const message = (value as { message?: unknown } | undefined)?.message;
    out[field] = typeof message === 'string' && message ? message.slice(0, 200) : 'invalid';
  }
  return out;
}

/** Type and size of each document, keyed by slot — never file names, which can hold personal details. */
export function documentSummary(files: Record<string, File | null | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [slot, file] of Object.entries(files)) {
    if (file && typeof file === 'object' && 'size' in file) {
      out[slot] = `${file.type || 'unknown'}, ${Math.max(1, Math.round(file.size / 1024))} KB`;
    }
  }
  return out;
}
