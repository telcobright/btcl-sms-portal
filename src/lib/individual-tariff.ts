/**
 * The one package BTCL sells a customer registered as an Individual: Individual IP-Telephone.
 *
 * IP PBX, Voice Broadcasting, Contact Center and Bulk SMS are for businesses and government
 * offices, so a signed-in Individual is shown this package instead of them, on the pricing page
 * and the dashboard. PaymentGateWay refuses those packages to an Individual as well
 * (CustomerCategoryGuard), so hiding them here is presentation; the server is the control.
 *
 * A Government Individual is not included: postpaid IP PBX, with its security deposit, is
 * sold to exactly that category.
 */

export function isIndividualCategory(category: string | null | undefined): boolean {
  return (category ?? '').trim().toUpperCase() === 'INDIVIDUAL';
}

/**
 * Where an Individual subscribes. Null until the package exists, and the package then says
 * "Coming soon" rather than offering a button that leads nowhere.
 */
export const INDIVIDUAL_SUBSCRIBE_URL: string | null = null;

type Bilingual = { en: string; bn: string };

export interface PackageFeature {
  label: Bilingual;
  /** What the package gives; `true` for a feature that is simply included. */
  value: Bilingual | true;
}

const ONE: Bilingual = { en: '1', bn: '১' };

/** As BTCL's package sheet lists it, in the sheet's order. */
export const INDIVIDUAL_PACKAGE: {
  name: string;
  category: Bilingual;
  monthlyCharge: number;
  freeMinutes: number;
  features: PackageFeature[];
} = {
  name: 'Individual IP-Telephone',
  category: { en: 'Individual', bn: 'ব্যক্তিগত' },
  monthlyCharge: 100,
  freeMinutes: 250,
  features: [
    { label: { en: 'DID', bn: 'ডিআইডি' }, value: ONE },
    { label: { en: 'Extensions', bn: 'এক্সটেনশন' }, value: ONE },
    { label: { en: 'Call Channel', bn: 'কল চ্যানেল' }, value: ONE },
    { label: { en: 'IVR', bn: 'IVR' }, value: ONE },
    { label: { en: 'Call Monitoring', bn: 'কল মনিটরিং' }, value: true },
    { label: { en: 'Voice Message to Email', bn: 'ভয়েস মেসেজ টু ইমেইল' }, value: true },
    { label: { en: 'Call Permission', bn: 'কল পারমিশন' }, value: true },
    { label: { en: 'Inbound Route', bn: 'ইনবাউন্ড রুট' }, value: ONE },
    { label: { en: 'Call Forwarding', bn: 'কল ফরওয়ার্ডিং' }, value: true },
    { label: { en: 'Call Recording', bn: 'কল রেকর্ডিং' }, value: true },
    {
      label: { en: 'Free Talktime', bn: 'ফ্রি টকটাইম' },
      value: {
        en: '250 minutes/month upon every paid monthly subscription charge, 1 sec pulse, 30 days validity, only allowable for domestic calls.',
        bn: 'প্রতিটি মাসিক সাবস্ক্রিপশন চার্জ পরিশোধে মাসে ২৫০ মিনিট, ১ সেকেন্ড পালস, ৩০ দিন মেয়াদ, শুধুমাত্র দেশীয় কলের জন্য প্রযোজ্য।',
      },
    },
    {
      label: { en: 'Call Rate', bn: 'কল রেট' },
      value: {
        en: '0.35 Taka/Minute, VAT applicable, 1 sec pulse. Outgoing calls are blocked if the balance finishes, and if the monthly subscription is not paid.',
        bn: '০.৩৫ টাকা/মিনিট, ভ্যাট প্রযোজ্য, ১ সেকেন্ড পালস। ব্যালেন্স শেষ হলে এবং মাসিক সাবস্ক্রিপশন পরিশোধ না হলে আউটগোয়িং কল বন্ধ থাকবে।',
      },
    },
    {
      label: { en: 'Subscription Charge', bn: 'সাবস্ক্রিপশন চার্জ' },
      value: { en: '100 Taka/Month, VAT applicable', bn: '১০০ টাকা/মাস, ভ্যাট প্রযোজ্য' },
    },
  ],
};
