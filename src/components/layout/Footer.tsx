'use client'

import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import Image from "next/image";
import { useState, useEffect } from 'react';

export function Footer() {
  const t = useTranslations()
  const locale = useLocale()
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    { text: "Your OTP: 123456", type: "received", time: "10:30 AM" },
    { text: "SMS sent successfully!", type: "sent", time: "10:31 AM" },
    { text: "Welcome to BTCL SMS", type: "received", time: "10:32 AM" },
    { text: "Delivery confirmed ✓", type: "sent", time: "10:33 AM" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
      <>
        {/* CTA Section */}
        <section className="relative overflow-hidden max-w-7xl mx-auto rounded-[48px] bg-gray-50">
          <div className="absolute inset-0 bg-gradient-to-r from-[#008A43] to-[#00A651]"></div>
          <div className="relative max-w-7xl mx-auto px-20 sm:px-6 lg:px-20 py-12 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-white">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  {locale === 'en'
                      ? 'Ready to get started?'
                      : 'শুরু করতে প্রস্তুত?'
                  }
                </h2>
                <p className="text-lg md:text-xl text-green-50 mb-8 leading-relaxed max-w-lg">
                  {locale === 'en'
                      ? 'Choose your plan and start sending A2P SMS within minutes. No setup fees, no long-term contracts.'
                      : 'আপনার প্যাকেজ নির্বাচন করুন এবং কয়েক মিনিটের মধ্যে এ২পি এসএমএস পাঠানো শুরু করুন। কোনো সেটআপ ফি নেই, দীর্ঘমেয়াদী চুক্তি নেই।'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                      href={`/${locale}/pricing`}
                      className="bg-white text-[#00A651] px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    {locale === 'en' ? 'Purchase Package Today' : 'আজই পैকেজ কিনুন'}
                  </Link>
                  <Link
                      href={`/${locale}/contact`}
                      className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-[#00A651] transition-all duration-200 text-center"
                  >
                    {locale === 'en' ? 'Talk to Sales' : 'সেলস টিমের সাথে কথা বলুন'}
                  </Link>
                </div>
              </div>

              {/* Right - Animated Mobile Screen */}
              <div className="flex justify-center lg:justify-center">
                <div className="relative">
                  <div className="w-64 h-[500px] bg-white rounded-3xl shadow-2xl p-6 relative overflow-hidden">
                    {/* Phone Header */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-sm font-medium text-gray-900">Messages</div>
                      <div className="w-2 h-2 bg-[#00A651] rounded-full animate-pulse"></div>
                    </div>

                    {/* Messages Container */}
                    <div className="space-y-4 h-96 overflow-hidden">
                      {messages.map((message, index) => (
                          <div
                              key={index}
                              className={`transform transition-all duration-1000 ${
                                  index === messageIndex
                                      ? 'translate-y-0 opacity-100 scale-100'
                                      : index < messageIndex
                                          ? '-translate-y-20 opacity-50 scale-95'
                                          : 'translate-y-20 opacity-0 scale-95'
                              }`}
                          >
                            <div className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[200px] px-4 py-3 rounded-2xl ${
                                  message.type === 'sent'
                                      ? 'bg-[#00A651] text-white'
                                      : 'bg-gray-100 text-gray-900'
                              } shadow-sm`}>
                                <p className="text-sm">{message.text}</p>
                                <p className={`text-xs mt-1 ${
                                    message.type === 'sent' ? 'text-green-100' : 'text-gray-500'
                                }`}>
                                  {message.time}
                                </p>
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>

                    {/* Input Field */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="bg-gray-100 rounded-full px-4 py-3 flex items-center">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent text-sm outline-none"
                            readOnly
                        />
                        <div className="w-8 h-8 bg-[#00A651] rounded-full flex items-center justify-center ml-2">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Footer */}
        <footer className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Main Footer Content - 4 Columns */}
            <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

              {/* Column 1: Logo with description */}
              <div className="lg:col-span-1">
                <Link href={`/${locale}`} className="inline-block mb-6">
                  <Image
                      src="/btcllogo.png"
                      alt="BTCL Logo"
                      width={140}
                      height={112}
                      className="h-16 w-auto object-contain"
                  />
                </Link>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {locale === 'en'
                      ? "Bangladesh's premier telecommunications service provider, delivering reliable connectivity and innovative digital solutions nationwide."
                      : "বাংলাদেশের শীর্ষস্থানীয় টেলিযোগাযোগ সেবা প্রদানকারী প্রতিষ্ঠান, দেশব্যাপী নির্ভরযোগ্য সংযোগ ও উন্নত ডিজিটাল সমাধান প্রদান করছে।"
                  }
                </p>
              </div>

              {/* Column 2: Overview - Page Links */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6">
                  {locale === 'en' ? 'Overview' : 'সাধারণ তথ্য'}
                </h3>
                <ul className="space-y-4">
                  <li>
                    <Link
                        href={`/${locale}`}
                        className="text-gray-600 hover:text-[#00a651] transition-colors duration-200 text-sm"
                    >
                      {locale === 'en' ? 'Home' : 'হোম'}
                    </Link>
                  </li>
                  <li>
                    <Link
                        href={`/${locale}/about`}
                        className="text-gray-600 hover:text-[#00a651] transition-colors duration-200 text-sm"
                    >
                      {locale === 'en' ? 'About Us' : 'আমাদের সম্পর্কে'}
                    </Link>
                  </li>
                  <li>
                    <Link
                        href={`/${locale}/pricing`}
                        className="text-gray-600 hover:text-[#00a651] transition-colors duration-200 text-sm"
                    >
                      {locale === 'en' ? 'Pricing' : 'প্রাইসিং'}
                    </Link>
                  </li>
                  <li>
                    <Link
                        href={`/${locale}/services`}
                        className="text-gray-600 hover:text-[#00a651] transition-colors duration-200 text-sm"
                    >
                      {locale === 'en' ? 'Services' : 'সেবাসমূহ'}
                    </Link>
                  </li>
                  <li>
                    <Link
                        href={`/${locale}/contact`}
                        className="text-gray-600 hover:text-[#00a651] transition-colors duration-200 text-sm"
                    >
                      {locale === 'en' ? 'Contact Us' : 'যোগাযোগ'}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Products */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6">
                  {locale === 'en' ? 'Products' : 'প্রোডাক্ট'}
                </h3>
                <ul className="space-y-4">
                  <li>
                    <Link
                        href={`/${locale}/pricing#starter`}
                        className="text-gray-600 hover:text-[#00a651] transition-colors duration-200 text-sm"
                    >
                      {locale === 'en' ? 'Starter Package' : 'স্টার্টার প্যাকেজ'}
                    </Link>
                  </li>
                  <li>
                    <Link
                        href={`/${locale}/pricing#business`}
                        className="text-gray-600 hover:text-[#00a651] transition-colors duration-200 text-sm"
                    >
                      {locale === 'en' ? 'Business Package' : 'বিজনেস প্যাকেজ'}
                    </Link>
                  </li>
                  <li>
                    <Link
                        href={`/${locale}/pricing#enterprise`}
                        className="text-gray-600 hover:text-[#00a651] transition-colors duration-200 text-sm"
                    >
                      {locale === 'en' ? 'Enterprise Package' : 'এন্টারপ্রাইজ প্যাকেজ'}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 4: Get In Touch */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6">
                  {locale === 'en' ? 'Get In Touch' : 'যোগাযোগ করুন'}
                </h3>
                <div className="space-y-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium text-gray-900 mb-2">
                      {locale === 'en'
                          ? 'BTCL Head Office'
                          : 'বিটিসিএল প্রধান কার্যালয়'
                      }
                    </p>
                    <p className="leading-relaxed">
                      {locale === 'en'
                          ? 'Telecommunications Building, 37/E, Eskaton Garden, Dhaka-1000'
                          : 'টেলিযোগাযোগ ভবন, ৩৭/ই, ইস্কাটন গার্ডেন, ঢাকা-১০০০'
                      }
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">📞</span>
                      <a
                          href="tel:+88024831115000"
                          className="hover:text-[#00a651] transition-colors duration-200"
                      >
                        +৮৮০ ২ ৪৮৩১১৫০০
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">✉️</span>
                      <a
                          href="mailto:mdoffice@btcl.gov.bd"
                          className="hover:text-[#00a651] transition-colors duration-200"
                      >
                        mdoffice@btcl.gov.bd
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-gray-100 py-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <p className="text-sm text-gray-500">
                  {locale === 'en'
                      ? '© 2024 Bangladesh Telecommunications Company Limited. All rights reserved.'
                      : '© ২০২৪ বাংলাদেশ টেলিযোগাযোগ কোম্পানি লিমিটেড। সকল অধিকার সংরক্ষিত।'
                  }
                </p>
                <div className="flex space-x-8">
                  <Link
                      href="#"
                      className="text-sm text-gray-500 hover:text-[#00a651] transition-colors duration-200"
                  >
                    {locale === 'en' ? 'Privacy Policy' : 'গোপনীয়তা নীতি'}
                  </Link>
                  <Link
                      href="#"
                      className="text-sm text-gray-500 hover:text-[#00a651] transition-colors duration-200"
                  >
                    {locale === 'en' ? 'Terms of Service' : 'সেবার শর্তাবলী'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </>
  )
}