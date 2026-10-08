'use client';

/**
 * The one-time security deposit a government individual on postpaid pays before the
 * first purchase. Shown in place of the order summary until it is paid; the server
 * refuses the purchase meanwhile, so this is the customer's way through, not a nag.
 */
export default function DepositStep({
  amount,
  currency,
  packageName,
  busy,
  onPay,
  locale,
}: {
  amount: number;
  currency: string;
  packageName: string;
  busy: boolean;
  onPay: () => void;
  locale: string;
}) {
  const en = locale === 'en';
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <h3 className="text-lg font-bold text-gray-900">
        {en ? 'One-time security deposit' : 'এককালীন জামানত'}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">
        {en
          ? `Postpaid accounts for government individuals require a one-time security deposit before the first purchase. Pay it once; every later purchase, including ${packageName}, goes straight through.`
          : `সরকারি ব্যক্তিগত পোস্টপেইড অ্যাকাউন্টে প্রথম ক্রয়ের আগে এককালীন জামানত দিতে হয়। একবার দিলেই হবে; এরপর ${packageName} সহ প্রতিটি ক্রয় সরাসরি সম্পন্ন হবে।`}
      </p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">
          {amount.toLocaleString()} {currency}
        </span>
        <span className="text-sm text-gray-500">{en ? 'paid once' : 'একবার'}</span>
      </div>
      <button
        type="button"
        onClick={onPay}
        disabled={busy}
        className="mt-5 w-full rounded-xl bg-btcl-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-btcl-primaryDark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy
          ? en ? 'Opening payment…' : 'পেমেন্ট খোলা হচ্ছে…'
          : en ? 'Pay deposit with bKash / Nagad / Rocket' : 'বিকাশ / নগদ / রকেটে জামানত দিন'}
      </button>
      <p className="mt-3 text-xs text-gray-500">
        {en
          ? 'You will be brought back here to complete your purchase. A receipt stays on your dashboard.'
          : 'ক্রয় সম্পন্ন করতে আপনাকে এখানে ফিরিয়ে আনা হবে। রসিদ আপনার ড্যাশবোর্ডে থাকবে।'}
      </p>
    </div>
  );
}
