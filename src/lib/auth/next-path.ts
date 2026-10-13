const BASE = 'http://same-site.invalid';

/** URL parsers silently drop tabs and newlines and treat \ like /, so "/\t/evil.com" means "//evil.com". */
function hasControlOrBackslash(value: string): boolean {
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code === 127 || ch === '\\') return true;
  }
  return false;
}

/** A same-site path to return to after signing in; anything that could leave the site falls back. */
export function safeNextPath(raw: string | null | undefined, fallback = '/account'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || hasControlOrBackslash(raw)) return fallback;
  try {
    const url = new URL(raw, BASE);
    if (url.origin !== BASE) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
