'use client';

import { PBX_BASE_URL } from '@/config/api';
import { INDIVIDUAL_PACKAGE } from '@/lib/individual-tariff';
import { useEffect, useState } from 'react';

/** How many numbers to show; the rest are counted. */
const SHOWN = 12;

type DidNumber = { id: string; description?: string | null };

/**
 * The numbers an Individual can have, shown before they buy the plan for the first time.
 *
 * Only a preview: the number is chosen after the purchase, on the IP PBX portal's My DID
 * page, and nothing is reserved until then. The list comes from the IP PBX backend, which
 * serves the BTCL INDIVIDUAL pool to Individual accounts only. If it cannot be read, the
 * note on choosing a number is still shown.
 */
export default function IndividualDidPreview({ locale }: { locale: string }) {
  const en = locale === 'en';
  const [numbers, setNumbers] = useState<DidNumber[] | null>(null);
  const [total, setTotal] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const res = await fetch(`${PBX_BASE_URL}/get-did-numbers-by-pool`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ id: INDIVIDUAL_PACKAGE.didPoolId, page: 1, size: SHOWN }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list: DidNumber[] = Array.isArray(data) ? data : (data?.content ?? []);
        if (cancelled) return;
        setNumbers(list);
        setTotal(Number(data?.totalElements ?? list.length) || list.length);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const more = numbers ? Math.max(0, total - numbers.length) : 0;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {en ? 'Available DID numbers' : 'উপলব্ধ DID নম্বর'}
      </h3>

      {!numbers && !failed && (
        <p className="mt-3 text-sm text-gray-500">{en ? 'Loading numbers…' : 'নম্বর লোড হচ্ছে…'}</p>
      )}
      {failed && (
        <p className="mt-3 text-sm text-gray-500">
          {en ? 'The list of numbers cannot be shown right now.' : 'এখন নম্বরের তালিকা দেখানো যাচ্ছে না।'}
        </p>
      )}
      {numbers && numbers.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">
          {en
            ? 'No number is free in the Individual pool right now. Please contact BTCL.'
            : 'এই মুহূর্তে Individual পুলে কোনো নম্বর খালি নেই। অনুগ্রহ করে BTCL-এর সাথে যোগাযোগ করুন।'}
        </p>
      )}
      {numbers && numbers.length > 0 && (
        <>
          <p className="mt-1 text-sm text-gray-500">
            {en
              ? `${total} number${total === 1 ? '' : 's'} available for Individual customers`
              : `Individual গ্রাহকদের জন্য ${total}টি নম্বর উপলব্ধ`}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label={en ? 'Available numbers' : 'উপলব্ধ নম্বর'}>
            {numbers.map((n) => (
              <li
                key={n.id}
                className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-sm font-mono text-gray-800"
              >
                {n.id}
              </li>
            ))}
            {more > 0 && (
              <li className="px-2.5 py-1 text-sm text-gray-500">
                {en ? `+${more} more` : `+আরও ${more}টি`}
              </li>
            )}
          </ul>
        </>
      )}

      <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
        <strong>{en ? 'Note:' : 'নোট:'}</strong>{' '}
        {en ? (
          <>
            You choose your number after the purchase. Once payment succeeds, log in to the{' '}
            <a href={INDIVIDUAL_PACKAGE.myDidUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
              IP PBX portal
            </a>{' '}
            and select it on the <strong>My DID</strong> page. Numbers are not reserved until you select one.
          </>
        ) : (
          <>
            ক্রয়ের পরে আপনি নম্বর নির্বাচন করবেন। পেমেন্ট সফল হলে{' '}
            <a href={INDIVIDUAL_PACKAGE.myDidUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
              IP PBX পোর্টালে
            </a>{' '}
            লগইন করে <strong>My DID</strong> পাতা থেকে নম্বরটি নির্বাচন করুন। নির্বাচন না করা পর্যন্ত কোনো নম্বর আপনার জন্য সংরক্ষিত থাকে না।
          </>
        )}
      </div>
    </div>
  );
}
