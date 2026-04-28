'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const PackageMigrationPolicyPage = () => {
  const locale = useLocale()
  const isEn = locale === 'en'

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-btcl-secondary via-btcl-secondary to-btcl-primary py-20">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-btcl-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-btcl-accent/10 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm mb-6">
              {isEn ? 'Policy Document' : 'নীতিমালা দলিল'}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isEn ? 'Package Migration Policy' : 'প্যাকেজ মাইগ্রেশন নীতিমালা'}
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {isEn
                ? 'Understand how package renewals, upgrades, and downgrades work for all BTCL services.'
                : 'বিটিসিএল সকল সেবার প্যাকেজ নবায়ন, আপগ্রেড এবং ডাউনগ্রেড কীভাবে কাজ করে তা জানুন।'}
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">

          {/* Applicable Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isEn ? 'Applicable Services' : 'প্রযোজ্য সেবাসমূহ'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isEn
                ? 'This policy applies to all BTCL service packages:'
                : 'এই নীতিমালা বিটিসিএল-এর সকল সেবা প্যাকেজের ক্ষেত্রে প্রযোজ্য:'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { en: 'Hosted IP PBX', bn: 'হোস্টেড আইপি পিবিএক্স', icon: '📞' },
                { en: 'Contact Center', bn: 'কন্টাক্ট সেন্টার', icon: '🎧' },
                { en: 'Voice Broadcast', bn: 'ভয়েস ব্রডকাস্ট', icon: '📢' },
                // { en: 'Bulk SMS', bn: 'বাল্ক এসএমএস', icon: '💬' },
              ].map((service) => (
                <div
                  key={service.en}
                  className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl mb-2 block">{service.icon}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {isEn ? service.en : service.bn}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 1: Package Renewal */}
          <section className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-btcl-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEn ? '1. Package Renewal (Same Package)' : '১. প্যাকেজ নবায়ন (একই প্যাকেজ)'}
                </h2>
                <p className="text-gray-500 mt-1">
                  {isEn
                    ? 'When you purchase the same package you already have active.'
                    : 'আপনার ইতিমধ্যে সক্রিয় প্যাকেজটি পুনরায় ক্রয় করলে।'}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-gray-700">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-btcl-primary rounded-full flex items-center justify-center text-sm font-bold mt-0.5">&#10003;</span>
                <p>
                  {isEn
                    ? 'Your current active package validity will be extended by the package duration (e.g., +30 days from current expiry date).'
                    : 'আপনার বর্তমান সক্রিয় প্যাকেজের মেয়াদ প্যাকেজের সময়কাল অনুযায়ী বাড়ানো হবে (যেমন, বর্তমান মেয়াদ শেষের তারিখ থেকে +৩০ দিন)।'}
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-btcl-primary rounded-full flex items-center justify-center text-sm font-bold mt-0.5">&#10003;</span>
                <p>
                  {isEn
                    ? 'No new account setup is required. Your existing configurations, extensions, and settings remain unchanged.'
                    : 'কোনো নতুন অ্যাকাউন্ট সেটআপের প্রয়োজন নেই। আপনার বিদ্যমান কনফিগারেশন, এক্সটেনশন এবং সেটিংস অপরিবর্তিত থাকবে।'}
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-btcl-primary rounded-full flex items-center justify-center text-sm font-bold mt-0.5">&#10003;</span>
                <p>
                  {isEn
                    ? 'A renewal invoice will be generated for your records.'
                    : 'আপনার রেকর্ডের জন্য একটি নবায়ন চালান তৈরি করা হবে।'}
                </p>
              </div>
            </div>

            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-800">
                <span className="font-semibold">{isEn ? 'Example: ' : 'উদাহরণ: '}</span>
                {isEn
                  ? 'You have the "Starter" PBX package expiring on May 15. You renew on May 1. Your new expiry becomes June 14 (30 days added from May 15).'
                  : 'আপনার "স্টার্টার" পিবিএক্স প্যাকেজের মেয়াদ ১৫ মে শেষ হচ্ছে। আপনি ১ মে নবায়ন করলেন। আপনার নতুন মেয়াদ হবে ১৪ জুন (১৫ মে থেকে ৩০ দিন যোগ)।'}
              </p>
            </div>
          </section>

          {/* Section 2: Package Upgrade */}
          <section className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEn ? '2. Package Upgrade (Higher Package)' : '২. প্যাকেজ আপগ্রেড (উচ্চতর প্যাকেজ)'}
                </h2>
                <p className="text-gray-500 mt-1">
                  {isEn
                    ? 'When you switch to a higher-tier package.'
                    : 'আপনি যখন উচ্চতর স্তরের প্যাকেজে পরিবর্তন করেন।'}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-gray-700">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</span>
                <p>
                  {isEn
                    ? 'Your current active package will be cancelled immediately.'
                    : 'আপনার বর্তমান সক্রিয় প্যাকেজ তাৎক্ষণিকভাবে বাতিল হয়ে যাবে।'}
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</span>
                <p>
                  {isEn
                    ? 'The new higher-tier package will be activated fresh with full validity.'
                    : 'নতুন উচ্চতর স্তরের প্যাকেজ পূর্ণ মেয়াদসহ নতুনভাবে সক্রিয় করা হবে।'}
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</span>
                <p>
                  {isEn
                    ? 'Any remaining balance (minutes, SMS, BDT) from your old package will be carried over and added to the new package.'
                    : 'আপনার পুরনো প্যাকেজের অবশিষ্ট ব্যালেন্স (মিনিট, এসএমএস, টাকা) নতুন প্যাকেজে বহন করা হবে এবং যোগ করা হবে।'}
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">4</span>
                <p>
                  {isEn
                    ? 'Your existing service setup (domain, extensions, gateway) will be retained.'
                    : 'আপনার বিদ্যমান সেবা সেটআপ (ডোমেইন, এক্সটেনশন, গেটওয়ে) বহাল থাকবে।'}
                </p>
              </div>
            </div>

            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-800">
                <span className="font-semibold">{isEn ? 'Example: ' : 'উদাহরণ: '}</span>
                {isEn
                  ? 'You have the "Starter" package with 50 minutes remaining. You upgrade to "Business" which gives 200 minutes. Your new balance will be 250 minutes (200 new + 50 carried over). Validity starts fresh from the upgrade date.'
                  : 'আপনার "স্টার্টার" প্যাকেজে ৫০ মিনিট অবশিষ্ট আছে। আপনি "বিজনেস" এ আপগ্রেড করলেন যেটি ২০০ মিনিট দেয়। আপনার নতুন ব্যালেন্স হবে ২৫০ মিনিট (২০০ নতুন + ৫০ বহনকৃত)। মেয়াদ আপগ্রেডের তারিখ থেকে নতুনভাবে শুরু হবে।'}
              </p>
            </div>

            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">{isEn ? 'Note: ' : 'দ্রষ্টব্য: '}</span>
                {isEn
                  ? 'Remaining validity days from the old package will not be carried over. The new package starts with fresh validity from the date of upgrade.'
                  : 'পুরনো প্যাকেজের অবশিষ্ট মেয়াদ বহন করা হবে না। আপগ্রেডের তারিখ থেকে নতুন প্যাকেজ নতুন মেয়াদসহ শুরু হবে।'}
              </p>
            </div>
          </section>

          {/* Section 3: Package Downgrade */}
          <section className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEn ? '3. Package Downgrade (Lower Package)' : '৩. প্যাকেজ ডাউনগ্রেড (নিম্নতর প্যাকেজ)'}
                </h2>
                <p className="text-gray-500 mt-1">
                  {isEn
                    ? 'When you switch to a lower-tier package.'
                    : 'আপনি যখন নিম্নতর স্তরের প্যাকেজে পরিবর্তন করেন।'}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-gray-700">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</span>
                <p>
                  {isEn
                    ? 'Your current active package will be cancelled immediately.'
                    : 'আপনার বর্তমান সক্রিয় প্যাকেজ তাৎক্ষণিকভাবে বাতিল হয়ে যাবে।'}
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</span>
                <p>
                  {isEn
                    ? 'The new lower-tier package will be activated fresh with full validity.'
                    : 'নতুন নিম্নতর স্তরের প্যাকেজ পূর্ণ মেয়াদসহ নতুনভাবে সক্রিয় করা হবে।'}
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</span>
                <p>
                  {isEn
                    ? 'Any remaining balance (minutes, SMS, BDT) from your old package will be carried over and added to the new package.'
                    : 'আপনার পুরনো প্যাকেজের অবশিষ্ট ব্যালেন্স (মিনিট, এসএমএস, টাকা) নতুন প্যাকেজে বহন করা হবে এবং যোগ করা হবে।'}
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">4</span>
                <p>
                  {isEn
                    ? 'Service features will be adjusted to match the new package tier.'
                    : 'নতুন প্যাকেজ স্তর অনুযায়ী সেবার বৈশিষ্ট্যগুলো সমন্বয় করা হবে।'}
                </p>
              </div>
            </div>

            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-800">
                <span className="font-semibold">{isEn ? 'Example: ' : 'উদাহরণ: '}</span>
                {isEn
                  ? 'You have the "Business" package with 80 minutes remaining. You downgrade to "Starter" which gives 100 minutes. Your new balance will be 180 minutes (100 new + 80 carried over).'
                  : 'আপনার "বিজনেস" প্যাকেজে ৮০ মিনিট অবশিষ্ট আছে। আপনি "স্টার্টার" এ ডাউনগ্রেড করলেন যেটি ১০০ মিনিট দেয়। আপনার নতুন ব্যালেন্স হবে ১৮০ মিনিট (১০০ নতুন + ৮০ বহনকৃত)।'}
              </p>
            </div>

            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">{isEn ? 'Note: ' : 'দ্রষ্টব্য: '}</span>
                {isEn
                  ? 'Remaining validity days from the old package will not be carried over. The new package starts with fresh validity from the date of downgrade.'
                  : 'পুরনো প্যাকেজের অবশিষ্ট মেয়াদ বহন করা হবে না। ডাউনগ্রেডের তারিখ থেকে নতুন প্যাকেজ নতুন মেয়াদসহ শুরু হবে।'}
              </p>
            </div>
          </section>

          {/* Quick Reference Table */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {isEn ? 'Quick Reference' : 'দ্রুত রেফারেন্স'}
            </h2>
            <div className="overflow-hidden bg-white rounded-2xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isEn ? 'Action' : 'কার্যক্রম'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isEn ? 'Old Package' : 'পুরনো প্যাকেজ'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isEn ? 'New Package' : 'নতুন প্যাকেজ'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isEn ? 'Remaining Balance' : 'অবশিষ্ট ব্যালেন্স'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {isEn ? 'Renewal' : 'নবায়ন'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {isEn ? 'Stays active, expiry extended' : 'সক্রিয় থাকে, মেয়াদ বাড়ে'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {isEn ? 'Same package' : 'একই প্যাকেজ'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="inline-flex items-center text-green-600 font-medium">
                        {isEn ? 'Preserved + extended' : 'সংরক্ষিত + বর্ধিত'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {isEn ? 'Upgrade' : 'আপগ্রেড'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {isEn ? 'Cancelled immediately' : 'তাৎক্ষণিক বাতিল'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {isEn ? 'Activated with full validity' : 'পূর্ণ মেয়াদসহ সক্রিয়'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="inline-flex items-center text-green-600 font-medium">
                        {isEn ? 'Carried over to new package' : 'নতুন প্যাকেজে বহন'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {isEn ? 'Downgrade' : 'ডাউনগ্রেড'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {isEn ? 'Cancelled immediately' : 'তাৎক্ষণিক বাতিল'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {isEn ? 'Activated with full validity' : 'পূর্ণ মেয়াদসহ সক্রিয়'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="inline-flex items-center text-green-600 font-medium">
                        {isEn ? 'Carried over to new package' : 'নতুন প্যাকেজে বহন'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* TopUp & Postpaid Note */}
          <section className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isEn ? 'TopUp & Postpaid Credit' : 'টপআপ ও পোস্টপেইড ক্রেডিট'}
            </h2>
            <p className="text-gray-600 mb-4">
              {isEn
                ? 'The following are not affected by the migration policy and work independently:'
                : 'নিম্নলিখিতগুলো মাইগ্রেশন নীতিমালার দ্বারা প্রভাবিত হয় না এবং স্বাধীনভাবে কাজ করে:'}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {isEn ? 'Balance TopUp' : 'ব্যালেন্স টপআপ'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isEn
                    ? 'TopUp amounts are added to your existing balance. Each TopUp creates a transaction record. Your balance accumulates over time.'
                    : 'টপআপ পরিমাণ আপনার বিদ্যমান ব্যালেন্সে যোগ হয়। প্রতিটি টপআপ একটি লেনদেন রেকর্ড তৈরি করে। আপনার ব্যালেন্স সময়ের সাথে জমা হয়।'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {isEn ? 'Postpaid Credit Limit' : 'পোস্টপেইড ক্রেডিট সীমা'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isEn
                    ? 'Postpaid credit limits can be adjusted at any time. Credit limit changes take effect immediately and do not affect your active package.'
                    : 'পোস্টপেইড ক্রেডিট সীমা যেকোনো সময় সমন্বয় করা যায়। ক্রেডিট সীমার পরিবর্তন তাৎক্ষণিকভাবে কার্যকর হয় এবং আপনার সক্রিয় প্যাকেজকে প্রভাবিত করে না।'}
                </p>
              </div>
            </div>
          </section>

          {/* Contact for Questions */}
          <section className="text-center bg-gradient-to-r from-btcl-primary/5 to-btcl-accent/5 rounded-2xl border border-btcl-primary/20 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {isEn ? 'Have Questions?' : 'প্রশ্ন আছে?'}
            </h2>
            <p className="text-gray-600 mb-4">
              {isEn
                ? 'Contact our support team for any questions regarding package migration.'
                : 'প্যাকেজ মাইগ্রেশন সম্পর্কিত যেকোনো প্রশ্নের জন্য আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।'}
            </p>
            <div className="flex justify-center space-x-3">
              <a
                href="mailto:mdoffice@btcl.gov.bd"
                className="inline-flex items-center px-5 py-2.5 bg-btcl-primary text-white text-sm font-medium rounded-lg hover:bg-btcl-secondary transition-colors"
              >
                {isEn ? 'Email Support' : 'ইমেইল সাপোর্ট'}
              </a>
              <a
                href="tel:+88024831115000"
                className="inline-flex items-center px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {isEn ? 'Call Us' : 'কল করুন'}
              </a>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}

export default PackageMigrationPolicyPage
