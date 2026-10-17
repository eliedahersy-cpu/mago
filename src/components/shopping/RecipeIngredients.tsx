'use client';

import { Check, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useHydratedShoppingList, useShoppingList } from '@/lib/shopping/store';

/** Ingredients with "I have it" ticks, and a button that puts what is missing on the shopping list. */
export function RecipeIngredients({ slug, title, ingredients }: { slug: string; title: string; ingredients: string[] }) {
  useHydratedShoppingList();
  const saved = useShoppingList((s) => s.recipes.find((r) => r.slug === slug));
  const save = useShoppingList((s) => s.save);
  const remove = useShoppingList((s) => s.remove);
  const toggleSaved = useShoppingList((s) => s.toggleHave);
  const [draft, setDraft] = useState<number[]>([]);
  // Once on the list, the saved ticks are the truth; before that they are a draft on this page.
  const have = saved ? saved.have : draft;

  const missing = ingredients.length - have.length;
  const toggle = (i: number) => {
    if (saved) toggleSaved(slug, i);
    else setDraft((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  };

  return (
    <section className="rounded-[1.7rem] bg-[#f5e4cb] p-6 md:p-8">
      <h2 className="font-display text-2xl font-bold text-forest uppercase">Ingredients</h2>
      <p className="mt-1 text-sm text-ink/75">Tick what you already have at home.</p>
      <ul className="mt-4 space-y-1">
        {ingredients.map((item, i) => {
          const owned = have.includes(i);
          return (
            <li key={i}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink/85">
                <input type="checkbox" checked={owned} onChange={() => toggle(i)} className="peer sr-only" />
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md border-2 border-forest/40 bg-cream-light text-white peer-checked:border-forest peer-checked:bg-forest peer-focus-visible:ring-2 peer-focus-visible:ring-forest peer-focus-visible:ring-offset-2">
                  {owned ? <Check size={16} aria-hidden /> : null}
                </span>
                <span className={owned ? 'text-ink/60 line-through' : ''}>{item}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 space-y-2">
        <button
          type="button"
          onClick={() => save({ slug, title, ingredients, have })}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-forest px-5 py-2 font-display text-sm font-bold text-white uppercase"
        >
          <ListChecks size={18} aria-hidden />
          {saved ? 'Update my shopping list' : `Add to shopping list (${missing} to buy)`}
        </button>
        {saved ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
            <span role="status" className="text-forest">On your shopping list</span>
            <span className="flex gap-4">
              <Link href="/shopping-list" className="text-forest underline underline-offset-2">View list</Link>
              <button type="button" onClick={() => remove(slug)} className="text-[#9c3418] underline underline-offset-2">Remove</button>
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
