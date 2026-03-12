import axios from 'axios';
import { API_BASE_URL, AUTH_BASE_URL, API_ENDPOINTS } from '@/config/api';

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
  packageId: number;
  packageName: string;
  balance: number;
  validity: string | null;
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
  try {
    const response = await axios.post<PartnerExtra>(
      `${API_BASE_URL}${API_ENDPOINTS.partner.getPartnerExtra}`,
      { id: partnerId },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const extra = response.data;
    if (!extra) return [];

    // Transform partner extra into document list
    const documents: PartnerDocument[] = [
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

    return documents;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Get Documents by Partner error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return [];
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
