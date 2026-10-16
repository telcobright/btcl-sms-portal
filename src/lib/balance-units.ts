/**
 * How a package balance is shown: in words a customer and an operator use, never the
 * ledger's unit code. TF_min is the free talktime minutes account, so it reads
 * "Talktime 251.38 min", not "251.381 TF_min"; a plan's extension, IVR and call channel
 * accounts read "Extension 1", "IVR 1" and "Call Channel 1". The IP PBX portal labels
 * talktime the same way.
 */
const UNITS: Record<string, { label: string; unit: string }> = {
  TF_min: { label: 'Talktime', unit: 'min' },
  OTH_pp: { label: 'Extension', unit: '' },
  OTH_pk: { label: 'IVR', unit: '' },
  OTH_cd: { label: 'Call Channel', unit: '' },
  // Voice Broadcast: messages of up to one minute each.
  OTH_box: { label: '1 Minute Voice', unit: '' },
  // Bulk SMS: messages left to send.
  OTH_ea: { label: 'SMS', unit: '' },
};

/** The order a plan's balances are listed in: talktime first, then what the plan includes. */
const ORDER = ['TF_min', 'OTH_pp', 'OTH_pk', 'OTH_cd', 'OTH_box', 'OTH_ea'];

export function formatBalance(amount: number, uom?: string | null): string {
  const value = amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const known = uom ? UNITS[uom.trim()] : undefined;
  if (known) return `${known.label} ${value} ${known.unit}`.trim();
  return `${value} ${uom ?? ''}`.trim();
}

/**
 * Balances held in different units, each shown on its own: a plan's talktime is never added
 * to its extension or channel counts. Zero balances are left out. "—" when there are none.
 */
export function formatBalances(balances: Record<string, number | string | null | undefined>): string {
  const entries = Object.entries(balances)
    .map(([uom, v]) => [uom, Number(v) || 0] as const)
    .filter(([, v]) => v !== 0)
    .sort(([a], [b]) => {
      const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
      return (ia < 0 ? ORDER.length : ia) - (ib < 0 ? ORDER.length : ib);
    });
  return entries.length ? entries.map(([uom, v]) => formatBalance(v, uom)).join(' · ') : '—';
}
