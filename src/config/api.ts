/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

// ============================================
// COMMON ROOT URL - Change this single value to switch environments
// ============================================
// export const ROOT_URL = 'http://localhost:8001';
export const ROOT_URL = 'https://vbs.btcliptelephony.gov.bd:4000';

export const VBS_BASE_URL = 'https://vbs.btcliptelephony.gov.bd/FREESWITCHREST';

// Hosted PBX specific base URL
export const PBX_BASE_URL = 'https://vbs.btcliptelephony.gov.bd:4000/FREESWITCHREST';

// Secondary API URL for partner creation (without port)
export const API_BASE_URL_SECONDARY = 'https://vbs.btcliptelephony.gov.bd/FREESWITCHREST';

// HCC API Base URL for partner creation
export const HCC_BASE_URL = 'https://hcc.btcliptelephony.gov.bd/FREESWITCHREST';

// ============================================
// Service Base URLs (derived from ROOT_URL)
// ============================================
export const API_BASE_URL = `${ROOT_URL}/FREESWITCHREST`;
export const AUTH_BASE_URL = `${ROOT_URL}/AUTHENTICATION`;
export const NID_BASE_URL = `${ROOT_URL}/NID`;
export const BULK_SMS_PORTAL_URL = `${ROOT_URL}:4000/`;
export const PAYMENT_BASE_URL = `${ROOT_URL}`;
// export const PAYMENT_BASE_URL = 'http://localhost:8081';

// Voice Broadcast specific base URL
// Feature Flags
/**
 * Toggle verification features on/off
 * Set to true to enable, false to skip verification (for testing)
 */
export const FEATURE_FLAGS = {
  /** Enable/Disable OTP verification during registration */
  OTP_VERIFICATION_ENABLED: false,

  /** Enable/Disable NID verification during registration */
  NID_VERIFICATION_ENABLED: false,

  /** Enable/Disable SSLCommerz payment */
  PAYMENT_ENABLED: true,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // OTP endpoints
  otp: {
    send: '/otp/send',
    verify: '/otp/varify',
  },

  // Authentication endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },

  // Partner endpoints
  partner: {
    validate: '/admin/DashBoard/partner/validate',
    createPartner: '/partner/create-partner',
    partnerDocuments: '/partner/partner-documents',
    getPartner: '/partner/get-partner',
    getPartnerExtra: '/partner/get-partner-extra',
    getPartnerDocument: '/partner/get-partner-document',
  },

  // NID endpoints
  nid: {
    verify: '/api/v1/nid/verify',
  },

  // Package endpoints
  package: {
    getPurchaseForPartner: '/package/getPurchaseForPartner',
    purchasePackage: '/package/purchase-package',
    getAllPurchasePartnerWise: '/package/get-all-purchase-partner-wise',
  },

  // User/Dashboard endpoints
  user: {
    getTopupBalanceForUser: '/user/DashBoard/getTopupBalanceForUser',
    getUserByEmail: '/getUserByEmail',
    editUser: '/editUser',
  },

  // Payment endpoints (service-specific)
  payment: {
    sslInitiate: '/api/payment/ssl/initiate', // Generic fallback
    pbxInitiate: '/api/payment/ssl/pbx/initiate', // Hosted PBX
    vbsInitiate: '/api/payment/ssl/vbs/initiate', // Voice Broadcast
    ccInitiate: '/api/payment/ssl/cc/initiate', // Contact Center
    unifiedPurchase: '/api/payment/unified/purchase', // Unified purchase (handles both payment gateway & direct purchase)
  },

  // Domain/PBX endpoints
  domain: {
    create: '/api/v1/domains/create',
  },

  // Gateway endpoints
  gateway: {
    create: '/api/v1/gateways/create',
  },

  // Route endpoints
  route: {
    create: '/route/create-route',
  },
} as const;

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// API request helper with default headers
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
  };

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  return fetch(buildApiUrl(endpoint), mergedOptions);
};
