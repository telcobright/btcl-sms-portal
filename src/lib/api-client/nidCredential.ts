import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

/**
 * Admin client for the EC NID API credentials.
 *
 * The NIDVerification service authenticates against the Election Commission partner API with
 * a username and password BTCL must rotate monthly. They used to be compiled into that
 * service's jar, so a rotation meant a rebuild and a restart; they now live in
 * tenant_master.nid_api_credential and are edited here.
 */

export interface NidCredentialAudit {
  version: number;
  username: string;
  action: string;
  changedAt: string;
  changedBy: string | null;
  note: string | null;
}

export interface NidCredentialStatus {
  username: string;
  passwordMasked: string;
  baseUrl: string | null;
  version: number;
  updatedAt: string;
  updatedBy: string | null;
  daysSinceUpdate: number | null;
  rotationDays: number | null;

  lastTestAt: string | null;
  lastTestOk: boolean | null;
  lastTestMessage: string | null;

  /** Version the running NID service reports having loaded. */
  loadedVersion: number | null;
  lastAuthAt: string | null;
  lastAuthOk: boolean | null;
  lastAuthError: string | null;
  serviceInSync: boolean | null;

  serviceUp: boolean | null;
  serviceResponseMs: number | null;
  serviceMessage: string | null;

  recentChanges: NidCredentialAudit[];
}

export interface NidCredentialUpdatePayload {
  username: string;
  /** Leave blank to keep the stored password and only change the username or base URL. */
  password?: string;
  baseUrl?: string;
  /** Verify against the EC API first; nothing is saved if the check fails. */
  testBeforeSave?: boolean;
}

export interface NidCredentialTestResult {
  ok: boolean;
  message: string;
  /** False when ad-hoc values were tried rather than what is stored. */
  testedStored: boolean;
}

const authHeaders = (authToken: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${authToken}`,
});

/** Current credentials, rotation age, live service health and recent changes. */
export const getNidCredentialStatus = async (
  authToken: string
): Promise<NidCredentialStatus> => {
  try {
    const response = await axios.post<NidCredentialStatus>(
      `${API_BASE_URL}${API_ENDPOINTS.nidCredential.get}`,
      {},
      { headers: authHeaders(authToken) }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Get NID credential status error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/** Rotate the credentials. Returns the refreshed status. */
export const updateNidCredential = async (
  payload: NidCredentialUpdatePayload,
  authToken: string
): Promise<NidCredentialStatus> => {
  try {
    const response = await axios.post<NidCredentialStatus>(
      `${API_BASE_URL}${API_ENDPOINTS.nidCredential.update}`,
      payload,
      { headers: authHeaders(authToken) }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Update NID credential error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Verify credentials against the EC API. Pass a username and password to trial values
 * without saving them, or nothing to test what is currently stored.
 */
export const testNidCredential = async (
  payload: Partial<NidCredentialUpdatePayload>,
  authToken: string
): Promise<NidCredentialTestResult> => {
  try {
    const response = await axios.post<NidCredentialTestResult>(
      `${API_BASE_URL}${API_ENDPOINTS.nidCredential.test}`,
      payload,
      { headers: authHeaders(authToken) }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Test NID credential error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/** One NID verification attempt, as the NIDVerification service recorded it. */
export interface NidVerificationAttempt {
  id: number;
  /** ISO time with the +06:00 offset. */
  at: string | null;
  /** The full NID, decrypted for admins; null if it could not be read. */
  nid: string | null;
  nidLast4: string | null;
  nidType: string | null;
  /** What the applicant was told. */
  verified: boolean;
  reason: string | null;
  detail: string | null;
  /** Where the attempt ended: request (never sent to the EC), auth (our EC login), verify. */
  stage: string | null;
  // What the EC returned.
  ecHttpStatus: number | null;
  ecStatus: string | null;
  ecStatusCode: string | null;
  ecVerified: boolean | null;
  ecError: string | null;
  ecErrorField: string | null;
  ecRequestId: string | null;
  /** The EC's whole reply, as JSON text. */
  ecResponse: string | null;
  /** Our failure when the EC gave no answer (timeouts, refused login). */
  error: string | null;
  ecMs: number | null;
  totalMs: number | null;
  clientIp: string | null;
  origin: string | null;
}

export interface NidVerificationLogQuery {
  /** A NID, an EC request id, or a caller's IP. */
  q?: string;
  /** VERIFIED, FAILED or a reason code. */
  result?: string;
  /** yyyy-MM-dd, Dhaka dates, inclusive. */
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface NidVerificationLog {
  /** False until the NIDVerification service has created its table. */
  available: boolean;
  /** False when TelcoREST has no key, so NIDs and EC replies cannot be shown. */
  decryptable: boolean;
  total: number;
  page: number;
  size: number;
  /** Attempts per outcome for the same search and dates: VERIFIED or a reason code. */
  counts: Record<string, number>;
  rows: NidVerificationAttempt[];
}

export const getNidVerificationLog = async (
  query: NidVerificationLogQuery,
  authToken: string
): Promise<NidVerificationLog> => {
  const response = await axios.post<NidVerificationLog>(
    `${API_BASE_URL}${API_ENDPOINTS.nidCredential.verificationLog}`,
    query,
    { headers: authHeaders(authToken) }
  );
  return response.data;
};

/** Turn an axios failure into something worth showing an admin. */
export const nidCredentialErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    if (error.response?.status === 403) {
      return 'Your account is not allowed to manage the NID API credentials.';
    }
    return data?.message || data?.error || error.message || fallback;
  }
  return fallback;
};
