/**
 * The one package BTCL sells a customer registered as an Individual: Alaap Cloud Individual IP-Telephone.
 *
 * IP PBX, Voice Broadcasting, Contact Center and Bulk SMS are for businesses and government
 * offices, so a signed-in Individual is shown this package instead of them, on the pricing page
 * and the dashboard. PaymentGateWay refuses those packages to an Individual as well
 * (CustomerCategoryGuard), so hiding them here is presentation; the server is the control.
 */

/**
 * Whether this category is an Individual account: a private Individual or a Government
 * Individual. A person rather than an organisation either way, and BTCL sells both the same
 * one plan.
 */
export function isIndividualCategory(category: string | null | undefined): boolean {
  const key = (category ?? '').trim().toUpperCase();
  return key === 'INDIVIDUAL' || key === 'GOVERNMENT_INDIVIDUAL';
}

type Bilingual = { en: string; bn: string };

/** As BTCL's package sheet lists it, written as feature lines like the IP PBX plans. */
export const INDIVIDUAL_PACKAGE: {
  /** The plan's key in the checkout, beside starter, bronze and the other IP PBX plans. */
  slug: string;
  /** Its package in the IP PBX service, which is where it is bought and provisioned. */
  packageId: number;
  name: string;
  monthlyCharge: number;
  features: Bilingual[];
  /** Explains the asterisk on the free talktime line. */
  talktimeNote: Bilingual;
  /**
   * The IP PBX DID pool its numbers come from (BTCL INDIVIDUAL). The PBX backend serves this
   * pool to Individual accounts only, so it is safe to ask for it by id.
   */
  didPoolId: number;
  /** Where the subscriber picks their number once the plan is bought. */
  myDidUrl: string;
} = {
  slug: 'individual',
  packageId: 10002,
  didPoolId: 3,
  myDidUrl: 'https://ippbx.alaapcloud.gov.bd:5174/my-did',
  name: 'Alaap Cloud Individual IP-Telephone',
  monthlyCharge: 100,
  features: [
    { en: '1 DID', bn: '১টি ডিআইডি' },
    { en: '1 Extension', bn: '১টি এক্সটেনশন' },
    { en: '1 Call Channel', bn: '১টি কল চ্যানেল' },
    { en: '1 IVR', bn: '১টি IVR' },
    { en: 'Call Monitoring', bn: 'কল মনিটরিং' },
    { en: 'Voice Message to Email', bn: 'ভয়েস মেসেজ টু ইমেইল' },
    { en: 'Call Permission', bn: 'কল পারমিশন' },
    { en: '1 Inbound Route', bn: '১টি ইনবাউন্ড রুট' },
    { en: 'Call Forwarding', bn: 'কল ফরওয়ার্ডিং' },
    { en: 'Call Recording', bn: 'কল রেকর্ডিং' },
    { en: '250 Minutes Free Talktime/Month*', bn: 'মাসে ২৫০ মিনিট ফ্রি টকটাইম*' },
    { en: '৳0.35/min Call Charge, 1 sec pulse', bn: '৳০.৩৫/মিনিট কল চার্জ, ১ সেকেন্ড পালস' },
  ],
  talktimeNote: {
    en: '*250 minutes/month upon every paid monthly subscription charge, 1 sec pulse, 30 days validity, only allowable for domestic calls. VAT applicable on the subscription and call charges.',
    bn: '*প্রতিটি মাসিক সাবস্ক্রিপশন চার্জ পরিশোধে মাসে ২৫০ মিনিট, ১ সেকেন্ড পালস, ৩০ দিন মেয়াদ, শুধুমাত্র দেশীয় কলের জন্য প্রযোজ্য। সাবস্ক্রিপশন ও কল চার্জে ভ্যাট প্রযোজ্য।',
  },
};

/** The reports' key for the Individual IP-Telephone line, beside pbx, hcc, vbs and sms. */
export const INDIVIDUAL_SERVICE_KEY = 'individual';

/**
 * Whether a PBX sale belongs to the Individual IP-Telephone line: the Individual plan itself,
 * whoever bought it, or anything an Individual customer bought (their top-ups). The same rule
 * the payment gateway and the operator summary apply on the server.
 */
export function isIndividualLine(
  service: string | null | undefined,
  idPackage: number | string | null | undefined,
  category: string | null | undefined
): boolean {
  return (
    service === 'pbx' &&
    (Number(idPackage) === INDIVIDUAL_PACKAGE.packageId || isIndividualCategory(category))
  );
}

/**
 * Days before expiry when a plan offers Renew: the IP PBX portal's ExpiryBanner rule.
 * PaymentGateWay refuses an earlier renewal of the Individual plan (RenewalWindowGuard).
 */
export const RENEW_WINDOW_DAYS = 7;
