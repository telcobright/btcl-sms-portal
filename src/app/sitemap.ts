import type { MetadataRoute } from 'next';
import { LOCALES, PUBLIC_ROUTES, languageAlternates, localizedUrl } from '@/config/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return LOCALES.flatMap((locale) =>
    PUBLIC_ROUTES.map((route) => ({
      url: localizedUrl(locale, route),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: route === '' ? 1 : 0.8,
      alternates: { languages: languageAlternates(route) },
    }))
  );
}
