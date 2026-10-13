/** A same-site path to return to after signing in; anything else (other sites, schemes) falls back. */
export function safeNextPath(raw: string | null | undefined, fallback = '/account'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  return raw;
}
