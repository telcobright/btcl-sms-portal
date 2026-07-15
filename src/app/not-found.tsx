import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found | Alaap Cloud',
  robots: { index: false, follow: false },
};

// Renders its own <html>/<body>: this boundary catches notFound() thrown from
// [locale]/layout.tsx, so that layout's document shell is not available here, and the
// root layout (src/app/layout.tsx) is a bare passthrough.
export default function NotFound() {
  return (
    <html lang="en" dir="ltr">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-5xl font-bold text-[#0D529E]">404</p>
          <h1 className="text-xl font-semibold text-gray-900">Page not found</h1>
          <p className="max-w-md text-sm text-gray-600">
            The page you are looking for does not exist or has moved.
          </p>
          <Link
            href="/en"
            className="mt-2 rounded-md bg-[#0D529E] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1F3C71]"
          >
            Go to Alaap Cloud home
          </Link>
        </main>
      </body>
    </html>
  );
}
