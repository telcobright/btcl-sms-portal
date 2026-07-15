import type { MetadataRoute } from 'next';
import { DISALLOWED_PATHS, SITE_URL } from '@/config/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: DISALLOWED_PATHS,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    // Bare hostname: the `host` directive takes no scheme.
    host: new URL(SITE_URL).host,
  };
}
