/**
 * Make free text safe to embed in a PostgREST `or(...ilike...)` filter:
 * keeps letters (any script), digits, spaces, ampersands, apostrophes and hyphens.
 */
export function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N}\s&'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
    .trim();
}
