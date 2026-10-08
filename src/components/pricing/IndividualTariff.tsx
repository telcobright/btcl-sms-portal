import { INDIVIDUAL_SUBSCRIBE_URL, INDIVIDUAL_TARIFF } from '@/lib/individual-tariff';
import type { ReactNode } from 'react';

/**
 * The Individual IPTSP voice tariff as BTCL publishes it: a headline price, then the rate
 * table row for row. No hooks, so the home page can render it on the server.
 */
export function IndividualTariff({
  locale,
  action,
}: {
  locale: string;
  /** Shown under the table, e.g. the subscribe button. */
  action?: ReactNode;
}) {
  const lang = locale === 'en' ? 'en' : 'bn';
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-200 bg-btcl-primaryLight/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-btcl-primary">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {INDIVIDUAL_TARIFF.title[lang]}
            </h3>
            <p className="text-sm text-gray-600">
              {lang === 'en' ? 'Category' : 'ক্যাটাগরি'}:{' '}
              <span className="font-semibold text-btcl-primaryDark">
                {INDIVIDUAL_TARIFF.category[lang]}
              </span>
            </p>
          </div>
        </div>
        <div className="sm:text-right">
          <span className="text-3xl font-bold text-gray-900">
            ৳{INDIVIDUAL_TARIFF.monthlyCharge}
          </span>
          <span className="text-sm text-gray-600">
            /{lang === 'en' ? 'month' : 'মাস'}
          </span>
          <div className="text-xs text-gray-500">
            {lang === 'en'
              ? `${INDIVIDUAL_TARIFF.freeMinutes} free minutes every month`
              : `প্রতি মাসে ${INDIVIDUAL_TARIFF.freeMinutes} মিনিট ফ্রি টকটাইম`}
          </div>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th scope="col" className="w-12 px-3 py-3 text-center sm:px-4">
              {lang === 'en' ? 'SN' : 'ক্রম'}
            </th>
            <th scope="col" className="px-3 py-3 sm:px-4">
              {lang === 'en' ? 'Description' : 'বিবরণ'}
            </th>
            <th scope="col" className="px-3 py-3 text-right sm:px-4">
              {lang === 'en' ? 'Rate / Charge / Volume' : 'রেট / চার্জ / পরিমাণ'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {INDIVIDUAL_TARIFF.rows.map((row, index) => (
            <tr key={row.description.en}>
              <td className="px-3 py-3 text-center text-gray-500 sm:px-4">{index + 1}</td>
              <td className="px-3 py-3 font-medium leading-snug text-gray-800 sm:px-4">
                {row.description[lang]}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-gray-900 sm:px-4">
                {row.rate[lang]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {action && <div className="border-t border-gray-200 px-5 py-5 sm:px-6">{action}</div>}
    </div>
  );
}

/** Subscribe, once INDIVIDUAL_SUBSCRIBE_URL is set; until then, an honest "Coming soon". */
export function IndividualSubscribeAction({ locale }: { locale: string }) {
  const en = locale === 'en';
  if (INDIVIDUAL_SUBSCRIBE_URL) {
    return (
      <a
        href={INDIVIDUAL_SUBSCRIBE_URL}
        className="block w-full rounded-lg bg-btcl-primary px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-btcl-primaryDark"
      >
        {en ? 'Subscribe' : 'সাবস্ক্রাইব করুন'}
      </a>
    );
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-lg bg-gray-200 px-6 py-3 text-sm font-semibold text-gray-500"
      >
        {en ? 'Coming Soon' : 'শীঘ্রই আসছে'}
      </button>
      <p className="text-center text-xs text-gray-500">
        {en
          ? 'Online subscription for Individual accounts opens soon.'
          : 'ব্যক্তিগত অ্যাকাউন্টের জন্য অনলাইন সাবস্ক্রিপশন শীঘ্রই চালু হবে।'}
      </p>
    </div>
  );
}
