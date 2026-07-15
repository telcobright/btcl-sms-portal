import { SessionProvider } from '@/components/providers/SessionProvider';
import ToastProvider from '@/components/toastProvider/ToastProvider';
import { LOCALES, SITE_URL, isLocale } from '@/config/seo';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const DESCRIPTION: Record<string, string> = {
  en: 'BTCL Alaap Cloud — cloud IP PBX, voice broadcasting, contact centre and bulk SMS services for businesses in Bangladesh.',
  bn: 'বিটিসিএল আলাপ ক্লাউড — বাংলাদেশের ব্যবসা প্রতিষ্ঠানের জন্য ক্লাউড আইপি পিবিএক্স, ভয়েস ব্রডকাস্টিং, কন্টাক্ট সেন্টার ও বাল্ক এসএমএস সেবা।',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const description = DESCRIPTION[locale] ?? DESCRIPTION.en;

  // No `alternates.canonical` here: a layout cannot see the pathname, so a canonical set at
  // this level would be inherited by every page and point them all at the locale root.
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: 'Alaap Cloud — BTCL', template: '%s | Alaap Cloud' },
    description,
    icons: { icon: '/alaapLogoDark.png' },
    openGraph: {
      type: 'website',
      siteName: 'Alaap Cloud',
      locale: locale === 'bn' ? 'bn_BD' : 'en_US',
      url: `${SITE_URL}/${locale}`,
      title: 'Alaap Cloud — BTCL',
      description,
      images: [{ url: '/btcl_banner.png', width: 1200, height: 630, alt: 'Alaap Cloud' }],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Without this, `[locale]` matches any single segment and renders the home page with a
  // 200 for every unknown path (/foo, /robots.txt), producing unbounded soft-404 duplicates.
  if (!isLocale(locale)) notFound();

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir="ltr"
      suppressHydrationWarning
    >
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <SessionProvider>
            <NextIntlClientProvider messages={messages}>
              {children}
              <ToastProvider />
            </NextIntlClientProvider>
          </SessionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
