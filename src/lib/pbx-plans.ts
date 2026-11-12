/**
 * The Alaap Cloud IP PBX plans, in one place for every page that shows them.
 *
 * The pricing page lists them all and the homepage shows the cheapest one as "Starting from".
 * The homepage used to carry its own copy, and showed Bronze (৳1,200, 10 extensions,
 * 500 minutes) as the starting price long after Starter (৳250) was the cheapest plan.
 *
 * A price here is also checked by PaymentGateWay (application-btcl.properties) and has a
 * package row in the PBX database, so a change must be made there as well.
 */

type Bilingual = { en: string; bn: string };

interface PbxPlanSpec {
  /** The plan's key in the checkout. */
  id: 'starter' | 'economy' | 'bronze' | 'silver' | 'gold';
  name: Bilingual;
  /** A number, or a phrase such as "Up to 100". */
  extensions: number | Bilingual;
  callChannels: number;
  ivr: number;
  /** One-time allowance at activation, in minutes. */
  freeTalktime: number;
  /** Taka per minute. */
  callCharge: number;
  /** Taka per month, before VAT. */
  price: number;
  postpaidCredit: number;
  popular: boolean;
  features: Bilingual[];
}

const COMMON_FEATURES: Bilingual[] = [
  { en: 'Call Monitoring', bn: 'কল মনিটরিং' },
  { en: 'Voice Message to Email', bn: 'ভয়েস মেসেজ টু ইমেইল' },
  { en: 'Call Forwarding', bn: 'কল ফরওয়ার্ডিং' },
  { en: 'Conference Calling', bn: 'কনফারেন্স কলিং' },
  { en: 'Multi-Device Support', bn: 'মাল্টি-ডিভাইস সাপোর্ট' },
  { en: 'Call Recording', bn: 'কল রেকর্ডিং' },
];

export const PBX_PLANS: PbxPlanSpec[] = [
  {
    id: 'starter',
    name: { en: 'Starter', bn: 'স্টার্টার' },
    extensions: 3,
    callChannels: 2,
    ivr: 1,
    freeTalktime: 60,
    callCharge: 0.45,
    price: 250,
    postpaidCredit: 1000,
    popular: false,
    features: [
      { en: '3 Extensions', bn: '৩টি এক্সটেনশন' },
      { en: '2 Call Channels', bn: '২টি কল চ্যানেল' },
      { en: '1 IVR', bn: '১টি IVR' },
      { en: '60 Minutes Free Talktime*', bn: '৬০ মিনিট ফ্রি টকটাইম*' },
      ...COMMON_FEATURES,
      { en: '৳0.45/min Call Charge', bn: '৳০.৪৫/মিনিট কল চার্জ' },
    ],
  },
  {
    id: 'economy',
    name: { en: 'Economy', bn: 'ইকোনমি' },
    extensions: 5,
    callChannels: 2,
    ivr: 1,
    freeTalktime: 120,
    callCharge: 0.45,
    price: 450,
    postpaidCredit: 2000,
    popular: false,
    features: [
      { en: '5 Extensions', bn: '৫টি এক্সটেনশন' },
      { en: '2 Call Channels', bn: '২টি কল চ্যানেল' },
      { en: '1 IVR', bn: '১টি IVR' },
      { en: '120 Minutes Free Talktime*', bn: '১২০ মিনিট ফ্রি টকটাইম*' },
      ...COMMON_FEATURES,
      { en: '৳0.45/min Call Charge', bn: '৳০.৪৫/মিনিট কল চার্জ' },
    ],
  },
  {
    id: 'bronze',
    name: { en: 'Bronze', bn: 'ব্রোঞ্জ' },
    extensions: 10,
    callChannels: 5,
    ivr: 2,
    freeTalktime: 500,
    callCharge: 0.45,
    price: 1200,
    postpaidCredit: 5000,
    popular: true,
    features: [
      { en: '10 Extensions', bn: '১০টি এক্সটেনশন' },
      { en: '5 Call Channels', bn: '৫টি কল চ্যানেল' },
      { en: '2 IVR', bn: '২টি IVR' },
      { en: '500 Minutes Free Talktime*', bn: '৫০০ মিনিট ফ্রি টকটাইম*' },
      ...COMMON_FEATURES,
      { en: '৳0.45/min Call Charge', bn: '৳০.৪৫/মিনিট কল চার্জ' },
    ],
  },
  {
    id: 'silver',
    name: { en: 'Silver', bn: 'সিলভার' },
    extensions: 30,
    callChannels: 7,
    ivr: 5,
    freeTalktime: 1000,
    callCharge: 0.4,
    price: 2500,
    postpaidCredit: 10000,
    popular: false,
    features: [
      { en: '30 Extensions', bn: '৩০টি এক্সটেনশন' },
      { en: '7 Call Channels', bn: '৭টি কল চ্যানেল' },
      { en: '5 IVR', bn: '৫টি IVR' },
      { en: '1000 Minutes Free Talktime*', bn: '১০০০ মিনিট ফ্রি টকটাইম*' },
      ...COMMON_FEATURES,
      { en: '৳0.40/min Call Charge', bn: '৳০.৪০/মিনিট কল চার্জ' },
    ],
  },
  {
    id: 'gold',
    name: { en: 'Gold', bn: 'গোল্ড' },
    extensions: { en: 'Up to 100', bn: '১০০ পর্যন্ত' },
    callChannels: 15,
    ivr: 10,
    freeTalktime: 3000,
    callCharge: 0.35,
    price: 4500,
    postpaidCredit: 20000,
    popular: false,
    features: [
      { en: 'Up to 100 Extensions', bn: '১০০টি পর্যন্ত এক্সটেনশন' },
      { en: '15 Call Channels', bn: '১৫টি কল চ্যানেল' },
      { en: '10 IVR', bn: '১০টি IVR' },
      { en: '3000 Minutes Free Talktime*', bn: '৩০০০ মিনিট ফ্রি টকটাইম*' },
      ...COMMON_FEATURES,
      { en: '৳0.35/min Call Charge', bn: '৳০.৩৫/মিনিট কল চার্জ' },
    ],
  },
];

const pick = (text: Bilingual, locale: string) => (locale === 'en' ? text.en : text.bn);

/** The plans in the shape the pricing page renders, with text in the page's language. */
export function pbxPackagesFor(locale: string) {
  return PBX_PLANS.map((plan) => ({
    id: plan.id,
    name: pick(plan.name, locale),
    extensions: typeof plan.extensions === 'number' ? plan.extensions : pick(plan.extensions, locale),
    callChannels: plan.callChannels,
    ivr: plan.ivr,
    freeTalktime: plan.freeTalktime,
    callCharge: plan.callCharge,
    price: plan.price,
    postpaidCredit: plan.postpaidCredit,
    popular: plan.popular,
    features: plan.features.map((feature) => pick(feature, locale)),
  }));
}

/** The plan with the lowest monthly price: what "Starting from" means. */
export function cheapestPbxPlan(): PbxPlanSpec {
  return PBX_PLANS.reduce((cheapest, plan) => (plan.price < cheapest.price ? plan : cheapest));
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const toBnDigits = (value: string) => value.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

/** "Starting from" for the homepage card: the cheapest plan's price and its headline features. */
export function pbxStartingFrom(locale: string) {
  const plan = cheapestPbxPlan();
  const en = locale === 'en';
  const extensions =
    typeof plan.extensions === 'number'
      ? en
        ? `${plan.extensions} Extensions`
        : `${toBnDigits(String(plan.extensions))}টি এক্সটেনশন`
      : `${pick(plan.extensions, locale)} ${en ? 'Extensions' : 'এক্সটেনশন'}`;
  const talktime = en
    ? `${plan.freeTalktime} Min Free Talktime*`
    : `${toBnDigits(String(plan.freeTalktime))} মিনিট ফ্রি টকটাইম*`;
  return {
    price: `৳${plan.price.toLocaleString('en-US')}`,
    features: [extensions, talktime, en ? 'Call Recording' : 'কল রেকর্ডিং'],
  };
}
