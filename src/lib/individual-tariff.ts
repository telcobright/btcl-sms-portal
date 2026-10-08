/**
 * The one package BTCL sells a customer registered as an Individual: Alaap Individual
 * IP-Telephone.
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

/** As BTCL's package sheet lists it, written as feature lines like the IP PBX plans. */
export const INDIVIDUAL_PACKAGE: {
  name: string;
  monthlyCharge: number;
  features: Bilingual[];
  /** Explains the asterisk on the free talktime line. */
  talktimeNote: Bilingual;
} = {
  name: 'Alaap Individual IP-Telephone',
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
