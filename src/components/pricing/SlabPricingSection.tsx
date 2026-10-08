'use client';

import React from 'react';
import {
  formatRange,
  formatRate,
  maxBuyableQuantity,
  slabName,
  type Quote,
  type ServicePricing,
} from '@/lib/servicePricing';

/**
 * Slab table + quantity calculator for a per-message service (Voice Broadcasting, Bulk SMS).
 *
 * Prices come from the admin-edited slabs (see src/lib/servicePricing.ts). While they load, or
 * if they cannot be loaded, the section says so and offers no Buy button: showing built-in
 * prices instead would quote amounts PaymentGateWay then refuses.
 */
interface Props {
  id: string;
  locale: string;
  icon: string;
  title: string;
  /** Extra content under the subtitle (e.g. the BTRC aggregator tag). */
  headerExtra?: React.ReactNode;
  pricing: ServicePricing | undefined;
  status: 'loading' | 'error' | 'ready';
  onRetry: () => void;
  quantity: number | '';
  setQuantity: (q: number | '') => void;
  currentQuote: Quote | null;
  /** Logged in, but documents keep this partner from buying. */
  purchaseDisabled: boolean;
  /** Replaces the Buy button when a service-specific gate applies (SMS: BTRC licence). */
  gate?: React.ReactNode;
  onBuy: () => void;
}

export default function SlabPricingSection({
  id,
  locale,
  icon,
  title,
  headerExtra,
  pricing,
  status,
  onRetry,
  quantity,
  setQuantity,
  currentQuote,
  purchaseDisabled,
  gate,
  onBuy,
}: Props) {
  const en = locale === 'en';
  const slabs = pricing?.slabs ?? [];
  const limits = pricing?.limits;
  const maxQty = pricing ? maxBuyableQuantity(pricing) : null;
  const q = currentQuote;
  const overQuantity = !!q && (q.overMaxQuantity || q.noSlab);

  const minTotalText = limits ? `৳${limits.minTotal.toLocaleString()}` : '';
  const maxTotalText = limits?.maxTotal != null ? `৳${limits.maxTotal.toLocaleString()}` : '';
  const maxQtyText = maxQty != null ? maxQty.toLocaleString() : '';

  const disabledButton = (text: string, tone: 'grey' | 'red') => (
    <button
      disabled
      className={`w-full mt-4 py-3 rounded-xl font-semibold text-lg cursor-not-allowed ${
        tone === 'grey' ? 'bg-gray-300 text-gray-600' : 'bg-red-100 text-red-400'
      }`}
    >
      {text}
    </button>
  );

  return (
    <div id={id} className="py-20 bg-btcl-primaryLight/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-4 bg-btcl-primaryLight/10 text-btcl-primaryDark">
            <img src={icon} alt="" className="h-10 w-10 object-contain" />
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
          <p className="text-gray-600 text-lg">
            {en ? 'Pay per message — volume-based pricing' : 'প্রতি মেসেজ মূল্য — পরিমাণ ভিত্তিক'}
          </p>
          {headerExtra && <div className="mt-3 flex justify-center">{headerExtra}</div>}
        </div>

        {status !== 'ready' || !pricing ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            {status === 'loading' ? (
              <div className="space-y-3 animate-pulse" aria-label={en ? 'Loading prices' : 'মূল্য লোড হচ্ছে'}>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            ) : (
              <>
                <p className="text-gray-700 font-medium">
                  {en ? 'Prices could not be loaded.' : 'মূল্য লোড করা যায়নি।'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {en ? 'Please check your connection and try again.' : 'সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।'}
                </p>
                <button
                  onClick={onRetry}
                  className="mt-4 rounded-lg border-2 border-btcl-primary bg-white py-2 px-6 text-sm font-semibold text-btcl-primary transition-colors hover:bg-btcl-primary hover:text-white"
                >
                  {en ? 'Retry' : 'আবার চেষ্টা করুন'}
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Slab Rate Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-btcl-primaryLight/10">
                    <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-700">
                      {en ? 'Message Range' : 'মেসেজ পরিসীমা'}
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-700">
                      {en ? 'Slab' : 'স্ল্যাব'}
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-right font-semibold text-gray-700">
                      {en ? 'Rate / Message' : 'প্রতি মেসেজ রেট'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {slabs.map((slab, idx) => (
                    <tr
                      key={idx}
                      className={`border-t border-gray-100 ${q?.slab === slab ? 'bg-btcl-primaryLight/10 font-semibold' : ''}`}
                    >
                      <td className="px-4 sm:px-6 py-3 text-gray-800">{formatRange(slab)}</td>
                      <td className="px-4 sm:px-6 py-3 text-gray-600">
                        <span className="inline-flex flex-wrap items-center gap-2">
                          {slabName(slab, locale)}
                          {slab.conditionsApply && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              {en ? 'Conditions applicable' : 'শর্ত প্রযোজ্য'}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-right text-gray-800">৳{formatRate(slab.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quantity Input + Price Calculator */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left — Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {en ? 'Enter Number of Messages' : 'মেসেজ সংখ্যা লিখুন'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuantity(val === '' ? '' : Math.max(1, parseInt(val) || 1));
                    }}
                    placeholder={en ? 'e.g. 15000' : 'যেমন ১৫০০০'}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-lg text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-btcl-primary focus:border-btcl-primary outline-none"
                  />
                  {q?.slab && (
                    <p className="mt-2 text-sm text-btcl-primary font-medium">
                      {en
                        ? `Slab: ${slabName(q.slab, locale)} — ৳${formatRate(q.slab.rate)}/message`
                        : `স্ল্যাব: ${slabName(q.slab, locale)} — ৳${formatRate(q.slab.rate)}/মেসেজ`}
                    </p>
                  )}
                  {q?.underMin && (
                    <p className="mt-1 text-sm text-red-600 font-medium">
                      {en
                        ? `Minimum purchase amount is ${minTotalText} (incl. VAT)`
                        : `সর্বনিম্ন ক্রয় পরিমাণ ${minTotalText} (ভ্যাটসহ)`}
                    </p>
                  )}
                  {overQuantity && (
                    <p className="mt-1 text-sm text-red-600 font-medium">
                      {en
                        ? `Maximum purchase limit is ${maxQtyText} messages`
                        : `সর্বোচ্চ ক্রয় সীমা ${maxQtyText} মেসেজ`}
                    </p>
                  )}
                  {!overQuantity && q?.overMaxTotal && (
                    <p className="mt-1 text-sm text-red-600 font-medium">
                      {en
                        ? `Maximum purchase limit is ${maxTotalText} (incl. VAT)`
                        : `সর্বোচ্চ ক্রয় সীমা ${maxTotalText} (ভ্যাটসহ)`}
                    </p>
                  )}
                </div>

                {/* Right — Price Breakdown */}
                <div className="space-y-3">
                  {q && typeof quantity === 'number' && quantity >= 1 && (q.slab || overQuantity) ? (
                    <>
                      {q.slab && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {quantity.toLocaleString()} × ৳{formatRate(q.slab.rate)}
                            </span>
                            <span className="font-medium">৳{q.price.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{en ? 'VAT (15%)' : 'ভ্যাট (১৫%)'}</span>
                            <span>৳{q.vat.toLocaleString()}</span>
                          </div>
                          <hr className="border-gray-200" />
                          <div className="flex justify-between text-lg font-bold">
                            <span>{en ? 'Total' : 'মোট'}</span>
                            <span className="text-btcl-primary">৳{q.total.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                      <div className="text-xs text-gray-500">{en ? 'Validity: 5 Years' : 'মেয়াদ: ৫ বছর'}</div>

                      {purchaseDisabled
                        ? disabledButton(en ? 'Purchase Disabled' : 'ক্রয় নিষ্ক্রিয়', 'grey')
                        : q.underMin
                          ? disabledButton(
                              en ? `Minimum ${minTotalText} Required` : `সর্বনিম্ন ${minTotalText} প্রয়োজন`,
                              'red'
                            )
                          : overQuantity
                            ? disabledButton(
                                en ? `Limit Exceeded (max ${maxQtyText})` : `সীমা অতিক্রান্ত (সর্বোচ্চ ${maxQtyText})`,
                                'red'
                              )
                            : q.overMaxTotal
                              ? disabledButton(
                                  en ? `Limit Exceeded (max ${maxTotalText})` : `সীমা অতিক্রান্ত (সর্বোচ্চ ${maxTotalText})`,
                                  'red'
                                )
                              : gate ?? (
                                  <button
                                    onClick={onBuy}
                                    className="w-full mt-4 transform rounded-lg border-2 border-btcl-primary bg-white py-2.5 px-6 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
                                  >
                                    {en ? 'Buy Now' : 'এখনই কিনুন'}
                                  </button>
                                )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      {en ? 'Enter quantity to see pricing' : 'মূল্য দেখতে পরিমাণ লিখুন'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
