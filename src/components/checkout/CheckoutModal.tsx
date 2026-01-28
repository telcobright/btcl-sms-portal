'use client';

import { Dialog } from '@headlessui/react';
import React, { useState, useEffect } from 'react';
import CheckoutForm from './CheckoutForm';
import OrderSummary from './OrderSummary';
import { unifiedPurchase } from '@/lib/api-client/payment';
import { getPartnerById, getUserByEmail, editUser } from '@/lib/api-client/partner';
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
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showVbsSuccessPopup, setShowVbsSuccessPopup] = useState(false);
    const [successEmail, setSuccessEmail] = useState('');
    const [userHasPbx, setUserHasPbx] = useState(false);
    const [purchasedPackageName, setPurchasedPackageName] = useState('');
    const [customerPrePaid, setCustomerPrePaid] = useState<number | null>(null);
    const [partnerDataLoading, setPartnerDataLoading] = useState(true);
    const [agentCount, setAgentCount] = useState(1);

    // Fetch partner data to get customerPrePaid when modal opens
    useEffect(() => {
        const fetchPartnerPrePaidStatus = async () => {
            if (!isOpen) return;

            try {
                setPartnerDataLoading(true);
                const { partnerId, authToken } = getTokenData();

                if (!partnerId || !authToken) {
                    setCustomerPrePaid(1); // Default to payment gateway
                    setPartnerDataLoading(false);
                    return;
                }

                const partnerData = await getPartnerById(partnerId, authToken);
                const prePaidValue = partnerData.customerPrePaid || 1;
                setCustomerPrePaid(prePaidValue);

                // Auto-select SSLCommerz if customerPrePaid is 1
                if (prePaidValue === 1) {
                    setSelectedPayment('SSLcommerz');
                }
                // If customerPrePaid is 2, no payment method needed but set a placeholder
                if (prePaidValue === 2) {
                    setSelectedPayment('direct');
                }
            } catch (error) {
                console.error('Failed to fetch partner prePaid status:', error);
                setCustomerPrePaid(1); // Default to payment gateway on error
            } finally {
                setPartnerDataLoading(false);
            }
        };

        fetchPartnerPrePaidStatus();
    }, [isOpen]);

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
        // Only require payment method if customerPrePaid is 1 (payment gateway)
        if (customerPrePaid === 1 && !selectedPayment) {
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

                // Show success popup for Hosted PBX
                if (serviceType === 'hosted-pbx' && email) {
                    // Check if user already has PBX
                    try {
                        const userData = await getUserByEmail(email, authToken!);
                        setUserHasPbx(!!userData?.pbxUuid);
                    } catch (e) {
                        setUserHasPbx(false);
                    }
                    setSuccessEmail(email);
                    setPurchasedPackageName(pkg.name);
                    setShowSuccessPopup(true);
                    setLoading(false);
                    return;
                }

                // Show success popup for Voice Broadcast
                if (serviceType === 'voice-broadcast' && email) {
                    setSuccessEmail(email);
                    setShowVbsSuccessPopup(true);
                    setLoading(false);
                    return;
                }

                onClose();
                return;
            }

            // Get partner details for customer info and customerPrePaid value
            toast.loading(locale === 'en' ? 'Preparing purchase...' : 'ক্রয় প্রস্তুত হচ্ছে...', { id: 'payment-prep' });
            const partnerData = await getPartnerById(partnerId, authToken);
            toast.dismiss('payment-prep');

            // Get customerPrePaid from partner data (1 = payment gateway, 2 = direct purchase)
            const customerPrePaid = partnerData.customerPrePaid || 1;
            console.log('Customer PrePaid type:', customerPrePaid);

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

            // For Contact Center, calculate price based on agentCount state
            const basePrice = (serviceType === 'contact-center') ? (pkg.price * agentCount) : pkg.price;
            const quantity = (serviceType === 'contact-center') ? agentCount : 1;

            // Calculate VAT (15% of price) and total
            const vatAmount = Math.round(basePrice * 0.15);
            const totalAmount = basePrice + vatAmount;

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
                price: basePrice,
                vat: vatAmount,
                ait: 0,
                priority: 2,
                discount: 0,
                currency: 'BDT',
                paid: 1,
                total: totalAmount,
                validity: ['hosted-pbx', 'voice-broadcast', 'contact-center'].includes(serviceType) ? 2592000 : (pkg.validity ? pkg.validity * 86400 : 2592000), // 30 days in seconds
                ...(serviceType === 'contact-center' && { quantity: quantity }), // Include quantity for CC
            };

            console.log('Unified Purchase payload:', payload);
            console.log('Service type:', serviceType);
            console.log('Customer PrePaid:', customerPrePaid);

            // Call unified purchase API
            const response = await unifiedPurchase(payload, serviceType, customerPrePaid);
            console.log('Unified Purchase response:', response);

            // customerPrePaid = 1: Payment gateway initiated, redirect to payment URL
            if (customerPrePaid === 1) {
                const redirectUrl = response.redirectUrl || response.GatewayPageURL || response;

                if (redirectUrl && typeof redirectUrl === 'string' && redirectUrl.startsWith('http')) {
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
            }
            // customerPrePaid = 2: Direct purchase completed (no payment gateway)
            else if (customerPrePaid === 2) {
                if (response.status === 'SUCCESS') {
                    toast.success(locale === 'en' ? 'Purchase completed successfully!' : 'ক্রয় সফল হয়েছে!');

                    // Show success popup for Hosted PBX
                    if (serviceType === 'hosted-pbx' && email) {
                        // Check if user already has PBX
                        try {
                            const userData = await getUserByEmail(email, authToken);
                            setUserHasPbx(!!userData?.pbxUuid);
                        } catch (e) {
                            setUserHasPbx(false);
                        }
                        setSuccessEmail(email);
                        setPurchasedPackageName(pkg.name);
                        setShowSuccessPopup(true);
                        setLoading(false);
                        return;
                    }

                    // Show success popup for Voice Broadcast
                    if (serviceType === 'voice-broadcast' && email) {
                        setSuccessEmail(email);
                        setPurchasedPackageName(pkg.name);
                        setShowVbsSuccessPopup(true);
                        setLoading(false);
                        return;
                    }

                    onClose();
                } else {
                    toast.error(response.message || (locale === 'en' ? 'Purchase failed. Please try again.' : 'ক্রয় ব্যর্থ। আবার চেষ্টা করুন।'));
                }
            }
        } catch (error) {
            console.error('Purchase failed:', error);
            toast.error(locale === 'en' ? 'Purchase failed. Please try again.' : 'ক্রয় ব্যর্থ। আবার চেষ্টা করুন।');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSuccessPopup = () => {
        setShowSuccessPopup(false);
        setShowVbsSuccessPopup(false);
        onClose();
    };

    // Success Popup for Hosted PBX
    if (showSuccessPopup) {
        return (
            <Dialog open={isOpen} onClose={handleCloseSuccessPopup} className="relative z-50 font-bengali">
                <div className="fixed inset-0 bg-black/60" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-6 overflow-y-auto">
                    <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Success Header */}
                        <div className="bg-gradient-to-r from-[#00A651] to-[#004225] px-6 py-8 text-center">
                            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                                <svg
                                    className="w-12 h-12 text-[#00A651]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">
                                {locale === 'en' ? 'Congratulations!' : 'অভিনন্দন!'}
                            </h2>
                            <p className="text-green-100 mt-2">
                                {locale === 'en'
                                    ? (userHasPbx ? 'Package purchased successfully!' : 'Your Hosted PBX is ready!')
                                    : (userHasPbx ? 'প্যাকেজ সফলভাবে ক্রয় হয়েছে!' : 'আপনার হোস্টেড PBX প্রস্তুত!')}
                            </p>
                        </div>

                        {/* Package Details or Credentials Section */}
                        <div className="px-6 py-6">
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                {userHasPbx ? (
                                    <>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <svg className="w-5 h-5 mr-2 text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {locale === 'en' ? 'Package Purchased' : 'প্যাকেজ ক্রয় হয়েছে'}
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-gray-600">{locale === 'en' ? 'Package' : 'প্যাকেজ'}</span>
                                                <span className="font-semibold text-[#00A651]">{purchasedPackageName}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-gray-600">{locale === 'en' ? 'Status' : 'স্ট্যাটাস'}</span>
                                                <span className="font-semibold text-green-600">{locale === 'en' ? 'Active' : 'সক্রিয়'}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <svg className="w-5 h-5 mr-2 text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                            {locale === 'en' ? 'Your Login Credentials' : 'আপনার লগইন তথ্য'}
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-gray-600">{locale === 'en' ? 'Email' : 'ইমেইল'}</span>
                                                <span className="font-semibold text-gray-900">{successEmail}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-gray-600">{locale === 'en' ? 'Password' : 'পাসওয়ার্ড'}</span>
                                                <span className="font-mono font-semibold text-gray-900 bg-gray-200 px-3 py-1 rounded">11111111</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Portal Link */}
                            <div className="mt-6">
                                <p className="text-sm text-gray-600 mb-3 text-center">
                                    {locale === 'en'
                                        ? 'Access your PBX User Portal:'
                                        : 'আপনার PBX ইউজার পোর্টালে প্রবেশ করুন:'}
                                </p>
                                <a
                                    href="https://hippbx.btcliptelephony.gov.bd:5174/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full bg-[#00A651] hover:bg-[#004225] text-white text-center font-medium py-3 px-4 rounded-lg transition-colors"
                                >
                                    {locale === 'en' ? 'Go to PBX Portal' : 'PBX পোর্টালে যান'} →
                                </a>
                            </div>

                            {/* Note - only show for new users */}
                            {!userHasPbx && (
                                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                    <p className="text-xs text-amber-800">
                                        <strong>{locale === 'en' ? 'Note:' : 'নোট:'}</strong>{' '}
                                        {locale === 'en'
                                            ? 'Please change your password after first login for security.'
                                            : 'নিরাপত্তার জন্য প্রথম লগইনের পর আপনার পাসওয়ার্ড পরিবর্তন করুন।'}
                                    </p>
                                </div>
                            )}

                            {/* Close Button */}
                            <button
                                onClick={handleCloseSuccessPopup}
                                className="w-full mt-4 border border-gray-300 text-gray-700 hover:bg-gray-50 text-center font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                {locale === 'en' ? 'Close' : 'বন্ধ করুন'}
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        );
    }

    // Success Popup for Voice Broadcast
    if (showVbsSuccessPopup) {
        return (
            <Dialog open={isOpen} onClose={handleCloseSuccessPopup} className="relative z-50 font-bengali">
                <div className="fixed inset-0 bg-black/60" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-6 overflow-y-auto">
                    <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Success Header */}
                        <div className="bg-gradient-to-r from-[#00A651] to-[#004225] px-6 py-8 text-center">
                            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                                <svg
                                    className="w-12 h-12 text-[#00A651]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">
                                {locale === 'en' ? 'Congratulations!' : 'অভিনন্দন!'}
                            </h2>
                            <p className="text-green-100 mt-2">
                                {locale === 'en'
                                    ? 'Your Voice Broadcast is ready!'
                                    : 'আপনার ভয়েস ব্রডকাস্ট প্রস্তুত!'}
                            </p>
                        </div>

                        {/* Credentials Section */}
                        <div className="px-6 py-6">
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    {locale === 'en' ? 'Your Login Credentials' : 'আপনার লগইন তথ্য'}
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600">{locale === 'en' ? 'Email' : 'ইমেইল'}</span>
                                        <span className="font-semibold text-gray-900">{successEmail}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600">{locale === 'en' ? 'Password' : 'পাসওয়ার্ড'}</span>
                                        <span className="font-mono font-semibold text-gray-900 bg-gray-200 px-3 py-1 rounded">11111111</span>
                                    </div>
                                </div>
                            </div>

                            {/* Portal Link */}
                            <div className="mt-6">
                                <p className="text-sm text-gray-600 mb-3 text-center">
                                    {locale === 'en'
                                        ? 'Access your Voice Broadcast Portal:'
                                        : 'আপনার ভয়েস ব্রডকাস্ট পোর্টালে প্রবেশ করুন:'}
                                </p>
                                <a
                                    href="https://vbs.btcliptelephony.gov.bd/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full bg-[#00A651] hover:bg-[#004225] text-white text-center font-medium py-3 px-4 rounded-lg transition-colors"
                                >
                                    {locale === 'en' ? 'Go to VBS Portal' : 'VBS পোর্টালে যান'} →
                                </a>
                            </div>

                            {/* Note */}
                            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-xs text-amber-800">
                                    <strong>{locale === 'en' ? 'Note:' : 'নোট:'}</strong>{' '}
                                    {locale === 'en'
                                        ? 'Please change your password after first login for security.'
                                        : 'নিরাপত্তার জন্য প্রথম লগইনের পর আপনার পাসওয়ার্ড পরিবর্তন করুন।'}
                                </p>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={handleCloseSuccessPopup}
                                className="w-full mt-4 border border-gray-300 text-gray-700 hover:bg-gray-50 text-center font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                {locale === 'en' ? 'Close' : 'বন্ধ করুন'}
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        );
    }

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
                            customerPrePaid={customerPrePaid}
                        />
                    </div>
                    <div className="w-full md:w-[380px]">
                        {/* Agent Quantity Selector for Contact Center */}
                        {serviceType === 'contact-center' && (
                            <div className="bg-white rounded-xl shadow-md p-6 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {locale === 'en' ? 'Select Number of Agents' : 'এজেন্ট সংখ্যা নির্বাচন করুন'}
                                </h3>
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setAgentCount(prev => Math.max(1, prev - 1))}
                                        className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-2xl transition-colors flex items-center justify-center"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={agentCount}
                                        onChange={(e) => setAgentCount(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-20 text-center text-2xl font-bold border border-gray-300 rounded-lg py-2"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setAgentCount(prev => prev + 1)}
                                        className="w-12 h-12 rounded-full bg-[#00A651] hover:bg-[#008f44] text-white font-bold text-2xl transition-colors flex items-center justify-center"
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="mt-4 text-center">
                                    <span className="text-gray-600">{locale === 'en' ? 'Price per agent:' : 'প্রতি এজেন্ট মূল্য:'} </span>
                                    <span className="font-semibold">৳{pkg?.price?.toLocaleString() || 0}/month</span>
                                </div>
                            </div>
                        )}
                        <OrderSummary
                            pkg={serviceType === 'contact-center' ? { ...pkg, quantity: agentCount, totalPrice: (pkg?.price || 0) * agentCount } : pkg}
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
