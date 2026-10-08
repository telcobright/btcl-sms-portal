import { INDIVIDUAL_PACKAGE, INDIVIDUAL_SUBSCRIBE_URL } from '@/lib/individual-tariff';
import type { ReactNode } from 'react';

/**
 * The Individual IP-Telephone package as BTCL's package sheet lists it: a headline price, then
 * every feature and term row for row. No hooks, so the home page can render it on the server.
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
            <h3 className="text-lg font-bold text-gray-900">{INDIVIDUAL_PACKAGE.name}</h3>
            <p className="text-sm text-gray-600">
              {lang === 'en' ? 'Category' : 'ক্যাটাগরি'}:{' '}
              <span className="font-semibold text-btcl-primaryDark">
                {INDIVIDUAL_PACKAGE.category[lang]}
              </span>
            </p>
          </div>
        </div>
        <div className="sm:text-right">
          <span className="text-3xl font-bold text-gray-900">
            ৳{INDIVIDUAL_PACKAGE.monthlyCharge}
          </span>
          <span className="text-sm text-gray-600">
            /{lang === 'en' ? 'month' : 'মাস'}
          </span>
          <div className="text-xs text-gray-500">
            {lang === 'en'
              ? `VAT applicable · ${INDIVIDUAL_PACKAGE.freeMinutes} free minutes every month`
              : `ভ্যাট প্রযোজ্য · প্রতি মাসে ${INDIVIDUAL_PACKAGE.freeMinutes} মিনিট ফ্রি টকটাইম`}
          </div>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th scope="col" className="w-2/5 px-4 py-3 sm:w-1/3 sm:px-6">
              {lang === 'en' ? 'Feature' : 'ফিচার'}
            </th>
            <th scope="col" className="px-4 py-3 sm:px-6">
              {lang === 'en' ? 'Details' : 'বিবরণ'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {INDIVIDUAL_PACKAGE.features.map((feature) => (
            <tr key={feature.label.en} className="align-top">
              <th
                scope="row"
                className="px-4 py-2.5 text-left font-medium text-gray-700 sm:px-6"
              >
                {feature.label[lang]}
              </th>
              <td className="px-4 py-2.5 leading-snug text-gray-900 sm:px-6">
                {feature.value === true ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-btcl-primary">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {lang === 'en' ? 'Yes' : 'হ্যাঁ'}
                  </span>
                ) : (
                  <span className="font-medium text-gray-800">{feature.value[lang]}</span>
                )}
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
