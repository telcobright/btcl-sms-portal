'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Tags,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  getServicePricingForAdmin,
  servicePricingErrorMessage,
  updateServicePricing,
} from '@/lib/api-client/servicePricing';
import {
  firstProblem,
  formatRange,
  quote,
  type PricedService,
  type PricingLimits,
  type PricingSlab,
  type ServicePricing,
  type ServicePricingMap,
} from '@/lib/servicePricing';
import { useCanEdit } from '@/hooks/useCanEdit';
import ReadOnlyNotice from '../components/ReadOnlyNotice';

/**
 * Slab pricing for Voice Broadcasting and Bulk SMS.
 *
 * What is saved here is what customers are charged from the next purchase on: the public
 * pricing page reads it, and PaymentGateWay refuses any VBS / SMS purchase whose amounts do not
 * match it. A save replaces the service's whole slab list, so ranges must run on from 1 with no
 * gaps or overlaps; the same rules are checked here and again by TelcoREST.
 */

const SERVICES: { key: PricedService; title: string; description: string }[] = [
  {
    key: 'vbs',
    title: 'Alaap Cloud Voice Broadcasting Service',
    description: 'Pay per message, priced by how many messages are bought at once.',
  },
  {
    key: 'sms',
    title: 'Bulk SMS Service',
    description: 'Pay per SMS, priced by how many messages are bought at once.',
  },
];

/**
 * Package a purchase is recorded against, for a service with no slabs yet. Existing slabs keep
 * their own package and new slabs copy the one above, so admins never pick one.
 */
const DEFAULT_PACKAGE: Record<PricedService, number> = { vbs: 9135, sms: 9138 };

// Inputs are kept as text so a field can be empty while it is being typed.
interface SlabRow {
  nameEn: string;
  nameBn: string;
  minQty: string;
  maxQty: string;
  rate: string;
  packageId: string;
  conditionsApply: boolean;
}

interface LimitsForm {
  minTotal: string;
  maxTotal: string;
  maxQuantity: string;
}

interface Draft {
  limits: LimitsForm;
  slabs: SlabRow[];
}

const toDraft = (p: ServicePricing): Draft => ({
  limits: {
    minTotal: String(p.limits.minTotal),
    maxTotal: p.limits.maxTotal === null ? '' : String(p.limits.maxTotal),
    maxQuantity: p.limits.maxQuantity === null ? '' : String(p.limits.maxQuantity),
  },
  slabs: p.slabs.map((s) => ({
    nameEn: s.nameEn,
    nameBn: s.nameBn,
    minQty: String(s.minQty),
    maxQty: s.maxQty === null ? '' : String(s.maxQty),
    rate: String(s.rate),
    packageId: String(s.packageId),
    conditionsApply: s.conditionsApply,
  })),
});

const emptyDraft = (): Draft => ({
  limits: { minTotal: '10', maxTotal: '', maxQuantity: '' },
  slabs: [],
});

const optionalNumber = (v: string): number | null => (v.trim() === '' ? null : Number(v));
const requiredNumber = (v: string): number => (v.trim() === '' ? NaN : Number(v));

const fromDraft = (d: Draft): { limits: PricingLimits; slabs: PricingSlab[] } => ({
  limits: {
    minTotal: requiredNumber(d.limits.minTotal),
    maxTotal: optionalNumber(d.limits.maxTotal),
    maxQuantity: optionalNumber(d.limits.maxQuantity),
  },
  slabs: d.slabs.map((r) => ({
    nameEn: r.nameEn.trim(),
    nameBn: r.nameBn.trim(),
    minQty: requiredNumber(r.minQty),
    maxQty: optionalNumber(r.maxQty),
    rate: requiredNumber(r.rate),
    packageId: requiredNumber(r.packageId),
    conditionsApply: r.conditionsApply,
  })),
});

const formatTime = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' });
};

const inputClass =
  'w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0D529E]/30 focus:border-[#0D529E] disabled:bg-gray-50 disabled:text-gray-500';

export default function AdminServicePricingPage() {
  const canEdit = useCanEdit();
  const [saved, setSaved] = useState<ServicePricingMap>({});
  const [drafts, setDrafts] = useState<Record<PricedService, Draft>>({
    vbs: emptyDraft(),
    sms: emptyDraft(),
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    setLoading(true);
    try {
      const data = await getServicePricingForAdmin(authToken);
      setSaved(data);
      setDrafts({
        vbs: data.vbs ? toDraft(data.vbs) : emptyDraft(),
        sms: data.sms ? toDraft(data.sms) : emptyDraft(),
      });
      setLoadError(null);
    } catch (err) {
      setLoadError(servicePricingErrorMessage(err, 'Could not load service pricing.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSaved = (data: ServicePricingMap, service: PricedService) => {
    setSaved(data);
    // Only the saved service is reset from the server; the other keeps any unsaved edits.
    const fresh = data[service];
    setDrafts((prev) => ({ ...prev, [service]: fresh ? toDraft(fresh) : emptyDraft() }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading service pricing…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3C71] flex items-center gap-2">
            <Tags className="w-6 h-6 text-[#0D529E]" />
            Service Pricing
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Slab prices for Voice Broadcasting and Bulk SMS. A saved change shows on the pricing
            page and applies to the next purchase.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#0D529E] hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <ReadOnlyNotice className="mb-5" />

      {loadError && (
        <div className="mb-5 flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{loadError}</span>
        </div>
      )}

      {!loadError && (
        <div className="space-y-6">
          {SERVICES.map((svc) => (
            <ServiceCard
              key={svc.key}
              service={svc.key}
              title={svc.title}
              description={svc.description}
              saved={saved[svc.key]}
              draft={drafts[svc.key]}
              setDraft={(d) => setDrafts((prev) => ({ ...prev, [svc.key]: d }))}
              canEdit={canEdit}
              onSaved={(data) => onSaved(data, svc.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  service,
  title,
  description,
  saved,
  draft,
  setDraft,
  canEdit,
  onSaved,
}: {
  service: PricedService;
  title: string;
  description: string;
  saved: ServicePricing | undefined;
  draft: Draft;
  setDraft: (d: Draft) => void;
  canEdit: boolean;
  onSaved: (data: ServicePricingMap) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(null);
  const [testQty, setTestQty] = useState('');

  const parsed = useMemo(() => fromDraft(draft), [draft]);
  const problem = useMemo(() => firstProblem(parsed.limits, parsed.slabs), [parsed]);
  const dirty = useMemo(
    () => !saved || JSON.stringify(toDraft(saved)) !== JSON.stringify(draft),
    [saved, draft]
  );

  const updateRow = (index: number, patch: Partial<SlabRow>) => {
    setBanner(null);
    setDraft({ ...draft, slabs: draft.slabs.map((r, i) => (i === index ? { ...r, ...patch } : r)) });
  };

  const updateLimits = (patch: Partial<LimitsForm>) => {
    setBanner(null);
    setDraft({ ...draft, limits: { ...draft.limits, ...patch } });
  };

  const addSlab = () => {
    setBanner(null);
    const last = draft.slabs[draft.slabs.length - 1];
    const lastMax = last && last.maxQty.trim() !== '' ? Number(last.maxQty) : null;
    const nextMin = !last ? 1 : lastMax !== null && Number.isFinite(lastMax) ? lastMax + 1 : '';
    setDraft({
      ...draft,
      slabs: [
        ...draft.slabs,
        {
          nameEn: '',
          nameBn: '',
          minQty: String(nextMin),
          maxQty: '',
          rate: last?.rate ?? '',
          // Not shown on this page. A new slab is recorded against the same package as the
          // slab above it; the first slab of an empty service gets the service's basic package.
          packageId: last?.packageId ?? String(DEFAULT_PACKAGE[service]),
          conditionsApply: false,
        },
      ],
    });
  };

  const removeSlab = (index: number) => {
    setBanner(null);
    setDraft({ ...draft, slabs: draft.slabs.filter((_, i) => i !== index) });
  };

  const moveSlab = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= draft.slabs.length) return;
    setBanner(null);
    const slabs = [...draft.slabs];
    [slabs[index], slabs[target]] = [slabs[target], slabs[index]];
    setDraft({ ...draft, slabs });
  };

  const reset = () => {
    setBanner(null);
    setDraft(saved ? toDraft(saved) : emptyDraft());
  };

  const save = async () => {
    if (!canEdit || problem) return;
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    setSaving(true);
    setBanner(null);
    try {
      const data = await updateServicePricing(service, parsed.limits, parsed.slabs, authToken);
      onSaved(data);
      setBanner({ ok: true, text: 'Saved. The pricing page and checkout now use these prices.' });
    } catch (err) {
      setBanner({ ok: false, text: servicePricingErrorMessage(err, 'The prices could not be saved.') });
    } finally {
      setSaving(false);
    }
  };

  // The tester uses what is on screen, so an admin can see the effect before saving.
  const testQuote = useMemo(() => {
    const qty = Number(testQty);
    if (!testQty.trim() || !Number.isInteger(qty) || qty < 1 || problem) return null;
    return quote(
      { service, limits: parsed.limits, slabs: parsed.slabs, updatedAt: null, updatedBy: null },
      qty
    );
  }, [testQty, parsed, problem, service]);

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-[#1F3C71]">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <p className="text-xs text-gray-500">
          {saved
            ? `Last updated ${formatTime(saved.updatedAt)}${saved.updatedBy ? ` by ${saved.updatedBy}` : ''}`
            : 'No pricing saved yet — the pricing page cannot sell this service until it is.'}
        </p>
      </div>

      {banner && (
        <div
          className={`mb-4 flex items-start gap-2 p-3 rounded-lg border text-sm ${
            banner.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {banner.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{banner.text}</span>
        </div>
      )}

      {/* Limits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <LimitField
          label="Minimum total (৳, incl. VAT)"
          value={draft.limits.minTotal}
          onChange={(v) => updateLimits({ minTotal: v })}
          disabled={!canEdit}
        />
        <LimitField
          label="Maximum total (৳, incl. VAT)"
          hint="Blank = no limit"
          value={draft.limits.maxTotal}
          onChange={(v) => updateLimits({ maxTotal: v })}
          disabled={!canEdit}
        />
        <LimitField
          label="Maximum messages per purchase"
          hint="Blank = no limit"
          value={draft.limits.maxQuantity}
          onChange={(v) => updateLimits({ maxQuantity: v })}
          disabled={!canEdit}
        />
      </div>

      {/* Slabs */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
              <th className="px-2 py-2 w-16">Order</th>
              <th className="px-2 py-2">Name (English)</th>
              <th className="px-2 py-2">Name (Bangla)</th>
              <th className="px-2 py-2 w-28">From</th>
              <th className="px-2 py-2 w-28">To</th>
              <th className="px-2 py-2 w-28">Rate (৳/msg)</th>
              <th className="px-2 py-2 w-28 text-center">Conditions badge</th>
              <th className="px-2 py-2 w-12" />
            </tr>
          </thead>
          <tbody>
            {draft.slabs.map((row, i) => (
              <tr key={i} className="border-t border-gray-100 align-middle">
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1">
                    <IconButton
                      title="Move up"
                      onClick={() => moveSlab(i, -1)}
                      disabled={!canEdit || i === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      title="Move down"
                      onClick={() => moveSlab(i, 1)}
                      disabled={!canEdit || i === draft.slabs.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </IconButton>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <input
                    className={inputClass}
                    value={row.nameEn}
                    onChange={(e) => updateRow(i, { nameEn: e.target.value })}
                    disabled={!canEdit}
                    placeholder="e.g. Basic"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    className={inputClass}
                    value={row.nameBn}
                    onChange={(e) => updateRow(i, { nameBn: e.target.value })}
                    disabled={!canEdit}
                    placeholder="যেমন বেসিক"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    value={row.minQty}
                    onChange={(e) => updateRow(i, { minQty: e.target.value.replace(/[^\d]/g, '') })}
                    disabled={!canEdit}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    value={row.maxQty}
                    onChange={(e) => updateRow(i, { maxQty: e.target.value.replace(/[^\d]/g, '') })}
                    disabled={!canEdit}
                    placeholder="No limit"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={row.rate}
                    onChange={(e) => updateRow(i, { rate: e.target.value.replace(/[^\d.]/g, '') })}
                    disabled={!canEdit}
                  />
                </td>
                <td className="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[#0D529E]"
                    checked={row.conditionsApply}
                    onChange={(e) => updateRow(i, { conditionsApply: e.target.checked })}
                    disabled={!canEdit}
                    aria-label="Show the Conditions applicable badge"
                  />
                </td>
                <td className="px-2 py-2">
                  <IconButton
                    title="Remove slab"
                    onClick={() => removeSlab(i)}
                    disabled={!canEdit}
                    danger
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </td>
              </tr>
            ))}
            {draft.slabs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-6 text-center text-gray-500">
                  No slabs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Slabs must run on from 1 with no gaps or overlaps. Only the last slab may leave “To” blank.
      </p>

      {problem && (draft.slabs.length > 0 || dirty) && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{problem}</span>
        </div>
      )}

      {/* Tester */}
      <div className="mt-5 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          Try a quantity with the prices on screen
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            className={`${inputClass} max-w-[160px]`}
            inputMode="numeric"
            value={testQty}
            onChange={(e) => setTestQty(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="e.g. 15000"
          />
          <span className="text-sm text-gray-700">
            {!testQuote
              ? problem && testQty
                ? 'Fix the slabs first.'
                : '—'
              : testQuote.noSlab
                ? 'No slab covers this quantity.'
                : `${testQuote.slab!.nameEn} (${formatRange(testQuote.slab!)}) · ৳${testQuote.price.toLocaleString()} + VAT ৳${testQuote.vat.toLocaleString()} = ৳${testQuote.total.toLocaleString()}${
                    testQuote.underMin
                      ? ' · below the minimum total'
                      : testQuote.overMaxTotal
                        ? ' · above the maximum total'
                        : testQuote.overMaxQuantity
                          ? ' · above the maximum messages'
                          : ''
                  }`}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={addSlab}
          disabled={!canEdit}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#0D529E] border border-[#0D529E]/30 rounded-lg hover:bg-[#0D529E]/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add slab
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            disabled={!canEdit || !dirty || saving}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Discard changes
          </button>
          <button
            onClick={save}
            disabled={!canEdit || !dirty || !!problem || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0D529E] rounded-lg hover:bg-[#1F3C71] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save {service === 'vbs' ? 'Voice Broadcasting' : 'Bulk SMS'} pricing
          </button>
        </div>
      </div>
    </section>
  );
}

function LimitField({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-600 mb-1">{label}</span>
      <input
        className={inputClass}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
        disabled={disabled}
        placeholder={hint}
      />
      {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

function IconButton({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}
