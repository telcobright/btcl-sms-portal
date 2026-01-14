'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function FailedContent() {
    const searchParams = useSearchParams()
    const transactionId = searchParams.get('tran_id') || searchParams.get('tranId')
    const errorMessage = searchParams.get('error') || searchParams.get('message')

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
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
                        {/* Failed Icon Header */}
                        <div className="bg-gradient-to-r from-red-600 to-red-800 px-6 py-8 text-center">
                            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4">
                                <svg
                                    className="w-12 h-12 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-white">Payment Failed</h1>
                            <p className="text-red-100 mt-2">Your transaction could not be completed</p>
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
                                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                    <span className="text-gray-600">Status</span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                        Failed
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex">
                                    <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        <h3 className="text-sm font-medium text-red-800">What went wrong?</h3>
                                        <p className="text-sm text-red-700 mt-1">
                                            {errorMessage || 'The payment could not be processed. This may be due to insufficient funds, card decline, or a network issue.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h4 className="text-sm font-medium text-gray-800 mb-2">You can try:</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li className="flex items-center">
                                        <span className="w-1.5 h-1.5 bg-[#00A651] rounded-full mr-2"></span>
                                        Using a different payment method
                                    </li>
                                    <li className="flex items-center">
                                        <span className="w-1.5 h-1.5 bg-[#00A651] rounded-full mr-2"></span>
                                        Checking your card details
                                    </li>
                                    <li className="flex items-center">
                                        <span className="w-1.5 h-1.5 bg-[#00A651] rounded-full mr-2"></span>
                                        Contacting your bank
                                    </li>
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-3">
                                <Link
                                    href="/en/packages"
                                    className="block w-full bg-[#00A651] hover:bg-[#004225] text-white text-center font-medium py-3 px-4 rounded-md transition-colors"
                                >
                                    Try Again
                                </Link>
                                <Link
                                    href="/en/dashboard"
                                    className="block w-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-center font-medium py-3 px-4 rounded-md transition-colors"
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

export default function PaymentFailedPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A651]"></div>
            </div>
        }>
            <FailedContent />
        </Suspense>
    )
}
