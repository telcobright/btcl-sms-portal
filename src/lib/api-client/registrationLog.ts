import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

/**
 * Admin reads of the registration log: every self-service registration attempt and the steps
 * it went through. Written by the registration page (see src/lib/registrationLog.ts) and by
 * TelcoREST for the final submit. Names, emails, phones and NIDs, so admin roles only.
 */

export type JourneyState = 'REGISTERED' | 'IN_PROGRESS' | 'ABANDONED';

export interface RegistrationJourney {
  journeyId: string;
  /** ISO times with the +06:00 offset. */
  startedAt: string | null;
  lastEventAt: string | null;
  state: JourneyState;
  /** 1 email & phone, 2 NID, 3 details & documents, 4 submit. */
  furthestStep: number | null;
  lastEvent: string | null;
  lastOutcome: string | null;
  lastError: string | null;
  lastErrorEvent: string | null;
  lastErrorAt: string | null;
  failureCount: number | null;
  eventCount: number | null;
  customerCategory: string | null;
  companyName: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  nid: string | null;
  nidLast4: string | null;
  idPartner: number | null;
  clientIp: string | null;
  userAgent: string | null;
}

export interface RegistrationJourneyPage {
  /** False until TelcoREST has created the tables. */
  available: boolean;
  total: number;
  page: number;
  size: number;
  abandonedAfterMinutes: number;
  counts: {
    total?: number;
    registered?: number;
    inProgress?: number;
    abandoned?: number;
    withErrors?: number;
  };
  rows: RegistrationJourney[];
}

export interface RegistrationJourneyQuery {
  /** Email, phone, NID, company or name, a journey id, or "#partnerId". */
  q?: string;
  /** REGISTERED, NOT_REGISTERED, WITH_ERRORS, IN_PROGRESS or ABANDONED. */
  state?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface RegistrationLogEvent {
  id: number;
  at: string | null;
  source: 'browser' | 'server';
  step: number | null;
  event: string;
  outcome: 'OK' | 'FAIL' | 'INFO';
  message: string | null;
  httpStatus: number | null;
  /** JSON text. */
  details: string | null;
}

const headers = (authToken: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${authToken}`,
});

export const getRegistrationJourneys = async (
  query: RegistrationJourneyQuery,
  authToken: string
): Promise<RegistrationJourneyPage> => {
  const response = await axios.post<RegistrationJourneyPage>(
    `${API_BASE_URL}${API_ENDPOINTS.registrationLog.journeys}`,
    query,
    { headers: headers(authToken) }
  );
  return response.data;
};

export const getRegistrationEvents = async (
  journeyId: string,
  authToken: string
): Promise<RegistrationLogEvent[]> => {
  const response = await axios.post<RegistrationLogEvent[]>(
    `${API_BASE_URL}${API_ENDPOINTS.registrationLog.events}`,
    { journeyId },
    { headers: headers(authToken) }
  );
  return response.data;
};

/** Something worth showing an admin from an axios failure. */
export const registrationLogErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return 'Your account is not allowed to see the registration log.';
    if (error.response?.status === 401) return 'Your session could not be verified. Please sign in again.';
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || error.message || fallback;
  }
  return fallback;
};
