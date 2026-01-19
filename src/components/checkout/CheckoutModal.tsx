'use client';

import { Dialog } from '@headlessui/react';
import { useState } from 'react';
import CheckoutForm from './CheckoutForm';
import OrderSummary from './OrderSummary';
import { initiateSSLCommerzPayment } from '@/lib/api-client/payment';
import { getPartnerById, createDomain, getUserByEmail, editUser } from '@/lib/api-client/partner';
import toast from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';
import { FEATURE_FLAGS, VBS_BASE_URL, PBX_BASE_URL, API_ENDPOINTS } from '@/config/api';

interface DecodedToken {
    idPartner: number;
    email: string;
    sub?: string;
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

    const getTokenData = (): { partnerId: number | null; email: string | null; authToken: string | null } => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) return { partnerId: null, email: null, authToken: null };
            const decodedToken = jwtDecode<DecodedToken>(authToken);
            return {
                partnerId: decodedToken?.idPartner || null,
                email: decodedToken?.email || decodedToken?.sub || null,
                authToken,
            };
        } catch {
            return { partnerId: null, email: null, authToken: null };
        }
    };

    const getPartnerId = (): number | null => {
        return getTokenData().partnerId;
    };

    // Provision Hosted PBX domain after successful purchase
    const provisionHostedPbx = async (authToken: string, partnerId: number, email: string) => {
        try {
            console.log('Starting Hosted PBX provisioning...');

            // Step 1: Get partner details to get partnerName
            toast.loading(locale === 'en' ? 'Creating your PBX domain...' : 'আপনার PBX ডোমেইন তৈরি হচ্ছে...', { id: 'pbx-provision' });

            const partnerData = await getPartnerById(partnerId, authToken);
            const partnerName = partnerData.partnerName;
            console.log('Partner name:', partnerName);

            // Step 2: Create domain
            const domainResponse = await createDomain(
                {
                    domainName: partnerName,
                    enabled: true,
                    description: partnerName,
                },
                authToken
            );
            console.log('Domain created:', domainResponse);
            const domainUuid = domainResponse.domainUuid;

            // Step 3: Get user by email to get user id
            const userData = await getUserByEmail(email, authToken);
            console.log('User data:', userData);
            const userId = userData.id;

            // Step 4: Edit user to add domainUuid
            await editUser(
                {
                    id: userId,
                    pbxUuid: domainUuid,
                },
                authToken
            );
            console.log('User updated with PBX UUID');

            toast.success(
                locale === 'en'
                    ? 'Hosted PBX domain created successfully!'
                    : 'হোস্টেড PBX ডোমেইন সফলভাবে তৈরি হয়েছে!',
                { id: 'pbx-provision' }
            );

            return { success: true, domainUuid };
        } catch (error) {
            console.error('PBX provisioning failed:', error);
            toast.error(
                locale === 'en'
                    ? 'PBX domain creation failed. Please contact support.'
                    : 'PBX ডোমেইন তৈরি ব্যর্থ। অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।',
                { id: 'pbx-provision' }
            );
            return { success: false, error };
        }
    };

    // Purchase Voice Broadcast package after successful payment
    const purchaseVoiceBroadcast = async (authToken: string, partnerId: number, packageId: number, price: number) => {
        try {
            console.log('Starting Voice Broadcast package purchase...');
            toast.loading(locale === 'en' ? 'Activating your Voice Broadcast package...' : 'আপনার ভয়েস ব্রডকাস্ট প্যাকেজ সক্রিয় হচ্ছে...', { id: 'vbs-purchase' });

            // Calculate VAT (15% of price)
            const vat = Math.round(price * 0.15);
            const total = price + vat;

            // Calculate expiry date (30 days from now)
            const validity = 2592000; // 30 days in seconds
            const expiryDate = new Date(Date.now() + validity * 1000).toISOString().slice(0, 19);

            const payload = {
                idPackage: packageId,
                idPartner: partnerId,
                purchaseDate: null,
                status: 'ACTIVE',
                paid: total,
                autoRenewalStatus: true,
                price: price,
                vat: vat,
                ait: 0,
                priority: 1,
                discount: 0,
                onSelectPriority: -1,
                expiryDate: expiryDate,
                total: total,
                expireDate: null,
                currency: null,
                validity: validity,
            };

            console.log('Voice Broadcast purchase payload:', payload);

            const response = await fetch(`${VBS_BASE_URL}${API_ENDPOINTS.package.purchasePackage}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to purchase Voice Broadcast package');
            }

            const data = await response.json();
            console.log('Voice Broadcast purchase response:', data);

            toast.success(
                locale === 'en'
                    ? 'Voice Broadcast package activated successfully!'
                    : 'ভয়েস ব্রডকাস্ট প্যাকেজ সফলভাবে সক্রিয় হয়েছে!',
                { id: 'vbs-purchase' }
            );

            return { success: true, data };
        } catch (error) {
            console.error('Voice Broadcast purchase failed:', error);
            toast.error(
                locale === 'en'
                    ? 'Voice Broadcast activation failed. Please contact support.'
                    : 'ভয়েস ব্রডকাস্ট সক্রিয়করণ ব্যর্থ। অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।',
                { id: 'vbs-purchase' }
            );
            return { success: false, error };
        }
    };

    // Purchase Hosted PBX package after successful payment
    const purchaseHostedPbx = async (authToken: string, partnerId: number, packageId: number, price: number) => {
        try {
            console.log('Starting Hosted PBX package purchase...');
            toast.loading(locale === 'en' ? 'Activating your Hosted PBX package...' : 'আপনার হোস্টেড PBX প্যাকেজ সক্রিয় হচ্ছে...', { id: 'pbx-purchase' });

            // Calculate VAT (15% of price)
            const vat = Math.round(price * 0.15);
            const total = price + vat;

            // Calculate expiry date (30 days from now)
            const validity = 2592000; // 30 days in seconds
            const expiryDate = new Date(Date.now() + validity * 1000).toISOString().slice(0, 19);

            const payload = {
                idPackage: packageId,
                idPartner: partnerId,
                purchaseDate: null,
                status: 'ACTIVE',
                paid: total,
                autoRenewalStatus: true,
                price: price,
                vat: vat,
                ait: 0,
                priority: 1,
                discount: 0,
                onSelectPriority: -1,
                expiryDate: expiryDate,
                total: total,
                expireDate: null,
                currency: null,
                validity: validity,
            };

            console.log('Hosted PBX purchase payload:', payload);

            const response = await fetch(`${PBX_BASE_URL}${API_ENDPOINTS.package.purchasePackage}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to purchase Hosted PBX package');
            }

            const data = await response.json();
            console.log('Hosted PBX purchase response:', data);

            toast.success(
                locale === 'en'
                    ? 'Hosted PBX package activated successfully!'
                    : 'হোস্টেড PBX প্যাকেজ সফলভাবে সক্রিয় হয়েছে!',
                { id: 'pbx-purchase' }
            );

            return { success: true, data };
        } catch (error) {
            console.error('Hosted PBX purchase failed:', error);
            toast.error(
                locale === 'en'
                    ? 'Hosted PBX activation failed. Please contact support.'
                    : 'হোস্টেড PBX সক্রিয়করণ ব্যর্থ। অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।',
                { id: 'pbx-purchase' }
            );
            return { success: false, error };
        }
    };

    // Map package string ID to integer ID based on service type
    const getPackageIdInt = (packageId: string, service: string): number => {
        const packageIdMap: { [key: string]: { [key: string]: number } } = {
            'hosted-pbx': {
                'bronze': 9132,
                'silver': 9133,
                'gold': 9134,
            },
            'voice-broadcast': {
                'basic': 9135,
                'standard': 9136,
                'enterprise': 9137,
            },
            'contact-center': {
                'basic': 9138,
            },
        };
        return packageIdMap[service]?.[packageId] || 9132;
    };

    const handleCheckout = async () => {
        if (!selectedPayment) {
            toast.error(locale === 'en' ? 'Please select a payment method.' : 'অনুগ্রহ করে একটি পেমেন্ট পদ্ধতি নির্বাচন করুন।');
            return;
        }

        const { partnerId, email, authToken } = getTokenData();
        if (!partnerId || !authToken) {
            toast.error(locale === 'en' ? 'Please login to continue.' : 'চালিয়ে যেতে অনুগ্রহ করে লগইন করুন।');
            return;
        }

        setLoading(true);
        try {
            // Check if payment is disabled in config
            if (!FEATURE_FLAGS.PAYMENT_ENABLED) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                toast.success(locale === 'en' ? 'Purchase completed successfully!' : 'ক্রয় সফল হয়েছে!');

                // Provision Hosted PBX domain and purchase package after successful purchase
                if (serviceType === 'hosted-pbx' && email) {
                    await provisionHostedPbx(authToken, partnerId, email);
                    const packageId = getPackageIdInt(pkg.id, serviceType);
                    await purchaseHostedPbx(authToken, partnerId, packageId, pkg.price);
                }

                // Purchase Voice Broadcast package after successful purchase
                if (serviceType === 'voice-broadcast') {
                    const packageId = getPackageIdInt(pkg.id, serviceType);
                    await purchaseVoiceBroadcast(authToken, partnerId, packageId, pkg.price);
                }

                onClose();
                return;
            }

            // Get partner details for customer info
            toast.loading(locale === 'en' ? 'Preparing payment...' : 'পেমেন্ট প্রস্তুত হচ্ছে...', { id: 'payment-prep' });
            const partnerData = await getPartnerById(partnerId, authToken);
            toast.dismiss('payment-prep');

            // Set product name and category based on service type
            const getProductDetails = () => {
                switch (serviceType) {
                    case 'hosted-pbx':
                        return { name: `Hosted PBX - ${pkg.name}`, category: 'Hosted PBX' };
                    case 'voice-broadcast':
                        return { name: `Voice Broadcast - ${pkg.name}`, category: 'Voice Broadcast' };
                    case 'contact-center':
                        return { name: `Contact Center - ${pkg.name}`, category: 'Contact Center' };
                    default:
                        return { name: pkg.name, category: 'SMS' };
                }
            };
            const { name: productName, category: productCategory } = getProductDetails();

            // Clean phone number (remove + if present)
            const cleanPhone = partnerData.telephone?.replace('+', '') || '';

            // Calculate VAT (15% of price) and total
            const vatAmount = Math.round(pkg.price * 0.15);
            const totalAmount = pkg.price + vatAmount;

            const payload = {
                idPackage: getPackageIdInt(pkg.id, serviceType),
                idPartner: partnerId,
                cusName: partnerData.partnerName || partnerData.alternateNameInvoice,
                cusEmail: partnerData.email,
                cusAdd1: partnerData.address1 || partnerData.city,
                cusCity: partnerData.city,
                cusPostcode: partnerData.postalCode,
                cusCountry: partnerData.country || 'Bangladesh',
                cusPhone: cleanPhone,
                productName: productName,
                productCategory: productCategory,
                productType: serviceType,
                topupNumber: cleanPhone,
                countryTopup: 'Bangladesh',
                purchaseDate: null,
                status: 'ACTIVE',
                autoRenewalStatus: ['hosted-pbx', 'voice-broadcast', 'contact-center'].includes(serviceType),
                price: pkg.price,
                vat: vatAmount,
                ait: 0,
                priority: 2,
                discount: 0,
                currency: 'BDT',
                paid: 1,
                total: totalAmount,
                validity: ['hosted-pbx', 'voice-broadcast', 'contact-center'].includes(serviceType) ? 2592000 : (pkg.validity ? pkg.validity * 86400 : 2592000), // 30 days in seconds
            };

            console.log('Payment payload:', payload);
            console.log('Service type:', serviceType);

            const response = await initiateSSLCommerzPayment(payload, serviceType);
            console.log('Payment response:', response);

            // Get redirect URL from response
            const redirectUrl = response.redirectUrl || response.GatewayPageURL || response;

            if (redirectUrl && typeof redirectUrl === 'string' && redirectUrl.startsWith('http')) {
                // For real payment, the provisioning should happen after payment callback
                // Store the service type and data in session for callback handling
                sessionStorage.setItem('pendingServiceProvision', JSON.stringify({
                    serviceType,
                    partnerId,
                    email,
                    packageId: pkg.id,
                    packageIdInt: getPackageIdInt(pkg.id, serviceType),
                    packageName: pkg.name,
                    price: pkg.price
                }));
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
