import { INDIVIDUAL_PACKAGE, INDIVIDUAL_SUBSCRIBE_URL } from '@/lib/individual-tariff';
import type { ReactNode } from 'react';

/**
 * The Alaap Individual IP-Telephone plan card, drawn like the Alaap Cloud IP PBX plans on the
 * pricing page: name, monthly price, the action, then a checked feature list, with the
 * free-talktime terms as a footnote. No hooks, so the home page can render it on the server.
 */
export function IndividualTariff({
  locale,
  action,
}: {
  locale: string;
  /** Sits between the price and the features, where a plan's Buy button goes. */
  action?: ReactNode;
}) {
  const lang = locale === 'en' ? 'en' : 'bn';
  return (
    <div>
      <div className="group relative rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary">
        <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 transform">
          <div className="whitespace-nowrap rounded-full bg-gradient-to-r from-btcl-primary to-btcl-primaryDark px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-lg">
            {lang === 'en' ? 'Individual' : 'ব্যক্তিগত'}
          </div>
        </div>
        <div className="p-7">
          {/* Price display */}
          <div className="mb-5 text-center">
            <h3 className="mb-3 text-xl font-bold text-gray-900">{INDIVIDUAL_PACKAGE.name}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">
                ৳{INDIVIDUAL_PACKAGE.monthlyCharge.toLocaleString()}
              </span>
              <span className="text-sm text-gray-600">/{lang === 'en' ? 'month' : 'মাস'}</span>
              <div className="mt-2 text-xs text-gray-500">
                {lang === 'en' ? '1 Extension · VAT applicable' : '১টি এক্সটেনশন · ভ্যাট প্রযোজ্য'}
              </div>
            </div>
          </div>

          {/* Action button */}
          {action && <div className="mb-6">{action}</div>}

          {/* Features */}
          <div className="space-y-2">
            {INDIVIDUAL_PACKAGE.features.map((feature) => (
              <div key={feature.en} className="flex items-start gap-2">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                  <svg
                    className="h-3 w-3 text-btcl-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium leading-snug text-gray-700">
                  {feature[lang]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        {INDIVIDUAL_PACKAGE.talktimeNote[lang]}
      </p>
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
        className="block w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-center text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
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
        className="w-full cursor-not-allowed rounded-xl bg-gray-300 px-6 py-3 text-sm font-semibold text-gray-600"
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
