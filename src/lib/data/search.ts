import { sanitizeSearchTerm } from '@/lib/catalog/search-term';
import { matchesSearch } from '@/lib/catalog/shop-query';
import { createPublicClient } from '@/lib/supabase/public';
import type { Product, RecipeSummary } from '@/lib/types';
import { getActiveProducts } from './catalog';
import { RECIPE_SUMMARY_SELECT } from './content';
import { toRecipeSummary } from './mappers';
import type { RecipeSummaryRow } from './rows';

const SEARCHABLE_TYPES = new Set(['cup', 'retail', 'extra', 'merch']);

export async function searchCatalog(raw: string): Promise<{ term: string; products: Product[]; recipes: RecipeSummary[] }> {
  const term = sanitizeSearchTerm(raw);
  if (!term) return { term, products: [], recipes: [] };

  const pattern = `%${term}%`;
  const [products, recipes] = await Promise.all([
    getActiveProducts(),
    createPublicClient()
      .from('recipes')
      .select(RECIPE_SUMMARY_SELECT)
      .eq('status', 'published')
      .or(`title.ilike.${pattern},intro.ilike.${pattern},subtitle.ilike.${pattern}`)
      .order('sort_order')
      .limit(12),
  ]);
  if (recipes.error) throw new Error(`Failed to search recipes: ${recipes.error.message}`);

  return {
    term,
    products: products.filter((p) => SEARCHABLE_TYPES.has(p.type) && matchesSearch(p, term)),
    recipes: (recipes.data as unknown as RecipeSummaryRow[]).map(toRecipeSummary),
  };
}
