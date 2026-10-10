import { createPublicClient } from '@/lib/supabase/public';
import type { StoreSettings } from '@/lib/types';
import { toSettings } from './mappers';
import type { SettingsRow } from './rows';

export async function getSettings(): Promise<StoreSettings> {
  const { data, error } = await createPublicClient().from('settings').select('*').maybeSingle<SettingsRow>();
  if (error) throw new Error(`Failed to load store settings: ${error.message}`);
  if (!data) throw new Error('Store settings row is missing — apply supabase/seed/0001_catalog.sql');
  return toSettings(data);
}
