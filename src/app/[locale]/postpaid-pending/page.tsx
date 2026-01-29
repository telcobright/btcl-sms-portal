'use client'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function PostpaidPendingPage() {
  const params = useParams()
  const locale = params.locale as string

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Under Construction Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full shadow-lg">
              <svg
                className="w-16 h-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {locale === 'en' ? 'Postpaid Account Under Review' : 'পোস্টপেইড অ্যাকাউন্ট পর্যালোচনাধীন'}
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-600 mb-6">
            {locale === 'en'
              ? 'Thank you for choosing our Postpaid plan! Your account is currently under review by our team.'
              : 'আমাদের পোস্টপেইড প্ল্যান বেছে নেওয়ার জন্য ধন্যবাদ! আপনার অ্যাকাউন্ট বর্তমানে আমাদের টিম দ্বারা পর্যালোচনাধীন।'}
          </p>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  {locale === 'en' ? 'What happens next?' : 'এরপর কি হবে?'}
                </h3>
                <ul className="text-blue-800 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    {locale === 'en'
                      ? 'Our team will verify your submitted documents within 24-48 business hours.'
                      : 'আমাদের টিম ২৪-৪৮ কার্যদিবসের মধ্যে আপনার জমা দেওয়া নথি যাচাই করবে।'}
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    {locale === 'en'
                      ? 'Once approved, you will receive an email notification.'
                      : 'অনুমোদিত হলে, আপনি একটি ইমেইল বিজ্ঞপ্তি পাবেন।'}
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    {locale === 'en'
                      ? 'After approval, you can access all postpaid services from your dashboard.'
                      : 'অনুমোদনের পরে, আপনি আপনার ড্যাশবোর্ড থেকে সমস্ত পোস্টপেইড পরিষেবা অ্যাক্সেস করতে পারবেন।'}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-100 rounded-xl p-6 mb-8">
            <p className="text-gray-700">
              {locale === 'en'
                ? 'If you have any questions, please contact our support team:'
                : 'আপনার কোনো প্রশ্ন থাকলে, অনুগ্রহ করে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন:'}
            </p>
            <p className="text-btcl-primary font-semibold mt-2">
              support@btcl.com.bd | +880-2-XXXXXXXX
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${locale}/dashboard`}>
              <Button className="bg-btcl-primary text-white hover:bg-btcl-secondary px-8 py-3">
                {locale === 'en' ? 'Go to Dashboard' : 'ড্যাশবোর্ডে যান'}
              </Button>
            </Link>
            <Link href={`/${locale}/contact`}>
              <Button variant="outline" className="border-btcl-primary text-btcl-primary hover:bg-btcl-primary hover:text-white px-8 py-3">
                {locale === 'en' ? 'Contact Support' : 'সাপোর্টে যোগাযোগ'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
