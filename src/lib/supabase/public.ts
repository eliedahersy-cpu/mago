import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

/** Cookie-less anonymous client for public catalog reads that can be cached and prerendered. */
export function createPublicClient(): SupabaseClient {
  const { url, publishableKey } = getSupabaseEnv();
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
