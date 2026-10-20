'use client';

import { ArrowRight, Clock3, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { SideArt } from '@/components/layout/SideArt';
import { ArchDecor, LeafSprig, ScriptNote } from '@/components/brand/Decor';
import { cn } from '@/lib/cn';
import type { RecipeSummary } from '@/lib/types';

const categories = [
  { title: 'All recipes', tag: '' },
  { title: 'Quick Meals', tag: 'quick-meals' },
  { title: 'Extra Protein', tag: 'extra-protein' },
  { title: 'Mediterranean Twists', tag: 'mediterranean-twists' },
  { title: 'Comfort Food', tag: 'comfort-food' },
  { title: 'Soups', tag: 'soups' },
  { title: 'Vegetarian', tag: 'vegetarian' },
];

const tagLabel: Record<string, string> = {
  'quick-meals': 'Quick Meal',
  'extra-protein': 'Extra Protein',
  'mediterranean-twists': 'Mediterranean Twist',
  'comfort-food': 'Comfort Food',
  soups: 'Soup',
  vegetarian: 'Vegetarian',
};

function SearchBox({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={cn('flex items-center gap-2 rounded-full bg-cream-light px-5 py-3 shadow-sm ring-1 ring-forest/15', className)}>
      <input
        aria-label="Search recipes"
        type="search"
        placeholder="Search recipes (e.g. creamy, spicy, quick…)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent text-sm text-forest outline-none placeholder:text-forest/45"
      />
      <Search size={18} className="shrink-0 text-forest" aria-hidden />
    </label>
  );
}

export function RecipesExplorer({ recipes }: { recipes: RecipeSummary[] }) {
  const [active, setActive] = useState('');
  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () =>
      recipes.filter((r) => {
        const matchTag = !active || r.tags.includes(active);
        const text = [r.title, r.subtitle, r.productName, ...r.tags].filter(Boolean).join(' ').toLowerCase();
        return matchTag && text.includes(search.trim().toLowerCase());
      }),
    [recipes, active, search],
  );
  const showcase = recipes.slice(0, 4);

  return (
    <div className="relative isolate overflow-hidden bg-cream-light">
      <SideArt name="recipes" />
      <section className="relative isolate overflow-hidden bg-[#fbeed8] bg-[url('/images/banner-pattern.webp')] bg-cover bg-center">
        <div className="mx-auto flex min-h-[340px] max-w-[720px] flex-col items-center justify-center px-6 py-12 text-center md:min-h-[440px]">
          <h1 className="font-display text-[3.4rem] leading-[0.9] font-bold text-forest uppercase md:text-7xl lg:text-8xl">Recipes</h1>
          <p className="mt-2 font-display text-xl font-bold text-forest md:text-3xl">Simple ideas. Big flavours.</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink/80 md:text-base">
            Get creative with your MAGO cups. From quick meals to elevated dishes, discover recipes for every mood.
          </p>
          <SearchBox value={search} onChange={setSearch} className="mx-auto mt-6 w-full max-w-md" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-10 md:py-12">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0" role="group" aria-label="Recipe categories">
          {categories.map((c) => (
            <button
              type="button"
              key={c.title}
              onClick={() => setActive(c.tag)}
              aria-pressed={active === c.tag}
              className={cn(
                'shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-colors',
                active === c.tag ? 'bg-forest text-cream-light' : 'bg-cream-dark/60 text-forest hover:bg-cream-dark',
              )}
            >
              {c.title}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink/70" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'recipe' : 'recipes'} to explore
        </p>

        {filtered.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {filtered.map((recipe) => {
              const image = recipe.heroImage ?? '/images/lifestyle-movie-night.webp';
              const packshot = image.startsWith('/products/');
              const tag = recipe.tags.find((t) => t !== 'vegetarian') ?? recipe.tags[0];
              return (
                <Link
                  href={`/recipes/${recipe.slug}`}
                  key={recipe.slug}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl bg-[#fffbf2] p-2.5 shadow-[0_5px_24px_rgba(2,48,37,0.08)] ring-1 ring-forest/5 transition-shadow hover:shadow-lg"
                >
                  <div className={cn('relative aspect-[16/10] overflow-hidden rounded-xl', packshot && 'bg-[#f3e4cf]')}>
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 95vw"
                      className={cn(
                        'transition-transform duration-300 group-hover:scale-[1.04]',
                        packshot ? 'object-contain p-3 mix-blend-multiply' : 'object-cover',
                      )}
                    />
                    <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-cream-light/95 px-2.5 py-1 text-xs font-semibold text-forest shadow-sm">
                      <Clock3 size={13} aria-hidden /> {recipe.minutes} min
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1.5">
                    <h3 className="font-display text-xl leading-tight font-bold text-forest">{recipe.title}</h3>
                    {recipe.productName ? <p className="mt-1 text-sm text-ink/65">{recipe.productName}</p> : null}
                    {tag && tagLabel[tag] ? (
                      <span className="mt-3 w-fit rounded-full bg-cream-dark/70 px-3 py-1 text-xs font-semibold text-forest">{tagLabel[tag]}</span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="py-16 text-center text-ink/65">No recipes found. Try a different category or search.</p>
        )}
      </section>

      <section className="px-4 pb-6 md:px-10 md:pb-8" aria-label="Same pasta. More possibilities.">
        {/* From 768px: the approved artwork with a real link over its drawn button. Phones keep the text version. */}
        <div className="relative mx-auto hidden max-w-7xl overflow-hidden rounded-3xl md:block">
          <Image
            src="/images/recipes-banner.webp"
            alt="Same pasta. More possibilities. Turn your favourite MAGO cup into something new. Quick, delicious and full of flavour. From cup to chef."
            width={1600}
            height={499}
            sizes="(min-width: 1280px) 1280px, 95vw"
            className="block h-auto w-full"
          />
          <Link
            href="/shop"
            className="absolute top-[74%] left-[9.2%] h-[13.6%] w-[21.8%] rounded-full focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-saffron"
          >
            <span className="sr-only">Explore our cups</span>
          </Link>
        </div>
              <div className="relative isolate mx-auto grid md:hidden max-w-7xl items-center overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_80%_50%,#f8d9ae_0%,#f6e3c6_60%)] md:grid-cols-[1.2fr_1fr]">
          <LeafSprig className="pointer-events-none absolute -bottom-6 left-[52%] -z-10 hidden w-24 rotate-[200deg] text-leaf md:block" />
          <div className="p-6 md:p-10">
            <h2 className="font-display text-3xl leading-[0.95] font-bold text-forest uppercase md:text-5xl">
              Same pasta.
              <br />
              More possibilities.
            </h2>
            <p className="mt-3 max-w-sm text-sm text-ink/80 md:text-base">
              Turn your favourite MAGO cup into something new. Quick, delicious and full of flavour.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 font-display text-sm font-bold tracking-wide text-cream-light uppercase hover:bg-forest-light"
            >
              Explore our cups <ArrowRight size={17} aria-hidden />
            </Link>
          </div>
          <div className="relative h-56 md:h-full md:min-h-[300px]">
            <ArchDecor tone="terracotta" className="absolute bottom-0 left-[10%] w-32 opacity-90 md:w-40" />
            <Image
              src="/products/cutouts/tagliolini-al-tartufo-bianco-v2.webp"
              alt=""
              fill
              sizes="(min-width: 768px) 35vw, 80vw"
              className="object-contain p-4 drop-shadow-[0_14px_16px_rgba(55,39,23,0.2)]"
            />
            <ScriptNote arrow="left" className="absolute top-5 right-5 -rotate-6 text-xl text-forest md:text-2xl">
              From cup
              <br />
              to chef.
            </ScriptNote>
          </div>
        </div>
      </section>

      {showcase.length ? (
        <section className="px-4 pb-10 md:px-10 md:pb-14">
          <div className="mx-auto grid max-w-7xl items-center gap-4 rounded-3xl bg-terracotta p-5 text-cream-light md:grid-cols-[1fr_2.6fr] md:p-7">
            <div>
              <h2 className="font-display text-2xl leading-none font-bold uppercase md:text-3xl">Share your creations</h2>
              <p className="mt-2 text-sm text-cream-light">Made something delicious with your MAGO cup? Share it with #MagoMoments.</p>
            </div>
            <ul className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1">
              {showcase.map((r) => (
                <li key={r.slug} className="shrink-0">
                  <Link href={`/recipes/${r.slug}`} className="relative block size-28 overflow-hidden rounded-xl ring-2 ring-cream-light/40 md:size-36" aria-label={r.title}>
                    {r.heroImage ? <Image src={r.heroImage} alt="" fill sizes="144px" className="object-cover" /> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
