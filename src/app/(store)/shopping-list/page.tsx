import type { Metadata } from 'next';
import { ShoppingList } from '@/components/shopping/ShoppingList';

export const instant = false;

export const metadata: Metadata = {
  title: 'My shopping list',
  description: 'Everything you need for your chosen MAGO recipes, in one list.',
  robots: { index: false },
};

export default function ShoppingListPage() {
  return (
    <div className="bg-[#fff6e9]">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <p className="text-sm font-bold tracking-widest text-[#9c3418] uppercase">Recipes & inspiration</p>
        <h1 className="mt-2 font-display text-4xl leading-tight font-bold text-forest uppercase md:text-5xl">My shopping list</h1>
        <p className="mt-3 max-w-xl text-ink/80">
          Everything you still need for the recipes you chose, added up in one place. Share it, print it, or take it to the shop.
        </p>
        <div className="mt-8">
          <ShoppingList />
        </div>
      </div>
    </div>
  );
}
