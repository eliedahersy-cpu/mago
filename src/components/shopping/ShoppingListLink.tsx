'use client';

import { ListChecks } from 'lucide-react';
import Link from 'next/link';
import { useHydratedShoppingList, useShoppingList } from '@/lib/shopping/store';

/** Header shortcut to the shopping list, with the number of recipes on it. */
export function ShoppingListLink({ className }: { className?: string }) {
  const hydrated = useHydratedShoppingList();
  const count = useShoppingList((s) => s.recipes.length);
  const shown = hydrated ? count : 0;
  return (
    <Link href="/shopping-list" aria-label={shown ? `Shopping list, ${shown} recipes` : 'Shopping list'} className={className}>
      <span className="relative">
        <ListChecks size={21} aria-hidden />
        {shown ? (
          <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-terracotta text-[10px] font-bold text-white">{shown}</span>
        ) : null}
      </span>
    </Link>
  );
}
