/**
 * Which documents each customer category must supply.
 *
 * Mirrors PartnerRegistrationService.DEFAULT_REQUIRED_DOCS on the server, which is what
 * actually gates purchasing: a partner may buy once every document listed here for their
 * category is approved, and optional documents never block anything. Kept in one place on
 * the portal so the admin's partner page, the customer's dashboard and the registration
 * form all describe the same rule.
 */
export type CustomerCategory =
  | 'INDIVIDUAL'
  | 'CORPORATE'
  | 'GOVERNMENT_INDIVIDUAL'
  | 'GOVERNMENT_CORPORATE';

const IDENTITY = ['nidfront', 'nidback'];
const BUSINESS = ['tradelicense', 'tin'];

export const REQUIRED_DOCUMENTS: Record<CustomerCategory, string[]> = {
  // A person, not a business: identity and a photograph.
  INDIVIDUAL: [...IDENTITY, 'photo'],
  // A person acting for an office: identity, photograph, and proof of that office.
  GOVERNMENT_INDIVIDUAL: [...IDENTITY, 'photo', 'govtauthorization'],
  CORPORATE: [...IDENTITY, ...BUSINESS, 'bin'],
  GOVERNMENT_CORPORATE: [...IDENTITY, ...BUSINESS, 'govtauthorization'],
};

/**
 * A partner with no category predates the column and was registered as a business, which
 * is also the server's fallback.
 */
export function requiredDocumentsFor(category: string | null | undefined): string[] {
  return REQUIRED_DOCUMENTS[normalise(category)] ?? REQUIRED_DOCUMENTS.CORPORATE;
}

// Older partners carry a bare GOVERNMENT, which the server reads as a government office.
function normalise(category: string | null | undefined): CustomerCategory {
  const key = (category ?? '').trim().toUpperCase();
  return (key === 'GOVERNMENT' ? 'GOVERNMENT_CORPORATE' : key) as CustomerCategory;
}

export const DOCUMENT_LABELS: Record<string, string> = {
  nidfront: 'NID Front',
  nidback: 'NID Back',
  photo: 'Photograph',
  govtauthorization: 'Office ID / Certifying Letter',
  tradelicense: 'Trade License',
  tin: 'TIN Certificate',
  bin: 'BIN Certificate',
  btrc: 'BTRC Aggregator Licence',
  taxreturn: 'Tax Return',
  vat: 'VAT Document',
  sla: 'SLA Document',
};

export const CATEGORY_LABELS: Record<CustomerCategory, string> = {
  INDIVIDUAL: 'Individual',
  CORPORATE: 'Corporate',
  GOVERNMENT_INDIVIDUAL: 'Government Individual',
  GOVERNMENT_CORPORATE: 'Government Corporate',
};

export function categoryLabel(category: string | null | undefined): string {
  return CATEGORY_LABELS[normalise(category)] ?? 'Corporate (default)';
}
