import type React from 'react';
import toast from 'react-hot-toast';

/**
 * Upload limits for registration documents.
 *
 * The registration form has always advertised a 5 MB limit in its helper text but never
 * enforced it, so a customer could attach several multi-megabyte phone photos. The whole
 * set is sent in one multipart request; on a slow mobile connection that request runs out
 * of time mid-upload, and the browser reports a failure with no server response at all —
 * which surfaced as a generic "registration failed" message that told the customer nothing.
 *
 * Enforcing the advertised limit at selection time turns that late, unexplained failure
 * into an immediate, specific one naming the offending document.
 */
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_LABEL = '5 MB';

/** Human-readable size, used in the error so the customer knows how far over they are. */
export const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} bytes`;
};

export const isOversized = (file: File): boolean => file.size > MAX_DOCUMENT_BYTES;

export const oversizeMessage = (documentName: string, file: File): string =>
  `${documentName} is ${formatFileSize(file.size)} — the maximum is ${MAX_DOCUMENT_LABEL}. ` +
  `Please upload a smaller file (re-take the photo at a lower resolution, or crop the screenshot).`;

/**
 * Read the selected file off a file input, rejecting anything over the limit.
 *
 * Clears the input when rejecting: without that, re-selecting the same filename after
 * shrinking it fires no change event and the customer appears stuck.
 */
export const pickDocument = (
  event: React.ChangeEvent<HTMLInputElement>,
  documentName: string
): File | null => {
  const file = event.target.files?.[0] || null;
  if (file && isOversized(file)) {
    toast.error(oversizeMessage(documentName, file), { duration: 6000 });
    event.target.value = '';
    return null;
  }
  return file;
};

/**
 * Last line of defence before submitting: catches anything that bypassed selection-time
 * validation (a file restored from state, or an input wired without `pickDocument`).
 * Returns the message to show, or null when every document is within the limit.
 */
export const findOversizedDocument = (
  documents: Record<string, File | null | undefined>
): string | null => {
  for (const [documentName, file] of Object.entries(documents)) {
    if (file && isOversized(file)) return oversizeMessage(documentName, file);
  }
  return null;
};
