// lib/api-client/payment.ts
import axios from 'axios';
import { PAYMENT_BASE_URL, API_ENDPOINTS } from '@/config/api';

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
