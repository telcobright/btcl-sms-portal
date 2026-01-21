'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'

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
    const [serviceType, setServiceType] = useState<string | null>(null)
    const [userEmail, setUserEmail] = useState('')

    useEffect(() => {
        // Read pending provision data to determine service type
        const pendingData = sessionStorage.getItem('pendingServiceProvision');
        if (pendingData) {
            const provision: PendingProvision = JSON.parse(pendingData);
            setServiceType(provision.serviceType);
            setUserEmail(provision.email);
            // Clear the session storage
            sessionStorage.removeItem('pendingServiceProvision');
        }
    }, []);

    // PBX Success Page
    if (serviceType === 'hosted-pbx') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Toaster position="top-center" />
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
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-[#00A651] to-[#004225] px-6 py-8 text-center">
                            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                                <svg className="w-12 h-12 text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Congratulations!</h2>
                            <p className="text-green-100 mt-2">Your Hosted PBX is ready!</p>
                        </div>
                        <div className="px-6 py-6">
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Login Credentials</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600">Email</span>
                                        <span className="font-semibold text-gray-900">{userEmail}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600">Password</span>
                                        <span className="font-mono font-semibold text-gray-900 bg-gray-200 px-3 py-1 rounded">11111111</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6">
                                <p className="text-sm text-gray-600 mb-3 text-center">Access your PBX User Portal:</p>
                                <a href="https://hippbx.btcliptelephony.gov.bd:5174/" target="_blank" rel="noopener noreferrer" className="block w-full bg-[#00A651] hover:bg-[#004225] text-white text-center font-medium py-3 px-4 rounded-lg transition-colors">
                                    Go to PBX Portal
                                </a>
                            </div>
                            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-xs text-amber-800"><strong>Note:</strong> Please change your password after first login.</p>
                            </div>
                            <Link href="/en/dashboard" className="block w-full mt-4 border border-gray-300 text-gray-700 hover:bg-gray-50 text-center font-medium py-3 px-4 rounded-lg transition-colors">
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

    // VBS Success Page
    if (serviceType === 'voice-broadcast') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Toaster position="top-center" />
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
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-[#00A651] to-[#004225] px-6 py-8 text-center">
                            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                                <svg className="w-12 h-12 text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Congratulations!</h2>
                            <p className="text-green-100 mt-2">Your Voice Broadcast is ready!</p>
                        </div>
                        <div className="px-6 py-6">
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Login Credentials</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600">Email</span>
                                        <span className="font-semibold text-gray-900">{userEmail}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600">Password</span>
                                        <span className="font-mono font-semibold text-gray-900 bg-gray-200 px-3 py-1 rounded">11111111</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6">
                                <p className="text-sm text-gray-600 mb-3 text-center">Access your Voice Broadcast Portal:</p>
                                <a href="https://vbs.btcliptelephony.gov.bd/" target="_blank" rel="noopener noreferrer" className="block w-full bg-[#00A651] hover:bg-[#004225] text-white text-center font-medium py-3 px-4 rounded-lg transition-colors">
                                    Go to Voice Broadcast Portal
                                </a>
                            </div>
                            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-xs text-amber-800"><strong>Note:</strong> Please change your password after first login.</p>
                            </div>
                            <Link href="/en/dashboard" className="block w-full mt-4 border border-gray-300 text-gray-700 hover:bg-gray-50 text-center font-medium py-3 px-4 rounded-lg transition-colors">
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

    // Default Success Page
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-center" />
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
