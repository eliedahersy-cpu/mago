'use client';

import { Check, Copy, Printer, Share2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { buildList, listAsText } from '@/lib/shopping/list';
import { useHydratedShoppingList, useShoppingList } from '@/lib/shopping/store';

const action =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-forest px-5 py-2 font-display text-sm font-bold text-forest uppercase print:hidden';

/** The customer's shopping list: what to buy for the chosen recipes. There is no checkout; it is saved on this device. */
export function ShoppingList() {
  const hydrated = useHydratedShoppingList();
  const recipes = useShoppingList((s) => s.recipes);
  const toggleHave = useShoppingList((s) => s.toggleHave);
  const remove = useShoppingList((s) => s.remove);
  const clear = useShoppingList((s) => s.clear);
  const [note, setNote] = useState('');
  const [bought, setBought] = useState<string[]>([]);

  const items = useMemo(() => buildList(recipes), [recipes]);
  const cups = items.filter((i) => i.isCup);
  const rest = items.filter((i) => !i.isCup);

  if (!hydrated) return <p className="py-16 text-center text-ink/70">Loading your list…</p>;

  if (recipes.length === 0) {
    return (
      <div className="rounded-[1.7rem] bg-[#f5e4cb] p-8 text-center">
        <p className="font-display text-xl font-bold text-forest uppercase">Your list is empty</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink/75">
          Open a recipe, tick what you already have, and add it. Everything you still need ends up here, in one place.
        </p>
        <Link href="/recipes" className={`${action} mt-5`}>Browse recipes</Link>
      </div>
    );
  }

  const text = listAsText(items);
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'MAGO shopping list', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setNote('List copied. Paste it into a message or note.');
    } catch {
      setNote('Could not share. Use Copy instead.');
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setNote('List copied.');
    } catch {
      setNote('Could not copy on this browser.');
    }
  }
  const toggleBought = (key: string) => setBought((b) => (b.includes(key) ? b.filter((k) => k !== key) : [...b, key]));

  const group = (title: string, list: typeof items) =>
    list.length === 0 ? null : (
      <section className="rounded-[1.7rem] bg-[#f5e4cb] p-5 md:p-7">
        <h2 className="font-display text-xl font-bold text-forest uppercase">{title}</h2>
        <ul className="mt-3 divide-y divide-forest/10">
          {list.map((item) => {
            const done = bought.includes(item.key);
            return (
              <li key={item.key}>
                <label className="flex min-h-12 cursor-pointer items-center gap-3 py-2">
                  <input type="checkbox" checked={done} onChange={() => toggleBought(item.key)} className="peer sr-only" />
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md border-2 border-forest/40 bg-cream-light text-white peer-checked:border-forest peer-checked:bg-forest peer-focus-visible:ring-2 peer-focus-visible:ring-forest peer-focus-visible:ring-offset-2">
                    {done ? <Check size={16} aria-hidden /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold text-ink ${done ? 'line-through opacity-60' : ''}`}>{item.label}</span>
                    <span className="block text-xs text-ink/70">for {item.recipes.join(', ')}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_.7fr]">
      <div className="space-y-5">
        {items.length === 0 ? (
          <p className="rounded-[1.7rem] bg-[#f5e4cb] p-6 text-sm text-ink/80">
            You already have everything for these recipes. Nothing to buy.
          </p>
        ) : null}
        {group('MAGO cups', cups)}
        {group('From the shop', rest)}

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={share} className={action}><Share2 size={17} aria-hidden /> Share</button>
          <button type="button" onClick={copy} className={action}><Copy size={17} aria-hidden /> Copy</button>
          <button type="button" onClick={() => window.print()} className={action}><Printer size={17} aria-hidden /> Print</button>
        </div>
        <p role="status" className="min-h-5 text-sm font-semibold text-forest print:hidden">{note}</p>
        <p className="text-xs text-ink/70 print:hidden">Saved on this device. There is nothing to pay here.</p>
      </div>

      <aside className="print:hidden">
        <h2 className="font-display text-xl font-bold text-forest uppercase">Your recipes</h2>
        <ul className="mt-3 space-y-3">
          {recipes.map((r) => (
            <li key={r.slug} className="rounded-2xl bg-cream-light p-4 ring-1 ring-forest/10">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/recipes/${r.slug}`} className="font-display text-sm font-bold text-forest">{r.title}</Link>
                <button type="button" onClick={() => remove(r.slug)} aria-label={`Remove ${r.title}`} className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#9c3418] hover:bg-forest/10">
                  <Trash2 size={17} aria-hidden />
                </button>
              </div>
              <ul className="mt-2 space-y-0.5">
                {r.ingredients.map((ing, i) => (
                  <li key={i}>
                    <label className="flex min-h-9 cursor-pointer items-center gap-2 text-xs text-ink/80">
                      <input type="checkbox" checked={r.have.includes(i)} onChange={() => toggleHave(r.slug, i)} className="size-4 accent-[#023025]" />
                      <span className={r.have.includes(i) ? 'line-through opacity-60' : ''}>{ing}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-[11px] text-ink/65">Ticked = you have it.</p>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => { clear(); setBought([]); setNote(''); }} className="mt-4 text-sm font-semibold text-[#9c3418] underline underline-offset-2">
          Clear the whole list
        </button>
      </aside>
    </div>
  );
}
