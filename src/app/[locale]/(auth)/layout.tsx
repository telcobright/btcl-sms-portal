'use client';

import PasswordExpiryBanner from '../../../components/PasswordExpiryBanner';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <PasswordExpiryBanner />
      {children}
    </>
  );
}