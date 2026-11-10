const createNextIntlPlugin = require('next-intl/plugin');

// createNextIntlPlugin takes only the request-config path; routing options are read from
// createMiddleware in src/middleware.ts, which uses the default localePrefix ('always').
// URLs are therefore /en/... and /bn/... — see src/config/seo.ts.
const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  async redirects() {
    return [
      // Collapse the apex onto the canonical www host so the two do not compete as
      // duplicate content. Requires nginx to forward the original Host header.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'alaapcloud.gov.bd' }],
        destination: 'https://www.alaapcloud.gov.bd/:path*',
        permanent: true
      },
      // /admin/revenue became /admin/sslcommerz-report; keep the old bookmarks working.
      {
        source: '/:locale/admin/revenue',
        destination: '/:locale/admin/sslcommerz-report',
        permanent: true
      },
      // /admin/settings held nothing but the EC NID verification integration, so it is named
      // for that now; keep the old bookmarks working.
      {
        source: '/:locale/admin/settings',
        destination: '/:locale/admin/ec-nid-verification',
        permanent: true
      }
    ];
  },
  webpack(config) {
    config.devtool = false;
    return config;
  }
};

module.exports = withNextIntl(nextConfig);
