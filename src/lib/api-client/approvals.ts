import axios from 'axios';
import { PAYMENT_BASE_URL, API_ENDPOINTS } from '@/config/api';

/**
 * Postpaid approvals.
 *
 * A postpaid checkout takes no payment, so nothing at the till proves the
 * customer is good for the money — an operator decides. Approving here releases
 * the purchase into provisioning; rejecting stops it for good.
 *
 * These requests used to be approved in SuiteCRM. The decision is the same one,
 * moved to where the operators already work.
 */

export interface ServiceApproval {
  id: number;
  idPartner: number;
  storeType: string;
  idPackage: number | null;
  /** Agents, for contact centre. Null for services without a countable quantity. */
  quantity: number | null;
  cusName: string | null;
  cusEmail: string | null;
  approvalName: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decidedBy: string | null;
  decidedAt: string | null;
  note: string | null;
  createdAt: string | null;
}

function auth(token: string) {
  return { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
}

/** Everything still waiting, newest first. Pass a storeType to narrow it. */
export async function getPendingApprovals(
  token: string,
  storeType?: string
): Promise<ServiceApproval[]> {
  const qs = storeType ? `?storeType=${encodeURIComponent(storeType)}` : '';
  const res = await axios.get(
    `${PAYMENT_BASE_URL}${API_ENDPOINTS.approvals.pending}${qs}`,
    auth(token)
  );
  return res.data?.approvals ?? [];
}

/** Just the badge number. Cheap enough to poll. */
export async function getPendingApprovalCount(token: string): Promise<number> {
  const res = await axios.get(
    `${PAYMENT_BASE_URL}${API_ENDPOINTS.approvals.pendingCount}`,
    auth(token)
  );
  return res.data?.count ?? 0;
}

/**
 * Approve a request and release it into provisioning.
 *
 * If this throws, nothing was released and the request is still pending — the
 * server rolls the decision back when it cannot publish, so retrying is safe.
 */
export async function approveRequest(
  id: number,
  token: string,
  decidedBy: string,
  note?: string
): Promise<ServiceApproval> {
  const res = await axios.post(
    `${PAYMENT_BASE_URL}${API_ENDPOINTS.approvals.approve(id)}`,
    { decidedBy, note },
    auth(token)
  );
  return res.data?.approval;
}

/** Reject a request. Nothing is provisioned and the customer is not charged. */
export async function rejectRequest(
  id: number,
  token: string,
  decidedBy: string,
  note?: string
): Promise<ServiceApproval> {
  const res = await axios.post(
    `${PAYMENT_BASE_URL}${API_ENDPOINTS.approvals.reject(id)}`,
    { decidedBy, note },
    auth(token)
  );
  return res.data?.approval;
}

/** "Contact Centre", not "cc" — the queue is read by people, not by the system. */
export function storeLabel(storeType: string): string {
  const names: Record<string, string> = {
    cc: 'Contact Centre',
    hcc: 'Contact Centre',
    pbx: 'Hosted PBX',
    vbs: 'Voice Broadcasting',
    sms: 'A2P SMS',
  };
  return names[(storeType || '').toLowerCase()] ?? storeType;
}
