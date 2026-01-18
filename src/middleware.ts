import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'bn'],

  // Used when no locale matches
  defaultLocale: 'en'
});

export default function middleware(request: NextRequest) {
  // Skip next-intl for /pg routes (payment callback pages)
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/pg')) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  // Match internationalized pathnames and /pg routes
  matcher: ['/', '/(bn|en)/:path*', '/pg/:path*']
};