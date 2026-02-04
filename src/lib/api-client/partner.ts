import axios from 'axios';
import { API_BASE_URL, VBS_BASE_URL, HCC_BASE_URL, A2P_BASE_URL, AUTH_BASE_URL, API_ENDPOINTS, SERVICE_API_FLAGS } from '@/config/api';

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
    // Build API calls based on enabled service flags
    const apiCalls: Promise<any>[] = [];
    const apiNames: string[] = [];

    const primaryUrl = `${API_BASE_URL}${API_ENDPOINTS.partner.createPartner}`;
    const vbsUrl = `${VBS_BASE_URL}${API_ENDPOINTS.partner.createPartner}`;
    const hccUrl = `${HCC_BASE_URL}${API_ENDPOINTS.partner.createPartner}`;
    const a2pUrl = `${A2P_BASE_URL}${API_ENDPOINTS.partner.createPartner}`;

    // Primary API (port 4000)
    if (SERVICE_API_FLAGS.PRIMARY_ENABLED) {
      apiCalls.push(
        axios.post<CreatePartnerResponse>(primaryUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
        })
      );
      apiNames.push('Primary (PBX)');
    }

    // VBS API (without port)
    if (SERVICE_API_FLAGS.VBS_ENABLED) {
      apiCalls.push(
        axios.post<CreatePartnerResponse>(vbsUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
        })
      );
      apiNames.push('VBS');
    }

    // HCC API
    if (SERVICE_API_FLAGS.HCC_ENABLED) {
      apiCalls.push(
        axios.post<CreatePartnerResponse>(hccUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
        })
      );
      apiNames.push('HCC');
    }

    // A2P SMS API
    if (SERVICE_API_FLAGS.A2P_ENABLED) {
      apiCalls.push(
        axios.post<CreatePartnerResponse>(a2pUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
        })
      );
      apiNames.push('A2P SMS');
    }

    console.log('Creating partner on enabled endpoints:', apiNames);

    // Make enabled API calls simultaneously
    const responses = await Promise.allSettled(apiCalls);

    // Log results for each enabled API
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled') {
        console.log(`✅ ${apiNames[index]} partner created:`, response.value.data);
      } else {
        console.warn(`⚠️ ${apiNames[index]} failed:`, response.reason?.message);
      }
    });

    // Use first successful response (VBS if enabled, otherwise first available)
    const successfulResponse = responses.find(r => r.status === 'fulfilled');
    if (!successfulResponse || successfulResponse.status !== 'fulfilled') {
      throw new Error('All enabled API endpoints failed');
    }

    const response = successfulResponse.value;

    if (!response.data) {
      throw new Error('No response data received from create partner API');
    }

    const responseData = {
      ...response.data,
      idPartner: response.data.idPartner || response.data.id,
      id: response.data.id || response.data.idPartner,
    };

    return responseData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Create Partner API error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
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
