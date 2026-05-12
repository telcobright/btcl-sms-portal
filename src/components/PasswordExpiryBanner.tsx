'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function PasswordExpiryBanner() {
  const [show, setShow] = useState(false);
  const [expired, setExpired] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'en';

  useEffect(() => {
    const passwordExpired = localStorage.getItem('passwordExpired') === 'true';
    const days = localStorage.getItem('daysUntilExpiry');

    if (passwordExpired) {
      setExpired(true);
      setDaysLeft(0);
      setShow(true);
    } else if (days !== null) {
      const d = parseInt(days, 10);
      if (!isNaN(d) && d <= 5) {
        setDaysLeft(d);
        setShow(true);
      }
    }
  }, []);

  if (!show || dismissed) return null;

  const isUrgent = expired || (daysLeft !== null && daysLeft <= 1);

  return (
    <div className={`px-5 py-2.5 flex items-center justify-between gap-3 border-b-2 ${
      expired
        ? 'bg-red-50 border-red-500'
        : isUrgent
          ? 'bg-amber-50 border-amber-500'
          : 'bg-blue-50 border-blue-500'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-base flex-shrink-0">{expired ? '\u26A0\uFE0F' : '\uD83D\uDD12'}</span>
        <span className={`text-sm font-medium ${
          expired ? 'text-red-800' : isUrgent ? 'text-amber-800' : 'text-blue-800'
        }`}>
          {expired
            ? 'Your password has expired. Please change your password immediately.'
            : `Your password will expire in ${daysLeft} day(s). Please change it soon.`}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => router.push(`/${locale}/settings`)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${
            expired ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          Change Password
        </button>
        {!expired && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-black/5 text-gray-500 text-lg leading-none"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
