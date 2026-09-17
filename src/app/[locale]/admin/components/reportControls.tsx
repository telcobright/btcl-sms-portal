'use client';

import { useEffect, useRef, useState } from 'react';
import { isSettled } from '@/lib/api-client/revenue';

/**
 * Controls shared by the admin report pages.
 *
 * Revenue and Recharge Report are the same kind of screen — a filter toolbar over a paged
 * table of payments — and they read as one report family because they are built from the
 * same controls. What only one page needs stays in that page.
 */

/** An amount as the reports print it: never "NaN", which a malformed one used to render as. */
export const money = (v: string | null) => {
  if (v == null) return '—';
  const n = Number(v);
  // The gateway sends amounts as strings; a malformed one used to render as "NaN".
  return Number.isFinite(n)
    ? n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';
};

/** The colour of a status pill: settled money reads green, the rest by outcome. */
export const statusStyle = (status: string | null) => {
  if (isSettled(status)) return 'bg-green-100 text-green-700';
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-700';
    case 'FAILED':
      return 'bg-red-100 text-red-700';
    case 'CANCELLED':
      return 'bg-gray-200 text-gray-700';
    case 'EXPIRED':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

/** One headline figure above the table. */
export const Tile = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4">
    <div className={'text-xl font-semibold ' + (tone || 'text-gray-900')}>{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

export /** Shared look for the toolbar's text and date inputs, so every control is the same height. */
const CONTROL =
  'h-9 rounded-lg border border-gray-300 bg-white px-2.5 text-sm text-gray-700 ' +
  'placeholder:text-gray-400 focus:outline-none focus:border-[#0D529E] focus:ring-1 focus:ring-[#0D529E]';

export type Option = { readonly value: string; readonly label: string; readonly group?: string };

/**
 * A multi-select filter collapsed into one button.
 *
 * The button names what is selected (or "All"), so the toolbar still reads as a summary
 * of the active filters without spending a row per filter on chips.
 */
export const MultiSelect = ({
  label,
  options,
  groups,
  header,
  value,
  onChange,
}: {
  label: string;
  options: readonly Option[];
  groups?: readonly { readonly value: string; readonly label: string }[];
  header?: string;
  value: string | undefined;
  onChange: (next: string | undefined) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = (value || '').split(',').filter(Boolean);
  const names = options.filter((o) => selected.includes(o.value)).map((o) => o.label);
  const summary =
    names.length === 0 ? 'All' : names.length <= 2 ? names.join(', ') : names.length + ' selected';

  const toggle = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(Array.from(next).join(',') || undefined);
  };

  const sections = groups
    ? groups.map((g) => ({ key: g.value, label: g.label, items: options.filter((o) => o.group === g.value) }))
    : [{ key: 'all', label: undefined as string | undefined, items: options }];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={
          'h-9 inline-flex items-center gap-1.5 rounded-lg border px-3 text-sm whitespace-nowrap ' +
          (names.length
            ? 'border-[#0D529E] bg-[#0D529E]/5 text-[#0D529E]'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400')
        }
      >
        <span className={names.length ? 'text-[#0D529E]/80' : 'text-gray-500'}>{label}:</span>
        <span className="font-medium max-w-[9rem] truncate">{summary}</span>
        <svg className="h-3.5 w-3.5 shrink-0 opacity-60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-1 min-w-[13rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {header && (
            <div className="border-b border-gray-100 px-3 pb-1.5 pt-1 text-[11px] font-semibold text-[#1F3C71]">
              {header}
            </div>
          )}
          {sections.map((sec) => (
            <div key={sec.key} className="py-0.5">
              {sec.label && (
                <div className="px-3 pb-0.5 pt-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  {sec.label}
                </div>
              )}
              {sec.items.map((o) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-[#0D529E]"
                    checked={selected.includes(o.value)}
                    onChange={() => toggle(o.value)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          ))}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="mt-0.5 w-full border-t border-gray-100 px-3 py-1.5 text-left text-xs font-medium text-[#0D529E] hover:bg-gray-50"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
};
