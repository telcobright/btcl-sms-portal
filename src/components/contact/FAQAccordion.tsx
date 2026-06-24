'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

export function FAQAccordion({ faqs }: { faqs: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow duration-200 hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primary text-sm font-bold text-white">
                Q
              </div>
              <h3 className="flex-1 pt-0.5 text-base font-semibold text-gray-900 leading-snug md:text-lg">
                {faq.question}
              </h3>
              <ChevronDown
                className={`mt-1 h-5 w-5 flex-shrink-0 text-btcl-primary transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="flex items-start gap-4 border-t border-gray-100 px-6 py-5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/20 text-sm font-bold text-btcl-primaryDark">
                    A
                  </div>
                  <div className="flex-1 pt-0.5 text-sm leading-relaxed text-gray-700">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
