'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { VBS_BASE_URL, PBX_BASE_URL, API_ENDPOINTS } from '@/config/api'
import { getPartnerById, createDomain, createGateway, createRoute, getUserByEmail, editUser } from '@/lib/api-client/partner'
import toast, { Toaster } from 'react-hot-toast'

interface PendingProvision {
    serviceType: string;
    partnerId: number;
    email: string;
    packageId: string;
    packageIdInt: number;
    packageName: string;
    price: number;
}

function SuccessContent() {
    const searchParams = useSearchParams()
    const transactionId = searchParams.get('tran_id') || searchParams.get('tranId')
    const amount = searchParams.get('amount')
    const [provisioning, setProvisioning] = useState(false)
    const [provisionComplete, setProvisionComplete] = useState(false)
    const [showSuccessPopup, setShowSuccessPopup] = useState(false)
    const [showVbsSuccessPopup, setShowVbsSuccessPopup] = useState(false)
    const [successEmail, setSuccessEmail] = useState('')

    // Purchase Voice Broadcast package
    const purchaseVoiceBroadcast = async (authToken: string, partnerId: number, packageId: number, price: number) => {
        try {
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
            return { success: true, data };
        } catch (error) {
            console.error('Voice Broadcast purchase failed:', error);
            return { success: false, error };
        }
    };

    // Purchase Hosted PBX package
    const purchaseHostedPbx = async (authToken: string, partnerId: number, packageId: number, price: number) => {
        try {
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
            return { success: true, data };
        } catch (error) {
            console.error('Hosted PBX purchase failed:', error);
            return { success: false, error };
        }
    };

    // Provision Hosted PBX domain, gateway, route after successful payment
    const provisionHostedPbx = async (authToken: string, partnerId: number, email: string) => {
        try {
            console.log('Starting Hosted PBX provisioning...');

            // Step 1: Get partner details to get partnerName
            toast.loading('Creating your PBX domain...', { id: 'pbx-provision' });

            const partnerData = await getPartnerById(partnerId, authToken);
            const partnerName = partnerData.partnerName;
            console.log('Partner name:', partnerName);

            // Generate domain name based on partner name words
            // If 1 word: use partnerName.btcliptelephony.gov.bd
            // If more than 1 word: use firstWord.btcliptelephony.gov.bd
            const words = partnerName.trim().split(/\s+/);
            const domainPrefix = words.length === 1 ? words[0].toLowerCase() : words[0].toLowerCase();
            const domainName = `${domainPrefix}.btcliptelephony.gov.bd`;
            console.log('Generated domain name:', domainName);

            // Step 2: Create domain
            const domainResponse = await createDomain(
                {
                    domainName: domainName,
                    enabled: true,
                    description: partnerName,
                },
                authToken
            );
            console.log('Domain created:', domainResponse);
            const domainUuid = domainResponse.domainUuid;

            // Step 3: Create gateway for the domain
            console.log('Creating gateway for domain:', domainName);
            const gatewayResponse = await createGateway(
                {
                    domainUuid: domainUuid,
                    gateway: 'Cat',
                    proxy: '192.168.24.101:5060',
                    fromDomain: domainName,
                    profile: 'external',
                    context: 'public',
                    register: 'false',
                    callerIdInFrom: 'true',
                    enabled: 'true',
                    action: 'start',
                },
                authToken
            );
            console.log('Gateway created:', gatewayResponse);

            // Step 4: Create route for the domain
            console.log('Creating route for domain:', domainName);
            const routeResponse = await createRoute(
                {
                    routeName: domainName,
                    description: domainName,
                    field5: domainName,
                    zone: 'dhaka',
                    nationalOrInternational: 1,
                    field4: 5,
                    switchId: 1,
                    idPartner: partnerId,
                    metaData: {
                        sipProfileName: '',
                    },
                },
                authToken
            );
            console.log('Route created:', routeResponse);

            // Step 5: Get user by email to get user id
            const userData = await getUserByEmail(email, authToken);
            console.log('User data:', userData);
            const userId = userData.id;

            // Step 6: Edit user to add domainUuid
            await editUser(
                {
                    id: userId,
                    pbxUuid: domainUuid,
                },
                authToken
            );
            console.log('User updated with PBX UUID');

            toast.success('Hosted PBX domain created successfully!', { id: 'pbx-provision' });

            return { success: true, domainUuid };
        } catch (error) {
            console.error('PBX provisioning failed:', error);
            toast.error('PBX domain creation failed. Please contact support.', { id: 'pbx-provision' });
            return { success: false, error };
        }
    };

    // Handle pending service provision after successful payment
    useEffect(() => {
        const handlePendingProvision = async () => {
            const pendingData = sessionStorage.getItem('pendingServiceProvision');
            if (!pendingData) return;

            try {
                const provision: PendingProvision = JSON.parse(pendingData);
                const authToken = localStorage.getItem('authToken');

                if (!authToken) {
                    console.error('No auth token found for provisioning');
                    return;
                }

                // Handle Voice Broadcast purchase
                if (provision.serviceType === 'voice-broadcast') {
                    setProvisioning(true);
                    toast.loading('Activating your Voice Broadcast package...', { id: 'vbs-purchase' });

                    const result = await purchaseVoiceBroadcast(
                        authToken,
                        provision.partnerId,
                        provision.packageIdInt,
                        provision.price
                    );

                    if (result.success) {
                        toast.success('Voice Broadcast package activated successfully!', { id: 'vbs-purchase' });
                        // Show success popup with credentials
                        setSuccessEmail(provision.email);
                        setShowVbsSuccessPopup(true);
                    } else {
                        toast.error('Voice Broadcast activation failed. Please contact support.', { id: 'vbs-purchase' });
                    }

                    setProvisionComplete(true);
                    setProvisioning(false);
                }

                // Handle Hosted PBX purchase
                if (provision.serviceType === 'hosted-pbx') {
                    setProvisioning(true);

                    // Step 1: Provision domain, gateway, route first
                    const provisionResult = await provisionHostedPbx(
                        authToken,
                        provision.partnerId,
                        provision.email
                    );

                    // Step 2: Purchase the package
                    toast.loading('Activating your Hosted PBX package...', { id: 'pbx-purchase' });
                    const purchaseResult = await purchaseHostedPbx(
                        authToken,
                        provision.partnerId,
                        provision.packageIdInt,
                        provision.price
                    );

                    if (purchaseResult.success) {
                        toast.success('Hosted PBX package activated successfully!', { id: 'pbx-purchase' });
                    }

                    // Show success popup with credentials
                    if (provisionResult.success || purchaseResult.success) {
                        setSuccessEmail(provision.email);
                        setShowSuccessPopup(true);
                    }

                    setProvisionComplete(true);
                    setProvisioning(false);
                }

                // Clear the pending provision data
                sessionStorage.removeItem('pendingServiceProvision');
            } catch (error) {
                console.error('Error processing pending provision:', error);
                setProvisioning(false);
            }
        };

        handlePendingProvision();
    }, []);

    // Show success popup for Hosted PBX
    if (showSuccessPopup) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Toaster position="top-center" />

                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-center items-center h-16">
                            <Link href="/en" className="flex items-center space-x-2">
                                <Image
                                    src="/btcllogo.png"
                                    alt="BTCL Logo"
                                    width={124}
                                    height={100}
                                    className="rounded-lg object-contain"
                                />
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Success Popup Content */}
                <main className="flex-1 flex items-center justify-center px-4 py-12">
                    <div className="max-w-md w-full">
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
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
                                <h2 className="text-2xl font-bold text-white">Congratulations!</h2>
                                <p className="text-green-100 mt-2">Your Hosted PBX is ready!</p>
                            </div>

                            {/* Credentials Section */}
                            <div className="px-6 py-6">
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                        Your Login Credentials
                                    </h3>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-gray-600">Email</span>
                                            <span className="font-semibold text-gray-900">{successEmail}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-gray-600">Password</span>
                                            <span className="font-mono font-semibold text-gray-900 bg-gray-200 px-3 py-1 rounded">11111111</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Portal Link */}
                                <div className="mt-6">
                                    <p className="text-sm text-gray-600 mb-3 text-center">
                                        Access your PBX User Portal:
                                    </p>
                                    <a
                                        href="https://hippbx.btcliptelephony.gov.bd:5174/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full bg-[#00A651] hover:bg-[#004225] text-white text-center font-medium py-3 px-4 rounded-lg transition-colors"
                                    >
                                        Go to PBX Portal →
                                    </a>
                                </div>

                                {/* Note */}
                                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                    <p className="text-xs text-amber-800">
                                        <strong>Note:</strong> Please change your password after first login for security.
                                    </p>
                                </div>

                                {/* Dashboard Button */}
                                <Link
                                    href="/en/dashboard"
                                    className="block w-full mt-4 border border-gray-300 text-gray-700 hover:bg-gray-50 text-center font-medium py-3 px-4 rounded-lg transition-colors"
                                >
                                    Go to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 py-4">
                    <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Bangladesh Telecommunications Company Limited. All rights reserved.
                    </div>
                </footer>
            </div>
        );
    }

    // Show success popup for Voice Broadcast
    if (showVbsSuccessPopup) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Toaster position="top-center" />

                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-center items-center h-16">
                            <Link href="/en" className="flex items-center space-x-2">
                                <Image
                                    src="/btcllogo.png"
                                    alt="BTCL Logo"
                                    width={124}
                                    height={100}
                                    className="rounded-lg object-contain"
                                />
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Success Popup Content */}
                <main className="flex-1 flex items-center justify-center px-4 py-12">
                    <div className="max-w-md w-full">
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
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
                                <h2 className="text-2xl font-bold text-white">Congratulations!</h2>
                                <p className="text-green-100 mt-2">Your Voice Broadcast is ready!</p>
                            </div>

                            {/* Credentials Section */}
                            <div className="px-6 py-6">
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                        Your Login Credentials
                                    </h3>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-gray-600">Email</span>
                                            <span className="font-semibold text-gray-900">{successEmail}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-gray-600">Password</span>
                                            <span className="font-mono font-semibold text-gray-900 bg-gray-200 px-3 py-1 rounded">11111111</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Portal Link */}
                                <div className="mt-6">
                                    <p className="text-sm text-gray-600 mb-3 text-center">
                                        Access your Voice Broadcast Portal:
                                    </p>
                                    <a
                                        href="https://vbs.btcliptelephony.gov.bd/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full bg-[#00A651] hover:bg-[#004225] text-white text-center font-medium py-3 px-4 rounded-lg transition-colors"
                                    >
                                        Go to Voice Broadcast Portal →
                                    </a>
                                </div>

                                {/* Note */}
                                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                    <p className="text-xs text-amber-800">
                                        <strong>Note:</strong> Please change your password after first login for security.
                                    </p>
                                </div>

                                {/* Dashboard Button */}
                                <Link
                                    href="/en/dashboard"
                                    className="block w-full mt-4 border border-gray-300 text-gray-700 hover:bg-gray-50 text-center font-medium py-3 px-4 rounded-lg transition-colors"
                                >
                                    Go to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 py-4">
                    <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Bangladesh Telecommunications Company Limited. All rights reserved.
                    </div>
                </footer>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-center" />

            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-16">
                        <Link href="/en" className="flex items-center space-x-2">
                            <Image
                                src="/btcllogo.png"
                                alt="BTCL Logo"
                                width={124}
                                height={100}
                                className="rounded-lg object-contain"
                            />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                        {/* Success Icon Header */}
                        <div className="bg-gradient-to-r from-[#00A651] to-[#004225] px-6 py-8 text-center">
                            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4">
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
                            <h1 className="text-2xl font-bold text-white">Payment Successful!</h1>
                            <p className="text-green-100 mt-2">Your transaction has been completed</p>
                        </div>

                        {/* Transaction Details */}
                        <div className="px-6 py-6">
                            <div className="space-y-4">
                                {transactionId && (
                                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                        <span className="text-gray-600">Transaction ID</span>
                                        <span className="font-semibold text-gray-900">{transactionId}</span>
                                    </div>
                                )}
                                {amount && (
                                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                        <span className="text-gray-600">Amount Paid</span>
                                        <span className="font-semibold text-[#00A651]">BDT {amount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                    <span className="text-gray-600">Status</span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        Completed
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm text-green-800">
                                    {provisioning
                                        ? 'Activating your package, please wait...'
                                        : 'A confirmation email has been sent to your registered email address. Your purchased package will be activated shortly.'
                                    }
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-3">
                                <Link
                                    href="/en/dashboard"
                                    className="block w-full bg-[#00A651] hover:bg-[#004225] text-white text-center font-medium py-3 px-4 rounded-md transition-colors"
                                >
                                    Go to Dashboard
                                </Link>
                                <Link
                                    href="/en"
                                    className="block w-full border border-[#00A651] text-[#00A651] hover:bg-[#00A651] hover:text-white text-center font-medium py-3 px-4 rounded-md transition-colors"
                                >
                                    Back to Home
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Support Note */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        Need help? Contact our support at{' '}
                        <a href="mailto:support@btcl.com.bd" className="text-[#00A651] hover:underline">
                            support@btcl.com.bd
                        </a>
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-4">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} Bangladesh Telecommunications Company Limited. All rights reserved.
                </div>
            </footer>
        </div>
    )
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A651]"></div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    )
}
