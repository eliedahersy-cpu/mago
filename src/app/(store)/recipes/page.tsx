import type { Metadata } from 'next';
import { RecipesExplorer } from '@/components/recipe/RecipesExplorer';
import { getRecipeCards } from '@/lib/data/cached';

export const metadata: Metadata = {
  title: 'Recipes & Inspiration',
  description: 'Quick, creative recipes for your MAGO pasta cups. Simple ideas, big flavours.',
};

export default async function RecipesPage() {
  const recipes = await getRecipeCards(80);
  return <RecipesExplorer recipes={recipes}/>;
}
