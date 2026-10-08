'use client';

import { useEffect, useState } from 'react';
import { getServicePricing } from '@/lib/api-client/servicePricing';
import {
  formatRate,
  lowestRate,
  type PricedService,
  type ServicePricingMap,
} from '@/lib/servicePricing';

/**
 * "Starting from ৳x/message" for a slab-priced service, from the admin-edited slabs.
 *
 * Fetched in the browser: the page around it is server-rendered, and the Next server reaching
 * the public API through its own domain is not something to depend on. Both cards on a page
 * share one request. If the prices cannot be loaded the line is left out rather than guessed.
 */
let shared: Promise<ServicePricingMap> | null = null;
const load = () => {
  if (!shared) {
    shared = getServicePricing().catch((err) => {
      shared = null; // let a later mount try again
      throw err;
    });
  }
  return shared;
};

export default function StartingFromPrice({
  service,
  description,
  unit,
}: {
  service: PricedService;
  description: string;
  unit: string;
}) {
  const [rate, setRate] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    load()
      .then((pricing) => alive && setRate(lowestRate(pricing[service])))
      .catch(() => alive && setRate(null));
    return () => {
      alive = false;
    };
  }, [service]);

  if (rate === null) return null;

  return (
    <>
      <div className="mb-2 text-xs text-gray-500">{description}</div>
      <div>
        {rate === undefined ? (
          <span className="inline-block h-8 w-20 animate-pulse rounded bg-gray-200 align-middle" />
        ) : (
          <span className="text-3xl font-bold text-gray-900">৳{formatRate(rate)}</span>
        )}
        <span className="text-sm text-gray-600">{unit}</span>
      </div>
    </>
  );
}
