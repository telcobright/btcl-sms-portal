// lib/api-client/payment.ts
import axios from 'axios';
import { PAYMENT_BASE_URL, API_ENDPOINTS } from '@/config/api';

export const initiateSSLCommerzPayment = async (payload: any) => {
    try {
        const response = await axios.post(`${PAYMENT_BASE_URL}${API_ENDPOINTS.payment.sslInitiate}`, payload);
        return response.data;
    } catch (error) {
        console.error('SSLCommerz Payment Error:', error);
        throw error;
    }
};