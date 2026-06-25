'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
}

export function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <FAQItem
          key={index}
          faq={faq}
          index={index}
          isOpen={openIndex === index}
          onToggle={() =>
            setOpenIndex(openIndex === index ? null : index)
          }
        />
      ))}
    </div>
  );
}

function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: FAQ;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
        isOpen
          ? 'border-btcl-primary shadow-lg'
          : 'border-gray-200 hover:border-btcl-primary/40 hover:shadow-md'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left md:px-6 md:py-5"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primary text-sm font-bold text-white">
            {index + 1}
          </div>
          <h3 className="pt-0.5 text-base font-semibold leading-snug text-gray-900 md:text-lg">
            {faq.question}
          </h3>
        </div>
        <ChevronDown
          className={`mt-1 h-5 w-5 flex-shrink-0 text-btcl-primary transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          strokeWidth={2.5}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-100 px-5 py-5 md:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/20 text-sm font-bold text-btcl-primaryDark">
                A
              </div>
              <div className="whitespace-pre-line pt-0.5 text-sm leading-relaxed text-gray-700">
                {renderAnswer(faq.answer)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderAnswer(answer: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = answer.split(urlRegex);
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-medium text-btcl-primary hover:underline"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
