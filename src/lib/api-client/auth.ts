import axios from 'axios';
import { AUTH_BASE_URL, API_ENDPOINTS } from '@/config/api';
import toast from 'react-hot-toast';

// Setup axios interceptor for handling 401 errors (expired/invalid token)
// Note: Only handle 401 (Unauthorized) for session expiry, not 403 (Forbidden)
// 403 errors should be handled by individual API calls as they may indicate permission issues
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.message || '';

        // Only auto-logout for 401 errors that indicate actual token expiration
        // Skip logout for API-specific authorization errors
        if (status === 401) {
            // Check if this is a token expiration error (not just an API permission error)
            const isTokenExpired =
                errorMessage.toLowerCase().includes('expired') ||
                errorMessage.toLowerCase().includes('invalid token') ||
                errorMessage.toLowerCase().includes('jwt') ||
                errorMessage.toLowerCase().includes('unauthorized');

            if (isTokenExpired && typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                // Don't show toast or redirect if already on login page
                if (!currentPath.includes('/login')) {
                    localStorage.removeItem('authToken');
                    delete axios.defaults.headers.common['Authorization'];

                    toast.error('Session expired. Please login again.', {
                        duration: 5000,
                        id: 'session-expired'
                    });

                    // Redirect to login
                    const locale = currentPath.startsWith('/bn') ? 'bn' : 'en';
                    window.location.href = `/${locale}/login`;
                }
            }
        }
        return Promise.reject(error);
    }
);

export interface LoginResponse {
    token: string;
    authRoles: { id: number; name: string; description: string }[];
    sessionStartDateTime: string;
    userContext: string;
    message: string | null;
    idPartner?: number;  // Add this line
    partnerId?: number;  // Add this as fallback
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
}

export interface RegisterResponse {
    token: string;
    message?: string;
}

export const loginUser = async (payload: LoginPayload): Promise<LoginResponse> => {
    try {
        const response = await axios.post<LoginResponse>(
            `${AUTH_BASE_URL}${API_ENDPOINTS.auth.login}`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error('Login API error:', error);
        throw error;
    }
};

export const registerUser = async (payload: RegisterPayload): Promise<RegisterResponse> => {
    try {
        console.log('Registering user with payload:', payload);

        const response = await axios.post<RegisterResponse>(
            `${AUTH_BASE_URL}${API_ENDPOINTS.auth.register}`,
            payload
        );

        console.log('Registration response:', response.data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Registration API error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
            });

            if (error.response?.status === 400) {
                throw new Error(error.response?.data?.message || 'Invalid registration data');
            } else if (error.response?.status === 409) {
                throw new Error('User already exists with this email');
            } else if (error.response?.status === 500) {
                throw new Error('Server error. Please try again later.');
            }
        }

        console.error('Registration error:', error);
        throw error;
    }
};

// Token management functions
export const setAuthToken = (token: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
};

export const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('authToken');
    }
    return null;
};

export const removeAuthToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        delete axios.defaults.headers.common['Authorization'];
    }
};

// ✅ Add this alias function for compatibility
export const clearAuthToken = removeAuthToken;

// Verify if user is authenticated
export const isAuthenticated = (): boolean => {
    return !!getAuthToken();
};