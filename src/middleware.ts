import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'bn'],

  // Used when no locale matches
  defaultLocale: 'en'
});

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle POST requests to /pg/success (payment gateway callback)
  if (pathname === '/pg/success' && request.method === 'POST') {
    try {
      // Clone the request to read the body
      const formData = await request.formData();

      // Build redirect URL with params
      const params = new URLSearchParams();
      const tranId = formData.get('tran_id') || formData.get('tranId');
      const amount = formData.get('amount') || formData.get('total_amount');
      const status = formData.get('status');

      if (tranId) params.set('tran_id', tranId.toString());
      if (amount) params.set('amount', amount.toString());
      if (status) params.set('status', status.toString());

      // Redirect to GET with params
      const redirectUrl = new URL(`/pg/success?${params.toString()}`, request.url);
      return NextResponse.redirect(redirectUrl, { status: 303 });
    } catch (error) {
      console.error('Middleware error handling POST to /pg/success:', error);
      return NextResponse.redirect(new URL('/pg/success', request.url), { status: 303 });
    }
  }

  // Handle POST requests to /pg/failed
  if (pathname === '/pg/failed' && request.method === 'POST') {
    return NextResponse.redirect(new URL('/pg/failed', request.url), { status: 303 });
  }

  // Handle POST requests to /pg/canceled
  if (pathname === '/pg/canceled' && request.method === 'POST') {
    return NextResponse.redirect(new URL('/pg/canceled', request.url), { status: 303 });
  }

  // Skip next-intl for /pg routes (payment callback pages)
  if (pathname.startsWith('/pg')) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  // Match internationalized pathnames and /pg routes
  matcher: ['/', '/(bn|en)/:path*', '/pg/:path*']
};
