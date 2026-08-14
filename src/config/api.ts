/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

// ============================================
// COMMON ROOT URL - Change this single value to switch environments
// ============================================
// export const ROOT_URL = 'http://localhost:8001';
export const ROOT_URL = 'https://www.alaapcloud.gov.bd';

// VBS API Base URL (without port) - used for secondary partner creation
export const VBS_BASE_URL = 'https://vbs.alaapcloud.gov.bd/FREESWITCHREST';

// Hosted PBX specific base URL (with port 4000)
export const PBX_BASE_URL = 'https://vbs.alaapcloud.gov.bd:4000/FREESWITCHREST';

// HCC API Base URL for partner creation
export const HCC_BASE_URL = 'https://cc.alaapcloud.gov.bd/FREESWITCHREST';

// ============================================
// Service Base URLs (derived from ROOT_URL)
// ============================================
export const API_BASE_URL = `${ROOT_URL}/FREESWITCHREST`;
export const AUTH_BASE_URL = `${ROOT_URL}/AUTHENTICATION`;
export const NID_BASE_URL = `${ROOT_URL}/NID`;
export const BULK_SMS_PORTAL_URL = 'https://a2psms.btcliptelephony.gov.bd/';
// Bulk SMS (a2psms) API base — same FreeSwitchREST endpoint pattern as the other services
export const BULK_SMS_BASE_URL = 'https://a2psms.btcliptelephony.gov.bd/FREESWITCHREST';
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
  OTP_VERIFICATION_ENABLED: true,

  /** Enable/Disable NID verification during registration */
  NID_VERIFICATION_ENABLED: true,

  /** Enable/Disable SSLCommerz payment */
  PAYMENT_ENABLED: true,

  /**
   * Master switch for postpaid (registration form + pricing page).
   *
   * When false, postpaid is hidden from everyone: the registration radio is disabled and
   * pricing shows "Coming Soon" instead of "Apply".
   *
   * When true, postpaid pricing is public — anyone can see the plans and their rates — but
   * only Government customers can actually select it at registration. That gating lives in
   * the register page and is not controlled by this flag, so turning postpaid on does not
   * open it to private customers.
   */
  POSTPAID_ENABLED: true,

  /**
   * Whether an individual (a person rather than an organisation) may register.
   *
   * When false, Individual and Government Individual appear on the registration form as
   * "Coming soon" and cannot be chosen — only the two corporate types are selectable.
   * The categories, their document rules and every admin view already support
   * individuals; this only controls whether the public form offers them yet.
   *
   * Set to true to open individual registration. Nothing else needs to change.
   */
  INDIVIDUAL_REGISTRATION_ENABLED: false,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // OTP endpoints (Phone)
  otp: {
    send: '/otp/send',
    verify: '/otp/varify',
  },

  // Email OTP endpoints
  emailOtp: {
    send: '/otp/email/send',
    verify: '/otp/email/verify',
  },

  // Password reset
  sendResetOtp: '/auth/send-reset-otp',
  passwordReset: '/auth/reset-password',

  // Authentication endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },

  // Partner endpoints
  partner: {
    validate: '/admin/DashBoard/partner/validate',
    createPartner: '/partner/create-partner',
    // Atomic registration: partner + auth user + details + documents in one request.
    // Either all of it is created or none of it is — there is no window where a
    // partner exists without its documents. Use this for signup, never
    // createPartner + partnerDocuments as separate calls.
    register: '/partner/register',
    rollbackRegistration: '/partner/rollback-registration',
    partnerDocuments: '/partner/partner-documents',
    getPartner: '/partner/get-partner',
    // Document status + customer category for the partners on screen, batched.
    listSummary: '/partner/list-summary',
    // Customer-category totals for the admin dashboard.
    categoryCounts: '/partner/category-counts',
    getPartnerExtra: '/partner/get-partner-extra',
    getPartnerDocument: '/partner/get-partner-document',
    getDocumentStatuses: '/partner/get-document-statuses',
    updateDocumentStatus: '/partner/update-document-status',
    updatePartner: '/partner/update-partner',
    updatePartnerDocument: '/partner/update-partner-document',
    deletePartnerDocument: '/partner/delete-partner-document',
    checkPurchaseEligibility: '/partner/check-purchase-eligibility',
    deactivatePartner: '/partner/deactivate-partner',
    reactivatePartner: '/partner/reactivate-partner',
  },

  // NID endpoints
  nid: {
    verify: '/api/v1/nid/verify',
    checkNid: '/partner/check-nid',
  },

  // Admin management of the EC NID API credentials.
  // These live on TelcoREST (behind gateway auth), not on the NID service itself —
  // nginx proxies the whole /NID/ prefix with no authentication, so a write endpoint
  // over there would be publicly reachable.
  nidCredential: {
    get: '/admin/nid-credential/get',
    update: '/admin/nid-credential/update',
    test: '/admin/nid-credential/test',
  },

  // Package endpoints
  package: {
    getPurchaseForPartner: '/package/getPurchaseForPartner',
    purchasePackage: '/package/purchase-package',
    getAllPurchasePartnerWise: '/package/get-all-purchase-partner-wise',
    getAllPurchase: '/package/get-all-purchase',
  },

  // Cross-service admin reporting. Served by the main backend, which reads each
  // service's database directly — an admin token is only valid on the tenant that
  // issued it, so the browser cannot gather this from the other gateways itself.
  reports: {
    sales: '/admin/reports/sales',
  },

  // User/Dashboard endpoints
  user: {
    getTopupBalanceForUser: '/user/DashBoard/getTopupBalanceForUser',
    getUserByEmail: '/getUserByEmail',
    editUser: '/editUser',
    createUser: '/auth/createUser',
    deleteUser: '/deleteUser',
  },

  // Payment endpoints
  payment: {
    unifiedPurchase: '/api/payment/unified/purchase', // Unified purchase (handles both payment gateway & direct purchase)
  },

  // Per-user menu permissions for the /admin area (uses AUTH_BASE_URL).
  // Namespaced under admin-user/ so it never collides with the PBX portal's
  // permissions/save + permissions/get-user-permissions, which store a
  // different catalog's keys.
  permissions: {
    getAdminUserMenus: '/permissions/admin-user/get',
    saveAdminUserMenus: '/permissions/admin-user/save',
  },

  // Admin endpoints
  admin: {
    getPartners: '/partner/get-partners', // Get all partners with pagination
    getUsersByPartner: '/getUserByIdPartner', // Get users for a partner (uses AUTH_BASE_URL)
    getSubscriptionsByPartner: '/package/get-subscriptions-by-partner', // Get subscriptions for a partner
    getEmailLogs: '/api/v1/email/logs', // Paginated/filterable list of sent emails
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
