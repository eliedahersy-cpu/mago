export function getSupabaseEnv(): { url: string; publishableKey: string } {
  // Literal property access so Next.js inlines these public values into client bundles.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url) throw new Error('Missing env var NEXT_PUBLIC_SUPABASE_URL (see .env.example)');
  if (!publishableKey) throw new Error('Missing env var NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example)');
  return { url, publishableKey };
}
