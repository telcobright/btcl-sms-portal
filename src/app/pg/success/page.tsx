'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { VBS_BASE_URL, PBX_BASE_URL, API_ENDPOINTS } from '@/config/api'
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
                    } else {
                        toast.error('Voice Broadcast activation failed. Please contact support.', { id: 'vbs-purchase' });
                    }

                    setProvisionComplete(true);
                    setProvisioning(false);
                }

                // Handle Hosted PBX purchase
                if (provision.serviceType === 'hosted-pbx') {
                    setProvisioning(true);
                    toast.loading('Activating your Hosted PBX package...', { id: 'pbx-purchase' });

                    const result = await purchaseHostedPbx(
                        authToken,
                        provision.partnerId,
                        provision.packageIdInt,
                        provision.price
                    );

                    if (result.success) {
                        toast.success('Hosted PBX package activated successfully!', { id: 'pbx-purchase' });
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
