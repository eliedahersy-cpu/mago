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

export interface RecipeDetail {
  slug: string;
  title: string;
  subtitle: string | null;
  hero_image: string | null;
  minutes: number;
  difficulty: string | null;
  servings: string | null;
  intro: string | null;
  ingredients: string[] | null;
  steps: { title: string; body: string }[] | null;
  tip: string | null;
  product_id: string | null;
  tags: string[];
}

export async function getPublishedRecipe(slug: string): Promise<RecipeDetail | null> {
  const { data, error } = await createPublicClient()
    .from('recipes')
    .select('slug, title, subtitle, hero_image, minutes, difficulty, servings, intro, ingredients, steps, tip, product_id, tags')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw new Error(`Failed to load recipe: ${error.message}`);
  return (data as RecipeDetail | null) ?? null;
}

export async function getPublishedRecipeSlugs(): Promise<string[]> {
  const { data, error } = await createPublicClient().from('recipes').select('slug').eq('status', 'published');
  if (error) throw new Error(`Failed to load recipes: ${error.message}`);
  return (data as { slug: string }[]).map((r) => r.slug);
}
