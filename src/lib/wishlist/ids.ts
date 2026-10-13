/** Owner of a wishlist kept in the browser before anyone signs in. */
export const GUEST = 'guest';

/** Most products a wishlist keeps (more than the whole catalogue). */
export const MAX_WISHLIST = 200;

export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

export function mergeIds(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])].slice(0, MAX_WISHLIST);
}

/** Whatever was saved in the browser, reduced to unique non-empty ids. */
export function sanitizeIds(persisted: unknown): string[] {
  const raw = persisted && typeof persisted === 'object' ? (persisted as { ids?: unknown }).ids : null;
  if (!Array.isArray(raw)) return [];
  return mergeIds(raw.filter((x): x is string => typeof x === 'string' && x !== ''), []);
}

/**
 * On signing in, which of the browser's saved products to add to the account: a guest's list,
 * once. A list that already came from an account is replaced by the server's, never uploaded,
 * so an item removed elsewhere does not come back.
 */
export function idsToUpload(owner: string, userId: string, ids: string[]): string[] {
  void userId;
  return owner === GUEST ? ids : [];
}

export function sanitizeOwner(persisted: unknown): string {
  const raw = persisted && typeof persisted === 'object' ? (persisted as { owner?: unknown }).owner : null;
  return typeof raw === 'string' && raw !== '' ? raw : GUEST;
}
