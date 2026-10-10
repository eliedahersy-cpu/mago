import { createPublicClient } from '@/lib/supabase/public';
import type { RecipeSummary, StoreSettings } from '@/lib/types';
import { toRecipeSummary, toSettings } from './mappers';
import type { RecipeSummaryRow, SettingsRow } from './rows';

export const RECIPE_SUMMARY_SELECT = 'slug, title, subtitle, hero_image, minutes, tags, products(name, flavour)';

export async function getSettings(): Promise<StoreSettings> {
  const { data, error } = await createPublicClient().from('settings').select('*').maybeSingle<SettingsRow>();
  if (error) throw new Error(`Failed to load store settings: ${error.message}`);
  if (!data) throw new Error('Store settings row is missing — apply supabase/seed/0001_catalog.sql');
  return toSettings(data);
}

export async function getRecipeCards(limit = 8): Promise<RecipeSummary[]> {
  const { data, error } = await createPublicClient()
    .from('recipes')
    .select(RECIPE_SUMMARY_SELECT)
    .eq('status', 'published')
    .order('sort_order')
    .limit(limit);
  if (error) throw new Error(`Failed to load recipes: ${error.message}`);
  return (data as unknown as RecipeSummaryRow[]).map(toRecipeSummary);
}
