/**
 * SEO Configuration
 * Canonical origin, indexable routes, and locale set — shared by robots.ts, sitemap.ts
 * and the page metadata so they cannot drift apart.
 */

import type { Metadata } from 'next';
import { ROOT_URL } from './api';

// Canonical origin. Sourced from ROOT_URL so there is one domain constant in the codebase.
export const SITE_URL = ROOT_URL;

export const LOCALES = ['en', 'bn'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Public, indexable routes under /[locale]. '' is the locale home page. */
export const PUBLIC_ROUTES = [
  '',
  '/about',
  '/services',
  '/services/hosted-pbx',
  '/services/voice-broadcast',
  '/services/contact-center',
  '/services/bulk-sms',
  '/pricing',
  '/contact',
  '/register',
  '/login',
  '/terms-and-privacy',
  '/package-migration-policy',
] as const;

/**
 * Paths crawlers must never index, as locale-agnostic prefixes.
 * Kept in sync with the auth guard in src/middleware.ts.
 */
const PRIVATE_ROUTES = [
  '/admin',
  '/dashboard',
  '/settings',
  '/postpaid-pending',
  '/forgot-password',
] as const;

/** Private routes expanded across every locale, plus non-page endpoints. */
export const DISALLOWED_PATHS = [
  '/api/',
  '/pg/',
  ...LOCALES.flatMap((locale) => PRIVATE_ROUTES.map((route) => `/${locale}${route}`)),
];

/** Absolute canonical URL for a route in a given locale. */
export function localizedUrl(locale: Locale, route: string): string {
  return `${SITE_URL}/${locale}${route}`;
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * hreflang map for a route: every locale plus x-default pointing at the default locale.
 * next-intl uses `localePrefix: 'always'` (see src/middleware.ts), so every URL is prefixed.
 */
export function languageAlternates(route: string): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map((locale) => [locale, localizedUrl(locale, route)])),
    'x-default': localizedUrl(DEFAULT_LOCALE, route),
  };
}

/**
 * `alternates` block for a page's metadata.
 * Must be set per page — a layout has no access to the pathname, so a canonical declared
 * there would be inherited by every child page and point them all at the locale root.
 */
export function alternatesFor(locale: string, route: string) {
  const current = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return {
    canonical: localizedUrl(current, route),
    languages: languageAlternates(route),
  };
}

type PageCopy = { title: string; description: string };

/**
 * Search titles and descriptions per route. Titles render through the
 * '%s | Alaap Cloud' template in [locale]/layout.tsx, so they stay short.
 */
const PAGE_COPY: Record<string, Record<Locale, PageCopy>> = {
  '/about': {
    en: {
      title: 'About BTCL',
      description:
        'Bangladesh Telecommunications Company Limited (BTCL), the state-owned operator behind Alaap Cloud business communication services.',
    },
    bn: {
      title: 'বিটিসিএল সম্পর্কে',
      description:
        'বাংলাদেশ টেলিকমিউনিকেশন্স কোম্পানি লিমিটেড (বিটিসিএল) — আলাপ ক্লাউড ব্যবসায়িক যোগাযোগ সেবার রাষ্ট্রায়ত্ত অপারেটর।',
    },
  },
  '/services': {
    en: {
      title: 'Services',
      description:
        'Explore Alaap Cloud services from BTCL: hosted IP PBX, voice broadcasting, contact centre and bulk SMS for businesses in Bangladesh.',
    },
    bn: {
      title: 'সেবাসমূহ',
      description:
        'বিটিসিএল আলাপ ক্লাউডের সেবাসমূহ দেখুন: হোস্টেড আইপি পিবিএক্স, ভয়েস ব্রডকাস্টিং, কন্টাক্ট সেন্টার ও বাল্ক এসএমএস।',
    },
  },
  '/services/hosted-pbx': {
    en: {
      title: 'Hosted IP PBX',
      description:
        'Corporate phone system in the cloud with advanced call management, voicemail, unified communications and seamless integration with your business tools.',
    },
    bn: {
      title: 'হোস্টেড আইপি পিবিএক্স',
      description:
        'ক্লাউডভিত্তিক কর্পোরেট ফোন সিস্টেম — উন্নত কল ব্যবস্থাপনা, ভয়েসমেইল ও ইউনিফাইড কমিউনিকেশন সুবিধাসহ।',
    },
  },
  '/services/voice-broadcast': {
    en: {
      title: 'Voice Broadcasting',
      description:
        'Deliver recorded voice messages to thousands of recipients at once from your browser, with scheduling and delivery reporting.',
    },
    bn: {
      title: 'ভয়েস ব্রডকাস্টিং',
      description:
        'ব্রাউজার থেকেই হাজারো গ্রাহকের কাছে একসঙ্গে রেকর্ডকৃত ভয়েস বার্তা পাঠান, সময়সূচি ও ডেলিভারি রিপোর্টসহ।',
    },
  },
  '/services/contact-center': {
    en: {
      title: 'Contact Centre',
      description:
        'Cloud contact centre with agent dashboards, call queuing, monitoring and reporting — no on-premise hardware required.',
    },
    bn: {
      title: 'কন্টাক্ট সেন্টার',
      description:
        'ক্লাউড কন্টাক্ট সেন্টার — এজেন্ট ড্যাশবোর্ড, কল কিউয়িং, মনিটরিং ও রিপোর্টিং সুবিধাসহ, কোনো হার্ডওয়্যার ছাড়াই।',
    },
  },
  '/services/bulk-sms': {
    en: {
      title: 'Bulk SMS',
      description:
        'Send transactional and promotional SMS across all Bangladesh operators through BTCL, with masking and delivery reports.',
    },
    bn: {
      title: 'বাল্ক এসএমএস',
      description:
        'বিটিসিএলের মাধ্যমে বাংলাদেশের সব অপারেটরে ট্রানজেকশনাল ও প্রমোশনাল এসএমএস পাঠান, মাস্কিং ও ডেলিভারি রিপোর্টসহ।',
    },
  },
  '/pricing': {
    en: {
      title: 'Pricing',
      description:
        'Compare Alaap Cloud packages and monthly subscription fees for IP PBX, voice broadcasting, contact centre and bulk SMS.',
    },
    bn: {
      title: 'মূল্য তালিকা',
      description:
        'আইপি পিবিএক্স, ভয়েস ব্রডকাস্ট, কন্টাক্ট সেন্টার ও বাল্ক এসএমএসের আলাপ ক্লাউড প্যাকেজ ও মাসিক ফি তুলনা করুন।',
    },
  },
  '/contact': {
    en: {
      title: 'Contact',
      description:
        'Contact BTCL Alaap Cloud — hotline 16402, email alaapcloud@btcl.gov.bd, office locations and answers to common questions.',
    },
    bn: {
      title: 'যোগাযোগ',
      description:
        'বিটিসিএল আলাপ ক্লাউডে যোগাযোগ করুন — হটলাইন ১৬৪০২, ইমেইল alaapcloud@btcl.gov.bd, অফিস ঠিকানা ও সাধারণ জিজ্ঞাসা।',
    },
  },
  '/register': {
    en: {
      title: 'Register',
      description:
        'Create an Alaap Cloud account to subscribe to BTCL cloud IP PBX, voice broadcasting, contact centre and bulk SMS services.',
    },
    bn: {
      title: 'রেজিস্ট্রেশন',
      description:
        'বিটিসিএলের ক্লাউড আইপি পিবিএক্স, ভয়েস ব্রডকাস্টিং, কন্টাক্ট সেন্টার ও বাল্ক এসএমএস সেবা নিতে আলাপ ক্লাউড অ্যাকাউন্ট খুলুন।',
    },
  },
  '/login': {
    en: { title: 'Login', description: 'Sign in to your BTCL Alaap Cloud account.' },
    bn: { title: 'লগইন', description: 'আপনার বিটিসিএল আলাপ ক্লাউড অ্যাকাউন্টে সাইন ইন করুন।' },
  },
  '/terms-and-privacy': {
    en: {
      title: 'Terms & Privacy',
      description: 'Terms of service and privacy policy for BTCL Alaap Cloud services.',
    },
    bn: {
      title: 'শর্তাবলী ও গোপনীয়তা',
      description: 'বিটিসিএল আলাপ ক্লাউড সেবার ব্যবহারের শর্তাবলী ও গোপনীয়তা নীতি।',
    },
  },
  '/package-migration-policy': {
    en: {
      title: 'Package Migration Policy',
      description: 'How to move between Alaap Cloud packages, and the rules that apply.',
    },
    bn: {
      title: 'প্যাকেজ মাইগ্রেশন পলিসি',
      description: 'আলাপ ক্লাউড প্যাকেজ পরিবর্তনের নিয়মাবলী ও প্রযোজ্য শর্তসমূহ।',
    },
  },
};

/**
 * Full metadata for a public page. Falls back to the layout's title/description when a
 * route has no entry, so a new page is never worse off than before.
 */
export function pageMetadata(locale: string, route: string): Metadata {
  const current = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const copy = PAGE_COPY[route]?.[current];
  const alternates = alternatesFor(current, route);

  if (!copy) return { alternates };

  return {
    title: copy.title,
    description: copy.description,
    alternates,
    openGraph: {
      title: `${copy.title} | Alaap Cloud`,
      description: copy.description,
      url: alternates.canonical,
    },
  };
}
