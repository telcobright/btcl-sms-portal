'use client';

import { Dialog } from '@headlessui/react';
import { useState } from 'react';
import CheckoutForm from './CheckoutForm';
import OrderSummary from './OrderSummary';
import { initiateSSLCommerzPayment } from '@/lib/api-client/payment';
import toast from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    idPartner: number;
    [key: string]: any;
}

export default function CheckoutModal({ pkg, isOpen, onClose, serviceType = 'sms', locale = 'en' }: any) {

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        city: '',
        streetAddress: '',
        zipCode: '',
    });
    const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFormChange = (data: typeof formData) => {
        setFormData(data);
    };

    const handleSelectPayment = (method: string) => {
        setSelectedPayment(method);
    };

    const getPartnerId = (): number | null => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) return null;
            const decodedToken = jwtDecode<DecodedToken>(authToken);
            return decodedToken?.idPartner || null;
        } catch {
            return null;
        }
    };

    const handleCheckout = async () => {
        if (!selectedPayment) {
            toast.error(locale === 'en' ? 'Please select a payment method.' : 'অনুগ্রহ করে একটি পেমেন্ট পদ্ধতি নির্বাচন করুন।');
            return;
        }

        const partnerId = getPartnerId();
        if (!partnerId) {
            toast.error(locale === 'en' ? 'Please login to continue.' : 'চালিয়ে যেতে অনুগ্রহ করে লগইন করুন।');
            return;
        }

        setLoading(true);
        try {
            const productName = serviceType === 'hosted-pbx' ? `Hosted PBX - ${pkg.name}` : pkg.name;
            const productCategory = serviceType === 'hosted-pbx' ? 'Hosted PBX' : 'SMS';

            const payload = {
                idPackage: pkg.id,
                idPartner: partnerId,
                cusName: formData.fullName,
                cusEmail: formData.email,
                cusAdd1: formData.streetAddress,
                cusCity: formData.city,
                cusPostcode: formData.zipCode,
                cusCountry: 'Bangladesh',
                cusPhone: formData.phone,
                productName: productName,
                productCategory: productCategory,
                productType: serviceType,
                topupNumber: '',
                countryTopup: 'Bangladesh',
                purchaseDate: null,
                status: 'ACTIVE',
                autoRenewalStatus: serviceType === 'hosted-pbx',
                price: pkg.price,
                vat: 0,
                ait: 0,
                priority: 2,
                discount: 0,
                currency: 'BDT',
                paid: 1,
                total: pkg.price,
                validity: serviceType === 'hosted-pbx' ? 2592000 : (pkg.validity ? pkg.validity * 86400 : 2592000),
            };

            const response = await initiateSSLCommerzPayment(payload);
            const redirectUrl = response.redirectUrl || response.GatewayPageURL;

            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                toast.error(locale === 'en' ? 'Payment URL not received. Please try again.' : 'পেমেন্ট URL পাওয়া যায়নি। আবার চেষ্টা করুন।');
            }
        } catch (error) {
            console.error('Payment initiation failed:', error);
            toast.error(locale === 'en' ? 'Payment initiation failed.' : 'পেমেন্ট শুরু করতে ব্যর্থ।');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50 font-bengali">
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-6 overflow-y-auto">
                <Dialog.Panel className="w-full max-w-5xl bg-white rounded-xl shadow-card p-8 flex flex-col md:flex-row gap-10 my-8">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-4xl font-bold text-btcl-gray-900">
                                {locale === 'en' ? 'Checkout' : 'চেকআউট'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <CheckoutForm
                            formData={formData}
                            onFormChange={handleFormChange}
                            selectedPayment={selectedPayment}
                            onSelectPayment={handleSelectPayment}
                        />
                    </div>
                    <div className="w-full md:w-[380px]">
                        <OrderSummary
                            pkg={pkg}
                            onCheckout={handleCheckout}
                            loading={loading}
                            serviceType={serviceType}
                            locale={locale}
                        />
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
