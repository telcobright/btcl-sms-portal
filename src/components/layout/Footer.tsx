'use client';

import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <>
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
                  : 'বাংলাদেশের শীর্ষস্থানীয় টেলিযোগাযোগ সেবা প্রদানকারী প্রতিষ্ঠান, দেশব্যাপী নির্ভরযোগ্য সংযোগ ও উন্নত ডিজিটাল সমাধান প্রদান করছে।'}
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
                    {locale === 'en'
                      ? 'Enterprise Package'
                      : 'এন্টারপ্রাইজ প্যাকেজ'}
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
                      : 'বিটিসিএল প্রধান কার্যালয়'}
                  </p>
                  <p className="leading-relaxed">
                    {locale === 'en'
                      ? 'Telecommunications Building, 37/E, Eskaton Garden, Dhaka-1000'
                      : 'টেলিযোগাযোগ ভবন, ৩৭/ই, ইস্কাটন গার্ডেন, ঢাকা-১০০০'}
                  </p>
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

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 mb-2">
                      {locale === 'en'
                        ? 'BTCL DGM Switch Moghbazar Office'
                        : 'বিটিসিএল ডিজিএম সুইচ মগবাজার অফিস'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">📞</span>
                    <a
                      href="tel:+880258311616"
                      className="hover:text-[#00a651] transition-colors duration-200"
                    >
                      +880258311616
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>BTCL Call Center:</span>
                    <a
                      href="tel:+880258311616"
                      className="hover:text-[#00a651] transition-colors duration-200"
                    >
                      16402
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-100 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  {locale === 'en'
                    ? '© 2026 Bangladesh Telecommunications Company Limited. All rights reserved.'
                    : '© ২০২৬ বাংলাদেশ টেলিযোগাযোগ কোম্পানি লিমিটেড। সকল অধিকার সংরক্ষিত।'}
                </p>
                <p className="text-sm text-gray-400">
                  {locale === 'en'
                    ? 'Powered by Telcobright Limited'
                    : 'পরিচালনায় টেলকোব্রাইট লিমিটেড'}
                </p>
              </div>
              <div className="flex space-x-8">
                <Link
                  href={`/${locale}/package-migration-policy`}
                  className="text-sm text-gray-500 hover:text-[#00a651] transition-colors duration-200"
                >
                  {locale === 'en'
                    ? 'Package Migration Policy'
                    : 'প্যাকেজ মাইগ্রেশন নীতিমালা'}
                </Link>

                <Link
                  href={`/${locale}/terms-and-privacy`}
                  className="text-sm text-gray-500 hover:text-[#00a651] transition-colors duration-200"
                >
                  {locale === 'en'
                    ? 'Terms of Service and Privacy Policy'
                    : 'সেবার শর্তাবলী এবং গোপনীয়তা নীতি'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
