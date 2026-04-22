'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

interface PendingProvision {
    serviceType: string;
    partnerId: number;
    email: string;
    packageId: string;
    packageIdInt: number;
    packageName: string;
    price: number;
    purchaseAction?: 'new' | 'renew' | 'upgrade' | 'downgrade';
}

const SERVICE_CONFIG: Record<string, { label: string; subtitle: string; portalLabel: string; portalUrl: string }> = {
    'hosted-pbx': {
        label: 'Hosted PBX',
        subtitle: 'Your Hosted PBX package is now active!',
        portalLabel: 'Go to PBX Portal',
        portalUrl: 'https://hippbx.btcliptelephony.gov.bd:5174/',
    },
    'voice-broadcast': {
        label: 'Voice Broadcast',
        subtitle: 'Your Voice Broadcast package is now active!',
        portalLabel: 'Go to VBS Portal',
        portalUrl: 'https://vbs.btcliptelephony.gov.bd/',
    },
    'contact-center': {
        label: 'Contact Center',
        subtitle: 'Your Contact Center package is now active!',
        portalLabel: 'Go to CC Portal',
        portalUrl: 'https://hcc.btcliptelephony.gov.bd/',
    },
};

function ServiceSuccessPage({
    serviceType,
    userEmail,
    packageName,
    purchaseAction = 'new',
}: {
    serviceType: string;
    userEmail: string;
    packageName: string;
    purchaseAction?: 'new' | 'renew' | 'upgrade' | 'downgrade';
}) {
    const config = SERVICE_CONFIG[serviceType];
    const isNew = purchaseAction === 'new';
    const isDowngrade = purchaseAction === 'downgrade';

    const actionLabel =
        purchaseAction === 'renew' ? 'Plan Renewed' :
        purchaseAction === 'upgrade' ? 'Plan Upgraded' :
        purchaseAction === 'downgrade' ? 'Plan Downgraded' :
        'Purchase Successful';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-16">
                        <Link href="/en">
                            <Image src="/btcllogo.png" alt="BTCL Logo" width={124} height={100} className="rounded-lg object-contain" />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className={`px-6 py-8 text-center ${isDowngrade ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-[#00A651] to-[#004225]'}`}>
                        <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <svg className={`w-12 h-12 ${isDowngrade ? 'text-amber-500' : 'text-[#00A651]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Congratulations!</h2>
                        <p className="text-white/80 mt-2 font-medium">{actionLabel}</p>
                    </div>

                    <div className="px-6 py-6">
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            {isNew ? (
                                /* First-time purchase: email notification */
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
                                        <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Check Your Email</p>
                                        <p className="text-sm text-gray-500 mt-1">Your login credentials have been sent to:</p>
                                        <p className="font-semibold text-blue-600 mt-1 break-all">{userEmail}</p>
                                    </div>
                                    <div className="w-full mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-left">
                                        <p className="text-xs text-amber-800">
                                            <strong>Note:</strong> Your username and password are included in the email. Please change your password after first login for security.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* Renew / Upgrade / Downgrade: plan summary */
                                <>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Plan Summary</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-gray-600">Package</span>
                                            <span className="font-semibold text-gray-900">{packageName}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-gray-600">Action</span>
                                            <span className={`font-semibold ${
                                                purchaseAction === 'upgrade' ? 'text-[#00A651]' :
                                                purchaseAction === 'downgrade' ? 'text-amber-600' :
                                                'text-green-600'
                                            }`}>{actionLabel}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-gray-600">Status</span>
                                            <span className="font-semibold text-green-600">Active</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Portal link */}
                        <div className="mt-5">
                            <a
                                href={config.portalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-[#00A651] hover:bg-[#004225] text-white text-center font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                {config.portalLabel} →
                            </a>
                        </div>

                        <Link
                            href="/en/dashboard"
                            className="block w-full mt-3 border border-gray-300 text-gray-700 hover:bg-gray-50 text-center font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </main>

            <footer className="bg-white border-t border-gray-200 py-4">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} Bangladesh Telecommunications Company Limited. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

function SuccessContent() {
    const searchParams = useSearchParams()
    const transactionId = searchParams.get('tran_id') || searchParams.get('tranId')
    const amount = searchParams.get('amount')
    const [serviceType, setServiceType] = useState<string | null>(null)
    const [userEmail, setUserEmail] = useState('')
    const [packageName, setPackageName] = useState('')
    const [purchaseAction, setPurchaseAction] = useState<'new' | 'renew' | 'upgrade' | 'downgrade'>('new')

    useEffect(() => {
        const pendingData = sessionStorage.getItem('pendingServiceProvision');
        if (pendingData) {
            const provision: PendingProvision = JSON.parse(pendingData);
            setServiceType(provision.serviceType);
            setUserEmail(provision.email);
            setPackageName(provision.packageName);
            setPurchaseAction(provision.purchaseAction ?? 'new');
            sessionStorage.removeItem('pendingServiceProvision');
        }
    }, []);

    // Service-specific success page (PBX, VBS, CC)
    if (serviceType && SERVICE_CONFIG[serviceType]) {
        return <ServiceSuccessPage serviceType={serviceType} userEmail={userEmail} packageName={packageName} purchaseAction={purchaseAction} />;
    }

    // Generic fallback (SMS or unknown service)
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-16">
                        <Link href="/en">
                            <Image src="/btcllogo.png" alt="BTCL Logo" width={124} height={100} className="rounded-lg object-contain" />
                        </Link>
                    </div>
                </div>
            </header>
            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#00A651] to-[#004225] px-6 py-8 text-center">
                            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4">
                                <svg className="w-12 h-12 text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-white">Payment Successful!</h1>
                            <p className="text-green-100 mt-2">Your transaction has been completed</p>
                        </div>
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
                                    A confirmation email has been sent to your registered email address.
                                </p>
                            </div>
                            <div className="mt-6 space-y-3">
                                <Link href="/en/dashboard" className="block w-full bg-[#00A651] hover:bg-[#004225] text-white text-center font-medium py-3 px-4 rounded-md transition-colors">
                                    Go to Dashboard
                                </Link>
                                <Link href="/en" className="block w-full border border-[#00A651] text-[#00A651] hover:bg-[#00A651] hover:text-white text-center font-medium py-3 px-4 rounded-md transition-colors">
                                    Back to Home
                                </Link>
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-6">
                        Need help? Contact our support at{' '}
                        <a href="mailto:support@btcl.com.bd" className="text-[#00A651] hover:underline">support@btcl.com.bd</a>
                    </p>
                </div>
            </main>
            <footer className="bg-white border-t border-gray-200 py-4">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} Bangladesh Telecommunications Company Limited. All rights reserved.
                </div>
            </footer>
        </div>
    );
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
    );
}
