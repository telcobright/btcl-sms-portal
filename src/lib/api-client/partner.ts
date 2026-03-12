import axios from 'axios';
import { API_BASE_URL, VBS_BASE_URL, HCC_BASE_URL, AUTH_BASE_URL, PBX_BASE_URL, API_ENDPOINTS } from '@/config/api';

// ---------------------- OTP FUNCTIONS (NO TOKEN REQUIRED) ----------------------

export const sendOtp = async (phoneNumber: string): Promise<{ message: string }> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.otp.send}`,
      { id: phoneNumber },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyOtp = async (phoneNumber: string, otp: string): Promise<{ message: string }> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.otp.verify}`,
      {
        phoneNumber: phoneNumber.replace('+', ''),
        otp,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Verify OTP API error:', error);

    try {
      // Retry with alternative key names (id + code)
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.otp.verify}`,
        {
          id: phoneNumber,
          code: otp,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (secondError) {
      console.error('❌ Second attempt Verify OTP API error:', secondError);
      throw secondError;
    }
  }
};

// ---------------------- EMAIL OTP FUNCTIONS ----------------------

export interface EmailOtpResponse {
  success: boolean;
  message: string;
  expiresInSeconds?: number;
  retryAfterSeconds?: number;
}

export const sendEmailOtp = async (
  email: string,
  purpose: 'login' | 'password_reset' | 'registration' = 'registration'
): Promise<EmailOtpResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.emailOtp.send}`,
      { email, purpose },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Return the error response data for handling (e.g., rate limiting)
      return error.response.data as EmailOtpResponse;
    }
    throw error;
  }
};

export const verifyEmailOtp = async (email: string, otp: string): Promise<EmailOtpResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.emailOtp.verify}`,
      { email, otp },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as EmailOtpResponse;
    }
    throw error;
  }
};

// ---------------------- INTERFACES ----------------------

export interface CreatePartnerPayload {
  partnerName: string;
  telephone: string;
  email: string;
  userPassword: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  alternateNameInvoice: string;
  alternateNameOther: string;
  vatRegistrationNo: string;
  invoiceAddress: string;
  customerPrePaid: number;
  partnerType: number;
  defaultCurrency: number;
  callSrcId: number;
}

export interface CreatePartnerResponse {
  idPartner?: number;
  id?: number;
  [key: string]: any;
}

// ✅ Updated Partner Details Payload interface (based on your latest payload)
export interface PartnerDetailsPayload {
  partnerId: number;
  address1?: string | null;
  address2?: string | null;
  address3?: string | null;
  address4?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  nid?: string | null;
  tradeLicenseNumber?: string | null;
  tin?: string | null;
  taxReturnDate?: string | null;
  contryCode?: string | null;
  tinCertificate?: File | null;
  nidFront?: File | null;
  nidBack?: File | null;
  vatDoc?: File | null;
  tradeLicense?: File | null;
  photo?: File | null;
  binCertificate?: File | null;
  sla?: File | null;
  btrcRegistration?: File | null;
  lastTaxReturn?: File | null;
}

interface AddPartnerDetailsResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface LoginResponse {
  token: string;
  [key: string]: any;
}

// ---------------------- CREATE PARTNER ----------------------

export const createPartner = async (payload: {
    partnerName: string | null;
    alternateNameOther: string;
    telephone: string;
    email: string;
    userPassword: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    alternateNameInvoice: string;
    vatRegistrationNo: string;
    invoiceAddress: string;
    customerPrePaid: number;
    partnerType: number;
    defaultCurrency: number;
    callSrcId: number
}): Promise<CreatePartnerResponse> => {
  try {
    // Create partner in PRIMARY service only
    // Other services (PBX, HCC, VBS) are handled on-demand via ensurePartnerInService()
    const response = await axios.post<CreatePartnerResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.partner.createPartner}`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    console.log('✅ Partner created in PRIMARY:', response.data);

    if (!response.data) {
      throw new Error('No response data received from create partner API');
    }

    return {
      ...response.data,
      idPartner: response.data.idPartner || response.data.id,
      id: response.data.id || response.data.idPartner,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Create Partner API error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        requestData: payload,
      });

      if (error.response?.status === 400) {
        throw new Error(`Bad Request: ${JSON.stringify(error.response.data) || 'Invalid partner data'}`);
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Token may be expired.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
    }
    throw error;
  }
};

// ---------------------- LOGIN PARTNER ----------------------

export const loginPartner = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const loginPayload = {
      email, // backend expects "email"
      password,
    };

    const response = await axios.post<LoginResponse>(
      `${AUTH_BASE_URL}${API_ENDPOINTS.auth.login}`,
      loginPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data || !response.data.token) {
      console.error('❌ No token in response:', response.data);
      throw new Error('No token received from login API');
    }

    const tokenParts = response.data.token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('⚠️ Token format may be invalid. Expected 3 parts, got:', tokenParts.length);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Partner Login API error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: `${AUTH_BASE_URL}${API_ENDPOINTS.auth.login}`,
      });

      if (error.response?.status === 401) {
        throw new Error('Invalid credentials for partner login');
      } else if (error.response?.status === 404) {
        throw new Error('Login endpoint not found. Please check the API URL.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error during login. Please try again later.');
      }
    }
    console.error('❌ Unexpected login error:', error);
    throw error;
  }
};

// ---------------------- ADD PARTNER DETAILS (UPDATED) ----------------------

export const addPartnerDetails = async (
  payload: PartnerDetailsPayload,
  authToken: string
): Promise<AddPartnerDetailsResponse> => {
  try {
    const formData = new FormData();

    // Append non-file text fields
    const textFields: Record<string, any> = {
      partnerId: payload.partnerId,
      address1: payload.address1 ?? '',
      address2: payload.address2 ?? '',
      address3: payload.address3 ?? '',
      address4: payload.address4 ?? '',
      city: payload.city ?? '',
      state: payload.state ?? '',
      postalCode: payload.postalCode ?? '',
      nid: payload.nid ?? '',
      tradeLicenseNumber: payload.tradeLicenseNumber ?? '',
      tin: payload.tin ?? '',
      taxReturnDate: payload.taxReturnDate ?? '',
      countryCode: payload.contryCode || 'BD',
    };

    Object.entries(textFields).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    // Helper function to append files
    const appendFile = (file: File | null | undefined, fieldName: string) => {
      if (file) {
        formData.append(fieldName, file, file.name);
      }
    };

    // Append file fields
    appendFile(payload.tinCertificate, 'tinCertificate');
    appendFile(payload.nidFront, 'nidFront');
    appendFile(payload.nidBack, 'nidBack');
    appendFile(payload.vatDoc, 'vatDoc');
    appendFile(payload.tradeLicense, 'tradeLicense');
    appendFile(payload.photo, 'photo');
    appendFile(payload.binCertificate, 'binCertificate');
    appendFile(payload.sla, 'sla');
    appendFile(payload.btrcRegistration, 'btrcRegistration');
    appendFile(payload.lastTaxReturn, 'lastTaxReturn');

    // Send API request
    const response = await axios.post<AddPartnerDetailsResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.partner.partnerDocuments}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        timeout: 60000, // 60 seconds for upload
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Add Partner Details API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        url: error.config?.url,
      });

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Token is invalid or expired.');
      } else if (error.response?.status === 403) {
        throw new Error('Forbidden: Access denied. Check token or partner ID.');
      } else if (error.response?.status === 404) {
        throw new Error('Not found: partner-documents endpoint missing.');
      }

      throw new Error(error.response?.data?.message || 'Failed to add partner details');
    } else {
      console.error('❌ Unexpected Error:', error);
      throw new Error('An unexpected error occurred while adding partner details');
    }
  }
};

// ---------------------- GET PARTNER DOCUMENTS ----------------------

export const getPartnerDocuments = async (
  partnerId: number,
  authToken: string
): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.partner.partnerDocuments}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params: { partnerId },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Get Partner Documents error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

// ---------------------- GET PARTNER BY ID ----------------------

export interface PartnerData {
  idPartner: number;
  partnerName: string;
  alternateNameInvoice: string;
  alternateNameOther: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  telephone: string;
  email: string;
  customerPrePaid: number;
  partnerType: number;
  date1: string;
  callSrcId: number;
  defaultCurrency: number;
  invoiceAddress: string;
  vatRegistrationNo: string;
  paymentAdvice: string | null;
  userPassword: string | null;
}

export const getPartnerById = async (idPartner: number, authToken: string): Promise<PartnerData> => {
  try {
    const response = await axios.post<PartnerData>(
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
      console.error('❌ Get Partner By ID error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

// ---------------------- SERVICE-SPECIFIC PARTNER FUNCTIONS ----------------------

// Map service type to base URL
export const SERVICE_BASE_URLS: Record<string, string> = {
  'hosted-pbx': PBX_BASE_URL,
  'contact-center': HCC_BASE_URL,
  'voice-broadcast': VBS_BASE_URL,
};

/**
 * Check if partner exists in a specific service
 * @param idPartner - Partner ID to check
 * @param serviceBaseUrl - Base URL of the service to check
 * @returns Partner data if exists, null if not exists
 */
export const checkPartnerInService = async (
  idPartner: number,
  serviceBaseUrl: string
): Promise<PartnerData | null> => {
  try {
    console.log(`🔍 Checking partner ${idPartner} in ${serviceBaseUrl}...`);

    const response = await axios.post<PartnerData>(
      `${serviceBaseUrl}${API_ENDPOINTS.partner.getPartner}`,
      { idPartner },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );

    if (response.data && response.data.idPartner) {
      console.log(`✅ Partner ${idPartner} EXISTS in ${serviceBaseUrl}`);
      return response.data;
    }

    console.log(`❌ Partner ${idPartner} NOT FOUND in ${serviceBaseUrl}`);
    return null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`❌ Partner ${idPartner} NOT FOUND in ${serviceBaseUrl}:`, error.response?.status);
    }
    return null; // Partner doesn't exist or service unavailable
  }
};

/**
 * Create partner in a specific service with same idPartner
 * @param partnerData - Partner data to create
 * @param serviceBaseUrl - Base URL of the service
 */
export const createPartnerInService = async (
  partnerData: CreatePartnerPayload & { idPartner?: number },
  serviceBaseUrl: string
): Promise<CreatePartnerResponse | null> => {
  try {
    console.log(`📝 Creating partner in ${serviceBaseUrl}...`);

    const response = await axios.post<CreatePartnerResponse>(
      `${serviceBaseUrl}${API_ENDPOINTS.partner.createPartner}`,
      partnerData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    console.log(`✅ Partner created in ${serviceBaseUrl}:`, response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`❌ Failed to create partner in ${serviceBaseUrl}:`, {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return null;
  }
};

/**
 * Ensure partner exists in target service before purchase
 * If partner doesn't exist, create it first
 * @param idPartner - Partner ID
 * @param serviceType - Service type (hosted-pbx, contact-center, voice-broadcast)
 * @param authToken - Auth token to get partner data from primary
 */
export const ensurePartnerInService = async (
  idPartner: number,
  serviceType: string,
  authToken: string
): Promise<boolean> => {
  const serviceBaseUrl = SERVICE_BASE_URLS[serviceType];

  if (!serviceBaseUrl) {
    console.error(`❌ Unknown service type: ${serviceType}`);
    return false;
  }

  console.log(`🔄 Ensuring partner ${idPartner} exists in ${serviceType} (${serviceBaseUrl})...`);

  // Step 1: Check if partner exists in target service
  const existingPartner = await checkPartnerInService(idPartner, serviceBaseUrl);

  if (existingPartner) {
    console.log(`✅ Partner already exists in ${serviceType}, proceeding with purchase...`);
    return true;
  }

  // Step 2: Partner doesn't exist, get data from primary service
  console.log(`📥 Partner not found in ${serviceType}, fetching from primary...`);

  try {
    const primaryPartnerData = await getPartnerById(idPartner, authToken);

    if (!primaryPartnerData) {
      console.error('❌ Could not fetch partner data from primary service');
      return false;
    }

    // Step 3: Create partner in target service with same data
    const createPayload: CreatePartnerPayload & { idPartner?: number } = {
      idPartner: primaryPartnerData.idPartner,
      partnerName: primaryPartnerData.partnerName,
      telephone: primaryPartnerData.telephone,
      email: primaryPartnerData.email,
      userPassword: primaryPartnerData.userPassword || '',
      address1: primaryPartnerData.address1 || '',
      address2: primaryPartnerData.address2 || '',
      city: primaryPartnerData.city || '',
      state: primaryPartnerData.state || '',
      postalCode: primaryPartnerData.postalCode || '',
      country: primaryPartnerData.country || 'Bangladesh',
      alternateNameInvoice: primaryPartnerData.alternateNameInvoice || '',
      alternateNameOther: primaryPartnerData.alternateNameOther || '',
      vatRegistrationNo: primaryPartnerData.vatRegistrationNo || '',
      invoiceAddress: primaryPartnerData.invoiceAddress || '',
      customerPrePaid: primaryPartnerData.customerPrePaid || 1,
      partnerType: primaryPartnerData.partnerType || 2,
      defaultCurrency: primaryPartnerData.defaultCurrency || 4,
      callSrcId: primaryPartnerData.callSrcId || 0,
    };

    const createdPartner = await createPartnerInService(createPayload, serviceBaseUrl);

    if (createdPartner) {
      console.log(`✅ Partner successfully created in ${serviceType}`);
      return true;
    } else {
      console.error(`❌ Failed to create partner in ${serviceType}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error ensuring partner in ${serviceType}:`, error);
    return false;
  }
};

// ---------------------- GET USER BY EMAIL ----------------------

export interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdOn: string;
  phoneNo: string;
  userStatus: string;
  resellerDbName: string | null;
  webTokens: string | null;
  idPartner: number;
  authRoles: { id: number; name: string; description: string }[];
  accessRules: string | null;
  pbxUuid?: string | null;
}

export const getUserByEmail = async (email: string, authToken: string): Promise<UserData> => {
  try {
    const response = await axios.post<UserData>(
      `${AUTH_BASE_URL}${API_ENDPOINTS.user.getUserByEmail}`,
      { email },
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
      console.error('❌ Get User By Email error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};

// ---------------------- EDIT USER (UPDATE PBX UUID) ----------------------

export interface EditUserPayload {
  id: number;
  pbxUuid: string;
}

export const editUser = async (
  payload: EditUserPayload,
  authToken: string
): Promise<any> => {
  try {
    const response = await axios.post(
      `${AUTH_BASE_URL}${API_ENDPOINTS.user.editUser}`,
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
      console.error('❌ Edit User error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
};
