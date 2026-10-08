/**
 * The one service BTCL sells a customer registered as an Individual: IPTSP voice calling.
 *
 * IP PBX, Voice Broadcasting, Contact Center and Bulk SMS are for businesses and government
 * offices, so a signed-in Individual is shown this tariff instead of them, on the pricing page
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
 * Where an Individual subscribes. Null until the package exists, and the tariff then says
 * "Coming soon" rather than offering a button that leads nowhere.
 */
export const INDIVIDUAL_SUBSCRIBE_URL: string | null = null;

type Bilingual = { en: string; bn: string };

export interface TariffRow {
  description: Bilingual;
  rate: Bilingual;
}

export const INDIVIDUAL_TARIFF: {
  title: Bilingual;
  category: Bilingual;
  monthlyCharge: number;
  freeMinutes: number;
  rows: TariffRow[];
} = {
  title: { en: 'IPTSP Voice Call Service', bn: 'আইপিটিএসপি ভয়েস কল সেবা' },
  category: { en: 'Individual', bn: 'ব্যক্তিগত' },
  monthlyCharge: 100,
  freeMinutes: 250,
  rows: [
    {
      description: {
        en: 'BTCL IPTSP to Other IPTSP',
        bn: 'বিটিসিএল আইপিটিএসপি থেকে অন্য আইপিটিএসপি',
      },
      rate: { en: '0 Taka / Minute', bn: '০ টাকা / মিনিট' },
    },
    {
      description: {
        en: 'BTCL IPTSP to Mobile Network Operator / PSTN Operator',
        bn: 'বিটিসিএল আইপিটিএসপি থেকে মোবাইল নেটওয়ার্ক অপারেটর / পিএসটিএন অপারেটর',
      },
      rate: { en: '0.35 Taka / Minute', bn: '০.৩৫ টাকা / মিনিট' },
    },
    {
      description: { en: 'Free Talktime', bn: 'ফ্রি টকটাইম' },
      rate: { en: '250 Minute / Month', bn: '২৫০ মিনিট / মাস' },
    },
    {
      description: { en: 'Monthly Subscription Charge', bn: 'মাসিক সাবস্ক্রিপশন চার্জ' },
      rate: { en: '100 Taka / Month', bn: '১০০ টাকা / মাস' },
    },
  ],
};
