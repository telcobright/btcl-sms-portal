import axios from 'axios';
import { API_BASE_URL, AUTH_BASE_URL, API_ENDPOINTS, PBX_BASE_URL, HCC_BASE_URL, VBS_BASE_URL, BULK_SMS_BASE_URL } from '@/config/api';

// ---------------------- INTERFACES ----------------------

export interface Partner {
  idPartner: number;
  partnerName: string;
  alternateNameInvoice: string | null;
  alternateNameOther: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  telephone: string | null;
  email: string | null;
  customerPrePaid: number;
  partnerType: number;
  date1: string | null;
  callSrcId: number | null;
  defaultCurrency: number;
  invoiceAddress: string | null;
  vatRegistrationNo: string | null;
  paymentAdvice: string | null;
  userPassword: string | null;
  status: string | null;
  deactivatedAt: string | null;
}

export interface PartnerUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNo: string;
  userStatus: string;
  createdOn: string;
  idPartner: number;
  pbxUuid: string | null;
  authRoles: { id: number; name: string; description: string }[];
}

export interface PackageAccount {
  id: number | null;
  idPackagePurchase: number | null;
  name: string;
  packageId: number;
  quantity: number;
  lastAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  uom: string;
  selected: boolean;
}

export interface PurchaseHistory {
  id: number;
  idPackage: number;
  idPartner: number;
  packageName: string;
  partnerName: string;
  purchaseDate: string;
  expireDate: string | null;
  price: number;
  vat: number;
  ait: number;
  total: number | null;
  status: string;
  autoRenewalStatus: boolean;
  paid: number;
  priority: number;
  discount: number;
  packageAccounts: PackageAccount[] | null;
  /**
   * Which service backend this purchase came from (pbx | hcc | vbs | sms).
   * Set client-side by getPurchasesByPartner — each service has its own DB, so
   * `id` alone is not unique across services.
   */
  service?: string;
}

export interface PartnerDocument {
  type: string;
  name: string;
  available: boolean;
}

export interface PartnerExtra {
  id: number;
  nid: string | null;
  tradeLicenseAvailable: boolean;
  tinCertificateAvailable: boolean;
  lastTaxReturnAvailable: boolean;
  nidFrontAvailable: boolean;
  nidBackAvailable: boolean;
  binCertificateAvailable: boolean;
  vatDocAvailable: boolean;
  btrcRegistrationAvailable: boolean;
  photoAvailable: boolean;
  slaAvailable: boolean;
}

export interface GetPartnersResponse {
  content: Partner[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface GetPartnersPayload {
  page: number;
  size: number;
  partnerName?: string | null;
  partnerType?: number | null;
}

export interface PartnerListSummary {
  idPartner: number;
  /** APPROVED | PENDING | REJECTED | NO_DOCUMENTS — rejected outranks pending. */
  documentStatus: string;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  /**
   * The four documents every category must supply, counted separately from the totals above.
   *
   * A mandatory document that was never uploaded counts as pending — it still has to be
   * chased. Optional on the type because a backend older than this field simply omits it,
   * and callers fall back rather than reading every partner one by one.
   */
  mandatoryPending?: number;
  mandatoryRejected?: number;
  /** INDIVIDUAL | CORPORATE | GOVERNMENT. Null for rows predating the column. */
  customerCategory: string | null;
}

/**
 * Document status and customer category for a page of partners.
 *
 * Batched on purpose: the list would otherwise need two extra calls per row. Returns an
 * empty list on failure so the table still renders — these are supplementary columns, not
 * a reason to fail the whole page.
 */
export const getPartnerListSummary = async (
  idPartners: number[],
  authToken: string
): Promise<PartnerListSummary[]> => {
  if (!idPartners.length) return [];
  try {
    const response = await axios.post<PartnerListSummary[]>(
      `${API_BASE_URL}${API_ENDPOINTS.partner.listSummary}`,
      { idPartners },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('\u274c Get partner list summary error:', error);
    return [];
  }
};

export interface PartnerCategoryCounts {
  INDIVIDUAL: number;
  CORPORATE: number;
  GOVERNMENT_INDIVIDUAL: number;
  GOVERNMENT_CORPORATE: number;
  /** Registered before the category existed, or written while the old build was live. */
  UNKNOWN: number;
  TOTAL: number;
}

/**
 * Customer-category totals, or null when they could not be read.
 *
 * Null rather than zeroes on failure, deliberately: a zero is a real answer, and showing
 * one for an unreachable endpoint made the dashboard claim there were no corporate
 * customers when there were 41. The caller renders a dash instead.
 */
export const getPartnerCategoryCounts = async (
  authToken: string
): Promise<PartnerCategoryCounts | null> => {
  const empty: PartnerCategoryCounts = {
    INDIVIDUAL: 0,
    CORPORATE: 0,
    GOVERNMENT_INDIVIDUAL: 0,
    GOVERNMENT_CORPORATE: 0,
    UNKNOWN: 0,
    TOTAL: 0,
  };
  try {
    const response = await axios.post<PartnerCategoryCounts>(
      `${API_BASE_URL}${API_ENDPOINTS.partner.categoryCounts}`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return { ...empty, ...(response.data || {}) };
  } catch (error) {
    console.error('\u274c Get partner category counts error:', error);
    return null;
  }
};

export interface ServiceEligibilityState {
  eligible: boolean;
  /** APPROVED | PENDING | REJECTED | NOT_UPLOADED | MANDATORY_INCOMPLETE */
  state: string;
  message: string;
  btrcStatus?: string | null;
  btrcRejectionReason?: string | null;
}

export interface ServiceEligibility {
  mandatoryApproved: boolean;
  awaitingApproval: string[];
  rejected: string[];
  pbx: ServiceEligibilityState;
  vbs: ServiceEligibilityState;
  hcc: ServiceEligibilityState;
  sms: ServiceEligibilityState;
}

/**
 * Which services this partner may buy, and why not when they may not.
 *
 * Returns null on failure. The caller treats that as "unknown" rather than "eligible" —
 * quietly showing a Buy button because a check failed would let someone start a purchase
 * the server will refuse anyway.
 */
export const getServiceEligibility = async (
  idPartner: number,
  authToken: string
): Promise<ServiceEligibility | null> => {
  try {
    const response = await axios.post<ServiceEligibility>(
      `${API_BASE_URL}${API_ENDPOINTS.partner.serviceEligibility}`,
      { id: idPartner },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data ?? null;
  } catch (error) {
    console.error('\u274c Service eligibility error:', error);
    return null;
  }
};

// ---------------------- ADMIN API FUNCTIONS ----------------------

/**
 * Get all partners with pagination
 */
export const getAllPartners = async (
  payload: GetPartnersPayload,
  authToken: string
): Promise<Partner[]> => {
  try {
    const response = await axios.post<Partner[] | GetPartnersResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.admin.getPartners}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    // Handle both array response and paginated response object
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    // If it's a paginated response object, extract the content array
    if (data && typeof data === 'object' && 'content' in data) {
      return data.content || [];
    }
    return [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Get Partners error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Update partner data
 */
export const updatePartner = async (
  partner: Partner,
  authToken: string
): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.partner.updatePartner}`,
      partner,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.status === 200;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Update Partner error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Create a new user for a partner
 */
export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNo: string;
  userStatus: string;
  partnerId: number;
  /**
   * Roles for the new account. Omit and the server assigns its default (ROLE_USER),
   * which is why every user created before this was an ordinary user.
   *
   * Granting an admin role is authorised server-side: only a caller who is already an
   * administrator may hand one out.
   */
  authRoles?: { name: string }[];
}

export const createUser = async (
  payload: CreateUserPayload,
  authToken: string
): Promise<string> => {
  try {
    const response = await axios.post(
      `${AUTH_BASE_URL}${API_ENDPOINTS.user.createUser}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Create User error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Edit an existing user
 */
export const editUser = async (
  user: Partial<PartnerUser> & { id: number; password?: string },
  authToken: string
): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${AUTH_BASE_URL}${API_ENDPOINTS.user.editUser}`,
      user,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.status === 200;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Edit User error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Delete a user by ID
 */
export const deleteUser = async (
  userId: number,
  authToken: string
): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${AUTH_BASE_URL}${API_ENDPOINTS.user.deleteUser}`,
      { id: userId },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.status === 200;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Delete User error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

/**
 * Get users by partner ID (uses AUTH_BASE_URL)
 */
export const getUsersByPartner = async (
  idPartner: number,
  authToken: string
): Promise<PartnerUser[]> => {
  try {
    const response = await axios.post(
      `${AUTH_BASE_URL}${API_ENDPOINTS.admin.getUsersByPartner}`,
      { idPartner },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'content' in data) {
      return data.content || [];
    }
    return [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Get Users by Partner error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return [];
  }
};

/**
 * Get purchase history by partner ID
 */
export const getPurchasesByPartner = async (
  idPartner: number,
  authToken: string
): Promise<PurchaseHistory[]> => {
  // There is NO central purchase table: every service runs its own FreeSwitchREST and
  // its own DB, and a purchase only exists in the DB of the service it was bought on.
  //
  // This used to fan out from the browser to all five service gateways, which could
  // never work — each service has its own AUTHENTICATION service and JWT signing key,
  // so an admin token is only valid on the tenant that issued it. The other four
  // answered HTTP 500 and the errors were swallowed per-source, so this quietly
  // returned main-tenant purchases only.
  //
  // The main backend now reads every service database directly and does the merge.
  try {
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.reports.sales}`,
      { idPartner },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        timeout: 60000,
      }
    );

    const rows = Array.isArray(response.data?.sales) ? response.data.sales : [];

    // Internal ledger rows (Postpaid_Credit) are already excluded server-side.
    return rows.map(
      (row: Record<string, unknown>): PurchaseHistory =>
        ({
          ...row,
          id: Number(row.id ?? 0),
          idPackage: Number(row.idPackage ?? 0),
          idPartner: Number(row.idPartner ?? idPartner),
          price: Number(row.price ?? 0),
          vat: Number(row.vat ?? 0),
          ait: Number(row.ait ?? 0),
          total: Number(row.total ?? 0),
        }) as PurchaseHistory
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Get Purchases by Partner error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return [];
  }
};

/**
 * Get documents by partner ID (uses get-partner-extra endpoint)
 */
export const getDocumentsByPartner = async (
  partnerId: number,
  authToken: string
): Promise<PartnerDocument[]> => {
  // Default document structure - all marked as not available
  const defaultDocuments: PartnerDocument[] = [
    { type: 'tradelicense', name: 'Trade License', available: false },
    { type: 'tin', name: 'TIN Certificate', available: false },
    { type: 'taxreturn', name: 'Tax Return', available: false },
    { type: 'nidfront', name: 'NID Front Side', available: false },
    { type: 'nidback', name: 'NID Back Side', available: false },
    { type: 'bin', name: 'BIN Certificate', available: false },
    { type: 'vat', name: 'VAT Document', available: false },
    { type: 'btrc', name: 'BTRC Aggregator Licence', available: false },
    { type: 'photo', name: 'Photo', available: false },
    { type: 'sla', name: 'SLA Document', available: false },
  ];

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.partner.getPartnerExtra}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ id: partnerId }),
      }
    );

    if (!response.ok) {
      console.warn(`Get partner extra returned ${response.status} for partner ${partnerId}`);
      return defaultDocuments;
    }

    const extra: PartnerExtra = await response.json();
    if (!extra) return defaultDocuments;

    // Transform partner extra into document list
    return [
      { type: 'tradelicense', name: 'Trade License', available: !!extra.tradeLicenseAvailable },
      { type: 'tin', name: 'TIN Certificate', available: !!extra.tinCertificateAvailable },
      { type: 'taxreturn', name: 'Tax Return', available: !!extra.lastTaxReturnAvailable },
      { type: 'nidfront', name: 'NID Front Side', available: !!extra.nidFrontAvailable },
      { type: 'nidback', name: 'NID Back Side', available: !!extra.nidBackAvailable },
      { type: 'bin', name: 'BIN Certificate', available: !!extra.binCertificateAvailable },
      { type: 'vat', name: 'VAT Document', available: !!extra.vatDocAvailable },
      { type: 'btrc', name: 'BTRC Aggregator Licence', available: !!extra.btrcRegistrationAvailable },
      { type: 'photo', name: 'Photo', available: !!extra.photoAvailable },
      { type: 'sla', name: 'SLA Document', available: !!extra.slaAvailable },
    ];
  } catch (error) {
    console.warn('Failed to fetch partner extra:', error);
    return defaultDocuments;
  }
};

/**
 * Get partner by ID
 */
export const getPartnerById = async (
  idPartner: number,
  authToken: string
): Promise<Partner | null> => {
  try {
    const response = await axios.post<Partner>(
      `${API_BASE_URL}${API_ENDPOINTS.partner.getPartner}`,
      { idPartner },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Get Partner by ID error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return null;
  }
};

/**
 * Get subscriptions by partner ID
 */
export const getSubscriptionsByPartner = async (
  idPartner: number,
  authToken: string
): Promise<PurchaseHistory[]> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.admin.getSubscriptionsByPartner}`,
      { idPartner },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'content' in data) {
      return data.content || [];
    }
    return [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Get Subscriptions by Partner error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return [];
  }
};

// ---------------------- HELPER FUNCTIONS ----------------------

/**
 * Get partner type label
 */
/**
 * What a partnerType value means.
 *
 * These are platform roles, and 5 and 6 are provisioning triggers rather than labels:
 * creating a partner with type 5 builds a FusionPBX domain, and type 6 does that plus a
 * SuiteCRM tenant database (see PartnerService.createPartnerCore).
 *
 * The names here previously said 5 = "SMS Customer" and 6 = "Corporate", neither of which
 * matched what the backend does with them. "Corporate" was the worse of the two, because it
 * reads as the customer_category value of the same name — a different field entirely, and the
 * one that actually distinguishes individual from corporate from government customers.
 */
export const getPartnerTypeLabel = (partnerType: number): string => {
  switch (partnerType) {
    case 1:
      return 'Carrier';
    case 2:
      return 'Reseller (legacy)';
    case 3:
      return 'Customer';
    case 4:
      return 'Reseller';
    case 5:
      return 'Hosted PBX';
    case 6:
      return 'Call Center';
    default:
      return 'Unknown';
  }
};

/**
 * Get customer prepaid label
 */
export const getCustomerPrePaidLabel = (customerPrePaid: number): string => {
  switch (customerPrePaid) {
    case 1:
      return 'Prepaid';
    case 2:
      return 'Postpaid';
    default:
      return 'Unknown';
  }
};

// ---------------------- DOCUMENT MANAGEMENT ----------------------

/** Map frontend doc type keys to the multipart field name the backend expects */
const DOC_TYPE_TO_FIELD: Record<string, string> = {
  tin: 'tinCertificate',
  nidfront: 'nidFront',
  nidback: 'nidBack',
  vat: 'vatDoc',
  tradelicense: 'tradeLicense',
  photo: 'photo',
  bin: 'binCertificate',
  sla: 'sla',
  btrc: 'btrcRegistration',
  taxreturn: 'lastTaxReturn',
};

/**
 * Upload / replace a single document for a partner
 */
export const uploadPartnerDocument = async (
  partnerId: number,
  documentType: string,
  file: File,
  authToken: string
): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('partnerId', partnerId.toString());
    formData.append('documentType', documentType.toLowerCase());
    formData.append('file', file, file.name);

    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.partner.updatePartnerDocument}`,
      formData,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 60000,
      }
    );
    return response.status === 200;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Upload Document error:', error.response?.data);
    }
    throw error;
  }
};

/**
 * Delete a single document for a partner
 */
export const deletePartnerDocument = async (
  partnerId: number,
  documentType: string,
  authToken: string
): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.partner.deletePartnerDocument}`,
      { partnerId, documentType },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.status === 200;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Delete Document error:', error.response?.data);
    }
    throw error;
  }
};

// ---------------------- SERVICE STATUS ----------------------

export interface ServiceStatus {
  pbx: { active: boolean; purchases: PurchaseHistory[] };
  hcc: { active: boolean; purchases: PurchaseHistory[] };
  vbs: { active: boolean; purchases: PurchaseHistory[] };
  sms: { active: boolean; purchases: PurchaseHistory[] };
}

/**
 * Get service-specific purchase data from all four services (PBX, HCC, VBS, SMS)
 */
export const getServiceStatus = async (
  idPartner: number,
  authToken: string
): Promise<ServiceStatus> => {
  const endpoint = API_ENDPOINTS.package.getPurchaseForPartner;

  const apiConfigs = [
    { url: `${PBX_BASE_URL}${endpoint}`, service: 'pbx' as const },
    { url: `${HCC_BASE_URL}${endpoint}`, service: 'hcc' as const },
    { url: `${VBS_BASE_URL}${endpoint}`, service: 'vbs' as const },
    // SMS purchases are recorded on the a2psms backend (btcl_sms packages live
    // there, and that's where the purchase is created), so both the "purchased
    // once" gate and deactivation read/target it (see SERVICE_BASE_URLS).
    { url: `${BULK_SMS_BASE_URL}${endpoint}`, service: 'sms' as const },
  ];

  const result: ServiceStatus = {
    pbx: { active: false, purchases: [] },
    hcc: { active: false, purchases: [] },
    vbs: { active: false, purchases: [] },
    sms: { active: false, purchases: [] },
  };

  const fetchPromises = apiConfigs.map(async ({ url, service }) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ idPartner }),
      });

      if (response.ok) {
        const data = await response.json();
        const purchases = Array.isArray(data) ? data : [];

        // Filter out Postpaid_Credit (9999) and check for valid active packages
        const validPurchases = purchases.filter(
          (p: PurchaseHistory) => p.idPackage !== 9999 && p.status === 'ACTIVE'
        );

        // Check if there are valid packageAccounts (not just postpaid credit)
        const hasValidPackages = purchases.some(
          (item: any) =>
            Array.isArray(item.packageAccounts) &&
            item.packageAccounts.some((pkg: any) => pkg.packageId !== 9999)
        );

        result[service] = {
          active: hasValidPackages || validPurchases.length > 0,
          purchases: validPurchases,
        };
      }
    } catch (error) {
      console.warn(`Failed to fetch ${service} status:`, error);
    }
  });

  await Promise.allSettled(fetchPromises);
  return result;
};

export const deactivatePartner = async (idPartner: number, authToken: string): Promise<void> => {
  await axios.post(
    `${API_BASE_URL}${API_ENDPOINTS.partner.deactivatePartner}`,
    { idPartner },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
};

export const reactivatePartner = async (idPartner: number, authToken: string): Promise<void> => {
  await axios.post(
    `${API_BASE_URL}${API_ENDPOINTS.partner.reactivatePartner}`,
    { idPartner },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
};

// Per-service partner deactivate/reactivate backends. Each hits
// `/partner/deactivate-partner` (or reactivate) with { idPartner } + Bearer token
// on its own FreeSwitchREST instance.
const SERVICE_BASE_URLS: Record<string, string> = {
  pbx: PBX_BASE_URL,
  hcc: HCC_BASE_URL,
  vbs: VBS_BASE_URL,
  sms: BULK_SMS_BASE_URL,
};

export const deactivatePartnerService = async (
  idPartner: number,
  service: string,
  authToken: string
): Promise<{ service: string; success: boolean; error?: string }> => {
  const baseUrl = SERVICE_BASE_URLS[service];
  if (!baseUrl) return { service, success: false, error: 'Unknown service' };
  try {
    await axios.post(
      `${baseUrl}${API_ENDPOINTS.partner.deactivatePartner}`,
      { idPartner },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return { service, success: true };
  } catch (err: any) {
    return { service, success: false, error: err?.response?.data || err.message };
  }
};

export const reactivatePartnerService = async (
  idPartner: number,
  service: string,
  authToken: string
): Promise<{ service: string; success: boolean; error?: string }> => {
  const baseUrl = SERVICE_BASE_URLS[service];
  if (!baseUrl) return { service, success: false, error: 'Unknown service' };
  try {
    await axios.post(
      `${baseUrl}${API_ENDPOINTS.partner.reactivatePartner}`,
      { idPartner },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return { service, success: true };
  } catch (err: any) {
    return { service, success: false, error: err?.response?.data || err.message };
  }
};

// ============================================
// Email Logs (admin "Sent Emails" view)
// ============================================
export interface EmailLogEntry {
  id: number;
  recipients: string;
  subject: string | null;
  body: string | null;
  isHtml: boolean;
  type: string | null;
  /** Product line: pbx | vbs | cc | sms | general. Backs the admin tabs. */
  service: string | null;
  idPartner: number | null;
  fromAddr: string | null;
  status: 'SENT' | 'FAILED' | string;
  errorMessage: string | null;
  createdAt: string | null;
}

export interface EmailLogPage {
  content: EmailLogEntry[];
  totalElements: number;
  totalPages: number;
  number: number; // current page index
  size: number;
}

export interface EmailLogFilter {
  page?: number;
  size?: number;
  search?: string | null;
  type?: string | null;
  service?: string | null;
  status?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

export const getEmailLogs = async (
  filter: EmailLogFilter,
  authToken: string
): Promise<EmailLogPage> => {
  const empty: EmailLogPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: filter.size || 20 };
  try {
    const response = await axios.post<EmailLogPage>(
      `${API_BASE_URL}${API_ENDPOINTS.admin.getEmailLogs}`,
      {
        page: filter.page ?? 0,
        size: filter.size ?? 20,
        search: filter.search ?? null,
        type: filter.type ?? null,
        service: filter.service ?? null,
        status: filter.status ?? null,
        startTime: filter.startTime ?? null,
        endTime: filter.endTime ?? null,
      },
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` } }
    );
    const data = response.data;
    if (data && typeof data === 'object' && 'content' in data) {
      // Jackson serializes the boolean `isHtml` getter as "html" (it strips the `is`
      // prefix), so normalize both spellings — otherwise the detail drawer treats HTML
      // emails as plain text and shows raw markup.
      data.content = (data.content ?? []).map((r) => {
        const anyR = r as EmailLogEntry & { html?: boolean };
        return { ...r, isHtml: anyR.isHtml ?? anyR.html ?? false };
      });
      return data;
    }
    return empty;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Get Email Logs error:', { status: error.response?.status, data: error.response?.data });
    }
    throw error;
  }
};
