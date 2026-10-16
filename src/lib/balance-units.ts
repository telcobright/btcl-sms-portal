/**
 * How a package balance is shown: in words a customer and an operator use, never the
 * ledger's unit code. TF_min is the free talktime minutes account, so it reads
 * "Talktime 251.38 min", not "251.381 TF_min". The IP PBX portal labels it the same way.
 */
const UNITS: Record<string, { label: string; unit: string }> = {
  TF_min: { label: 'Talktime', unit: 'min' },
};

export function formatBalance(amount: number, uom?: string | null): string {
  const value = amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const known = uom ? UNITS[uom.trim()] : undefined;
  if (known) return `${known.label} ${value} ${known.unit}`;
  return `${value} ${uom ?? ''}`.trim();
}
