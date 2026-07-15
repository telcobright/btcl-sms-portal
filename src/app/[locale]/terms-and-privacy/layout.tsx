import { pageMetadata } from '@/config/seo';
import type { Metadata } from 'next';

// page.tsx is a client component and cannot export metadata, so it lives here instead.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, '/terms-and-privacy');
}

export default function TermsAndPrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
