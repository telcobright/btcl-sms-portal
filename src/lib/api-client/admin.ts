import axios from 'axios';
import { API_BASE_URL, AUTH_BASE_URL, API_ENDPOINTS, PBX_BASE_URL, HCC_BASE_URL, VBS_BASE_URL } from '@/config/api';

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
  try {
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.package.getAllPurchasePartnerWise}`,
      { idPartner },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    const data = response.data;
    // Handle both array and paginated response
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'content' in data) {
      return data.content || [];
    }
    return [];
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
    { type: 'btrc', name: 'BTRC Registration', available: false },
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
      { type: 'btrc', name: 'BTRC Registration', available: !!extra.btrcRegistrationAvailable },
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
export const getPartnerTypeLabel = (partnerType: number): string => {
  switch (partnerType) {
    case 1:
      return 'Carrier';
    case 2:
      return 'Reseller';
    case 3:
      return 'Customer';
    case 4:
      return 'Reseller';
    case 5:
      return 'SMS Customer';
    case 6:
      return 'Enterprise';
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
}

/**
 * Get service-specific purchase data from all three services (PBX, HCC, VBS)
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
  ];

  const result: ServiceStatus = {
    pbx: { active: false, purchases: [] },
    hcc: { active: false, purchases: [] },
    vbs: { active: false, purchases: [] },
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
