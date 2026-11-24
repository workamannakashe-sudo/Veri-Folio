import { canonicalize } from 'json-canonicalize';

/**
 * Serializes any JavaScript value to a deterministic JSON string per RFC 8785 (JSON Canonicalization Scheme).
 * Guarantees consistent UTF-8 byte representation across platforms and key ordering.
 */
export function canonicalizeJson(value: unknown): string {
  const result = canonicalize(value);
  if (typeof result !== 'string') {
    throw new Error('Canonicalization failed to produce a valid string.');
  }
  return result;
}
