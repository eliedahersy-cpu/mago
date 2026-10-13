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
