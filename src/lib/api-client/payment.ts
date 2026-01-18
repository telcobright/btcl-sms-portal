// lib/api-client/payment.ts
import axios from 'axios';
import { PAYMENT_BASE_URL, API_ENDPOINTS } from '@/config/api';

// Service type to payment endpoint mapping
const getPaymentEndpoint = (serviceType: string): string => {
    switch (serviceType) {
        case 'hosted-pbx':
            return API_ENDPOINTS.payment.pbxInitiate;
        case 'voice-broadcast':
            return API_ENDPOINTS.payment.vbsInitiate;
        case 'contact-center':
            return API_ENDPOINTS.payment.ccInitiate;
        default:
            return API_ENDPOINTS.payment.sslInitiate;
    }
};

export const initiateSSLCommerzPayment = async (payload: any, serviceType: string = 'sms') => {
    try {
        const endpoint = getPaymentEndpoint(serviceType);
        console.log(`Using payment endpoint for ${serviceType}: ${endpoint}`);
        const response = await axios.post(`${PAYMENT_BASE_URL}${endpoint}`, payload);
        return response.data;
    } catch (error) {
        console.error('SSLCommerz Payment Error:', error);
        throw error;
    }
};
