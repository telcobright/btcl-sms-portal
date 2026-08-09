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
