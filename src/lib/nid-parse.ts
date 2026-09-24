/**
 * Field extraction from Tesseract text, for the browser fallback.
 *
 * The on-prem EasyOCR service is the primary path (see nid-ocr-service/); this runs
 * only when that service is unreachable. It applies the same three rules the service's
 * parser does, because the old regex-over-flattened-text approach failed on real cards:
 *
 * - The NID number is only ever read from one line. The old code combined any 3-4 digit
 *   groups from anywhere on the card and tried 17 and 13 digits before 10, so on a smart
 *   card the birth year glued to part of the number beat the real number.
 * - The date of birth is the one beside the "Date of Birth" label. Smart cards print it
 *   twice (field and ghost watermark) and old cards carry other dates.
 * - The name stops at the first thing that is not a name: a digit, a month, a label.
 *
 * Pure: no DOM, no Tesseract import, so it can be unit-tested with plain Node.
 */

export interface ParsedNid {
  name: string | null;
  nidNumber: string | null;
  dateOfBirth: string | null;
  nidDigitType: '10' | '17' | null;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const HEADER_WORDS = new Set([
  'national', 'id', 'card', 'bangladesh', 'government', 'govt', 'republic', 'peoples',
  'people', "people's", 'identity', 'of', 'the', 'and', 'for', 'date', 'birth', 'dob',
  'nid', 'no', 'number', 'pin', 'blood', 'group', 'name', 'issue', 'issued', 'expiry',
  'signature', 'father', 'mother', 'spouse', 'husband', 'wife',
]);

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

/** Bangla numerals to ASCII, whitespace collapsed. */
function normalise(s: string): string {
  return s
    .replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Repair letter-for-digit confusions in a token that is mostly digits. */
function digitish(token: string): string {
  const core = token.replace(/^[\s.,:;]+|[\s.,:;]+$/g, '');
  if (!core) return token;
  const digits = (core.match(/\d/g) || []).length;
  if (digits / core.length < 0.6) return token;
  return core.replace(/[OoQD]/g, '0').replace(/[Il|!]/g, '1').replace(/[Zz]/g, '2')
    .replace(/[Ss]/g, '5').replace(/B/g, '8').replace(/G/g, '6');
}

function monthOf(word: string): number | null {
  const w = word.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'l').replace(/[^a-z]/g, '');
  if (w.length < 3) return null;
  return MONTHS[w.slice(0, 3)] ?? null;
}

function validDate(y: number, m: number, d: number): string | null {
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  const thisYear = new Date().getUTCFullYear();
  if (y < 1900 || y > thisYear || date.getTime() > Date.now()) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Every valid date in one line, ISO formatted. */
function datesIn(line: string): string[] {
  const t = line.split(' ').map((tok) => (/\d/.test(tok) ? digitish(tok) : tok)).join(' ');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const dMonY = /(\d{1,2})\s*[-/. ]?\s*([A-Za-z]{3,9})\.?,?\s*[-/. ]?\s*(\d{4})/g;
  while ((m = dMonY.exec(t))) {
    const mon = monthOf(m[2]);
    const v = mon && validDate(+m[3], mon, +m[1]);
    if (v) out.push(v);
  }
  const monDY = /([A-Za-z]{3,9})\.?\s*(\d{1,2}),?\s*(\d{4})/g;
  while ((m = monDY.exec(t))) {
    const mon = monthOf(m[1]);
    const v = mon && validDate(+m[3], mon, +m[2]);
    if (v) out.push(v);
  }
  const dmy = /(?<!\d)(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?!\d)/g;
  while ((m = dmy.exec(t))) {
    const v = validDate(+m[3], +m[2], +m[1]);
    if (v) out.push(v);
  }
  const ymd = /(?<!\d)(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?!\d)/g;
  while ((m = ymd.exec(t))) {
    const v = validDate(+m[1], +m[2], +m[3]);
    if (v) out.push(v);
  }
  return out;
}

type LabelKind = 'name' | 'dob' | 'nid';

/** Which label a line starts with, and the text after it. */
function labelled(line: string): { kind: LabelKind; value: string } | null {
  const dob = /^\s*(?:date\s*of\s*b[il]rth|d\.?o\.?b\.?|birth)\s*[:.\-]?\s*/i.exec(line);
  if (dob) return { kind: 'dob', value: line.slice(dob[0].length) };
  const nid = /^\s*(?:national\s+)?(?:n[il]d|[il]d)\s*(?:n[o0]\.?|number)?\s*[:.\-]?\s*/i.exec(line);
  if (nid && /\d/.test(line)) return { kind: 'nid', value: line.slice(nid[0].length) };
  const name = /^\s*(?:\\?)?n[a-z]me\s*[:.\-]?\s*/i.exec(line);
  if (name) return { kind: 'name', value: line.slice(name[0].length) };
  return null;
}

/** NID candidates in one line: digits joined only within the line. */
function nidCandidatesIn(line: string, anchored: boolean): { digits: string; score: number }[] {
  const fixed = line.split(' ').map(digitish).join(' ');
  const out: { digits: string; score: number }[] = [];
  const run = /(?<!\d)(\d(?:[\d ]{7,22})\d)(?!\d)/g;
  let m: RegExpExecArray | null;
  const thisYear = new Date().getUTCFullYear();
  while ((m = run.exec(fixed))) {
    const raw = m[1].trim();
    const digits = raw.replace(/\D/g, '');
    if (![10, 13, 17].includes(digits.length)) continue;
    let score = anchored ? 4 : 0;
    if (digits.length === 10 && /^\d{3} ?\d{3} ?\d{4}$/.test(raw)) score += 2;
    if (digits.length !== 10 && !raw.includes(' ')) score += 1;
    if (digits.length === 17) {
      const year = +digits.slice(0, 4);
      if (year < 1900 || year > thisYear) continue;
    }
    score += { 10: 0.3, 17: 0.2, 13: 0.1 }[digits.length as 10 | 13 | 17];
    out.push({ digits, score });
  }
  return out;
}

function nameWords(value: string): string[] {
  const words: string[] = [];
  for (const raw of value.split(' ')) {
    const tok = raw.replace(/^[\s,;:]+|[\s,;:]+$/g, '');
    if (!tok) continue;
    if (/[ঀ-৿]/.test(tok) || /\d/.test(tok) || monthOf(tok)) break;
    const core = tok.replace(/\./g, '').toLowerCase();
    if (HEADER_WORDS.has(core)) break;
    if (!/^[A-Za-z][A-Za-z.'\-]*$/.test(tok) || core.length < 2) continue;
    words.push(tok.toUpperCase());
  }
  return words;
}

export function parseNidText(text: string): ParsedNid {
  const lines = text.split(/\r?\n/).map(normalise).filter(Boolean);

  // ---- date of birth: beside its label first, anywhere second ----
  let dateOfBirth: string | null = null;
  const dobScores = new Map<string, number>();
  lines.forEach((line, i) => {
    const lab = labelled(line);
    const regions: [string, number][] = [];
    if (lab?.kind === 'dob') {
      if (lab.value.trim()) regions.push([lab.value, 4]);
      else if (lines[i + 1]) regions.push([lines[i + 1], 3]);
    }
    regions.push([line, 0]);
    for (const [region, bonus] of regions) {
      for (const v of datesIn(region)) {
        const cur = dobScores.get(v);
        dobScores.set(v, cur === undefined ? bonus : Math.max(cur, bonus) + 0.5);
      }
    }
  });
  if (dobScores.size) {
    dateOfBirth = [...dobScores.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  // ---- NID number: never assembled across lines ----
  const cands: { digits: string; score: number }[] = [];
  lines.forEach((line, i) => {
    const lab = labelled(line);
    if (lab?.kind === 'nid') {
      if (lab.value.trim()) cands.push(...nidCandidatesIn(lab.value, true));
      else if (lines[i + 1]) cands.push(...nidCandidatesIn(lines[i + 1], true));
    } else {
      cands.push(...nidCandidatesIn(line, false));
    }
  });
  if (dateOfBirth) {
    const year = dateOfBirth.slice(0, 4);
    const ddmmyyyy = dateOfBirth.slice(8, 10) + dateOfBirth.slice(5, 7) + year;
    for (const c of cands) {
      if (c.digits.endsWith(ddmmyyyy)) c.score -= 5;
      if (c.digits.length === 10 && c.digits.startsWith(year) && c.score < 4) c.score -= 3;
      if (c.digits.length === 17) c.score += c.digits.startsWith(year) ? 2 : -2;
    }
  }
  let nidNumber: string | null = null;
  if (cands.length) {
    const best = cands.reduce((a, b) => (b.score > a.score ? b : a));
    if (best.score >= 0) nidNumber = best.digits;
  }
  // A 13-digit old-card number becomes the 17-digit form the EC API takes: birth year + 13.
  if (nidNumber && nidNumber.length === 13) {
    nidNumber = dateOfBirth ? dateOfBirth.slice(0, 4) + nidNumber : null;
  }
  const nidDigitType: '10' | '17' | null =
    nidNumber === null ? null : nidNumber.length === 10 ? '10' : '17';

  // ---- name: after its label, cut at the next label ----
  let name: string | null = null;
  for (let i = 0; i < lines.length && !name; i++) {
    const lab = labelled(lines[i]);
    if (lab?.kind !== 'name') continue;
    const words = lab.value.trim() ? nameWords(lab.value) : lines[i + 1] ? nameWords(lines[i + 1]) : [];
    if (words.length) name = words.join(' ');
  }
  if (!name) {
    // No label read: the line with the most name-like words, and not a header.
    let bestN = 0;
    for (const line of lines) {
      if (/[ঀ-৿\d]/.test(line)) continue;
      const lowered = new Set(line.split(' ').map((w) => w.toLowerCase().replace(/[^a-z]/g, '')));
      if (['republic', 'card', 'government', 'bangladesh', 'national'].some((w) => lowered.has(w))) continue;
      const words = nameWords(line);
      if (words.length >= 2 && words.length > bestN && line === line.toUpperCase()) {
        name = words.join(' ');
        bestN = words.length;
      }
    }
  }

  return { name, nidNumber, dateOfBirth, nidDigitType };
}
