'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  const locale = useLocale();

  const IconEmail = () => (
    <svg className="h-4 w-4 text-btcl-primary" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  const IconPhone = () => (
    <svg className="h-4 w-4 text-btcl-primary" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2.5a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.27 1.05L8.6 10.9a12 12 0 005.5 5.5l1.57-1.78a1 1 0 011.05-.27l3.6 1.2a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" />
    </svg>
  );

  const IconPin = () => (
    <svg className="h-4 w-4 text-btcl-primary" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const IconHeadset = () => (
    <svg className="h-4 w-4 text-btcl-primary" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 14v-2a9 9 0 0118 0v2M3 14a2 2 0 002 2h1v-6H5a2 2 0 00-2 2v2zm18 0a2 2 0 01-2 2h-1v-6h1a2 2 0 012 2v2z" />
    </svg>
  );

  const sectionTitle = "mb-5 text-xs font-semibold uppercase tracking-wider text-btcl-primary";
  const linkBase = "text-sm text-gray-600 transition-colors duration-200 hover:text-btcl-primary";

  return (
    <footer className="relative border-t border-btcl-primaryLight/20 bg-gradient-to-b from-white via-btcl-primaryLight/5 to-white">
      {/* Top accent stripe */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-btcl-primary to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-10 py-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href={`/${locale}`} className="inline-block">
              <Image
                src="/btcllogo.png"
                alt="BTCL Logo"
                width={140}
                height={112}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-gray-600">
              {locale === 'en'
                ? "Bangladesh's premier telecommunications service provider, delivering reliable connectivity and innovative digital solutions nationwide."
                : 'বাংলাদেশের শীর্ষস্থানীয় টেলিযোগাযোগ সেবা প্রদানকারী প্রতিষ্ঠান, দেশব্যাপী নির্ভরযোগ্য সংযোগ ও উন্নত ডিজিটাল সমাধান প্রদান করছে।'}
            </p>
            <a
              href="https://btcl.gov.bd/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/10 px-3 py-1.5 text-xs font-semibold text-btcl-primary transition-colors hover:bg-btcl-primary hover:text-white"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-btcl-primary group-hover:bg-white" />
              {locale === 'en' ? 'Visit btcl.gov.bd' : 'btcl.gov.bd দেখুন'}
              <span>↗</span>
            </a>
          </div>

          {/* Overview */}
          <div className="lg:col-span-2">
            <h3 className={sectionTitle}>
              {locale === 'en' ? 'Overview' : 'সাধারণ তথ্য'}
            </h3>
            <ul className="space-y-3">
              <li><Link href={`/${locale}`} className={linkBase}>{locale === 'en' ? 'Home' : 'হোম'}</Link></li>
              <li><Link href={`/${locale}/about`} className={linkBase}>{locale === 'en' ? 'About Us' : 'আমাদের সম্পর্কে'}</Link></li>
              <li><Link href={`/${locale}/services`} className={linkBase}>{locale === 'en' ? 'Services' : 'সেবাসমূহ'}</Link></li>
              <li><Link href={`/${locale}/pricing`} className={linkBase}>{locale === 'en' ? 'Pricing' : 'প্রাইসিং'}</Link></li>
              <li><Link href={`/${locale}/contact`} className={linkBase}>{locale === 'en' ? 'Contact Us' : 'যোগাযোগ'}</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="lg:col-span-3">
            <h3 className={sectionTitle}>
              {locale === 'en' ? 'Services' : 'সেবাসমূহ'}
            </h3>
            <ul className="space-y-3">
              <li><Link href={`/${locale}/services/bulk-sms`} className={linkBase}>{locale === 'en' ? 'Bulk SMS Service' : 'বাল্ক এসএমএস সেবা'}</Link></li>
              <li><Link href={`/${locale}/services/hosted-pbx`} className={linkBase}>Alaap Cloud IP PBX</Link></li>
              <li><Link href={`/${locale}/services/voice-broadcast`} className={linkBase}>Alaap Cloud Voice Broadcasting</Link></li>
              <li><Link href={`/${locale}/services/contact-center`} className={linkBase}>Alaap Cloud Contact Center</Link></li>
            </ul>
          </div>

          {/* Get In Touch */}
          <div className="lg:col-span-3">
            <h3 className={sectionTitle}>
              {locale === 'en' ? 'Get In Touch' : 'যোগাযোগ করুন'}
            </h3>
            <div className="space-y-4">
              {/* Head Office */}
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-900">
                  {locale === 'en' ? 'BTCL Head Office' : 'বিটিসিএল প্রধান কার্যালয়'}
                </p>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-btcl-primaryLight/10">
                    <IconPin />
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {locale === 'en'
                      ? 'Telecommunications Building, 37/E, Eskaton Garden, Dhaka-1000'
                      : 'টেলিযোগাযোগ ভবন, ৩৭/ই, ইস্কাটন গার্ডেন, ঢাকা-১০০০'}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2.5">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-btcl-primaryLight/10">
                    <IconEmail />
                  </div>
                  <a href="mailto:mdoffice@btcl.gov.bd" className={linkBase}>
                    mdoffice@btcl.gov.bd
                  </a>
                </div>
              </div>

              {/* DGM Switch Moghbazar */}
              <div className="border-t border-gray-100 pt-4">
                <p className="mb-2 text-sm font-semibold text-gray-900">
                  {locale === 'en' ? 'DGM Switch Moghbazar Office' : 'ডিজিএম সুইচ মগবাজার অফিস'}
                </p>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-btcl-primaryLight/10">
                    <IconPhone />
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-600">
                    <a href="tel:+880258311616" className="hover:text-btcl-primary">+880258311616</a>
                    <a href="tel:+8809696996699" className="hover:text-btcl-primary">+8809696996699</a>
                    <a href="tel:+880248313366" className="hover:text-btcl-primary">+880248313366</a>
                    <a href="tel:+880258312233" className="hover:text-btcl-primary">+880258312233</a>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2.5">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-btcl-primaryLight/10">
                    <IconEmail />
                  </div>
                  <a href="mailto:alaapcloud@btcl.gov.bd" className={linkBase}>
                    alaapcloud@btcl.gov.bd
                  </a>
                </div>
                <div className="mt-2 flex items-center gap-2.5">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-btcl-primaryLight/10">
                    <IconHeadset />
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>{locale === 'en' ? 'Call Center:' : 'কল সেন্টার:'}</span>{' '}
                    <a href="tel:16402" className="font-semibold text-btcl-primary hover:underline">16402</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 py-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">
                {locale === 'en'
                  ? '© 2026 Bangladesh Telecommunications Company Limited. All rights reserved.'
                  : '© ২০২৬ বাংলাদেশ টেলিযোগাযোগ কোম্পানি লিমিটেড। সকল অধিকার সংরক্ষিত।'}
              </p>
              <p className="text-xs text-gray-400">
                {locale === 'en' ? 'Powered by Telcobright Limited' : 'পরিচালনায় টেলকোব্রাইট লিমিটেড'}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link
                href={`/${locale}/package-migration-policy`}
                className="text-xs text-gray-500 transition-colors hover:text-btcl-primary"
              >
                {locale === 'en' ? 'Package Migration Policy' : 'প্যাকেজ মাইগ্রেশন নীতিমালা'}
              </Link>
              <Link
                href={`/${locale}/terms-and-privacy`}
                className="text-xs text-gray-500 transition-colors hover:text-btcl-primary"
              >
                {locale === 'en' ? 'Terms & Privacy' : 'সেবার শর্তাবলী ও গোপনীয়তা'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
