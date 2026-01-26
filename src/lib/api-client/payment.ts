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

// Map frontend service type to backend storeType
const getStoreType = (serviceType: string): string => {
    switch (serviceType) {
        case 'hosted-pbx':
            return 'pbx';
        case 'voice-broadcast':
            return 'vbs';
        case 'contact-center':
            return 'cc';
        case 'sms':
        case 'bulk-sms':
        case 'a2p-sms':
        default:
            return 'sms';
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

/**
 * Unified Purchase API
 * - customerPrePaid = 1: Initiates payment gateway (SSLCommerz)
 * - customerPrePaid = 2: Direct purchase (skips payment, does PBX setup + package purchase)
 */
export const unifiedPurchase = async (payload: any, serviceType: string, customerPrePaid: number) => {
    try {
        const storeType = getStoreType(serviceType);
        const unifiedPayload = {
            ...payload,
            storeType,
            customerPrePaid,
        };

        console.log(`Unified Purchase API - serviceType: ${serviceType}, storeType: ${storeType}, customerPrePaid: ${customerPrePaid}`);
        console.log('Unified Purchase Payload:', unifiedPayload);

        const response = await axios.post(
            `${PAYMENT_BASE_URL}${API_ENDPOINTS.payment.unifiedPurchase}`,
            unifiedPayload
        );

        console.log('Unified Purchase Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Unified Purchase Error:', error);
        throw error;
    }
};
