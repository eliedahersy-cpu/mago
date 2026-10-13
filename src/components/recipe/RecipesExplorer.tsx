'use client';

import { ArrowRight, Clock3, Search, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArchDecor, LeafSprig, SunMark } from '@/components/brand/Decor';
import type { RecipeSummary } from '@/lib/types';
import { recipeImage } from '@/config/visual-media';

const categories = [
  {title:'All',tag:''},
  {title:'Quick Meals',tag:'quick-meals'},
  {title:'Extra Protein',tag:'extra-protein'},
  {title:'Mediterranean Twists',tag:'mediterranean-twists'},
  {title:'Comfort Food',tag:'comfort-food'},
  {title:'Soups',tag:'soups'},
];

export function RecipesExplorer({recipes}:{recipes:RecipeSummary[]}) {
  const [active,setActive]=useState('');
  const [search,setSearch]=useState('');
  const filtered=useMemo(()=>recipes.filter((r)=>{
    const matchTag=!active||r.tags.includes(active);
    const text=[r.title,r.subtitle,r.productName,...r.tags].filter(Boolean).join(' ').toLowerCase();
    return matchTag&&text.includes(search.trim().toLowerCase());
  }),[recipes,active,search]);
  return <div className="overflow-hidden bg-[#fff6e8]">
    <section className="relative isolate overflow-hidden border-b border-forest/5 bg-[radial-gradient(ellipse_at_70%_10%,#f8e1b7_0%,#fff6e8_60%)]">
      <ArchDecor tone="saffron" className="pointer-events-none absolute -right-8 -bottom-20 -z-10 w-52 opacity-30"/>
      <LeafSprig className="pointer-events-none absolute -top-12 -left-6 -z-10 w-36 -rotate-45 text-forest"/>
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-11 md:grid-cols-[1.1fr_.9fr] md:px-10 md:py-16">
        <div>
          <SunMark className="w-16"/>
          <h1 className="mt-2 font-display text-5xl leading-[.92] font-bold text-forest uppercase md:text-7xl">Recipes &<br/><span className="text-terracotta">inspiration</span></h1>
          <p className="mt-5 max-w-md text-lg text-forest">Get creative with your MAGO cups.</p>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-ink/70 md:text-base">Simple ideas. Big flavours. Discover new ways to turn your favourite cup into a meal that is uniquely yours.</p>
        </div>
        <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] shadow-lg">
          <Image src="/images/lifestyle-movie-night.webp" alt="MAGO pasta meal inspiration" fill priority sizes="(max-width:768px) 95vw, 550px" className="object-cover"/>
          <span className="absolute right-5 bottom-5 rounded-full bg-[#fff5e7] px-4 py-2 font-display text-sm font-bold text-forest">Same pasta. More possibilities.</span>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-display text-3xl font-bold text-forest uppercase md:text-4xl">All recipes</h2><p className="text-sm text-ink/70">{filtered.length} ideas to explore</p></div><label className="flex w-full items-center gap-2 rounded-full border border-forest/20 bg-[#fffdf6] px-4 py-2 sm:w-72"><Search size={18} className="text-forest"/><input aria-label="Search recipes" type="search" placeholder="Search recipes" value={search} onChange={(e)=>setSearch(e.target.value)} className="w-full bg-transparent text-sm text-forest outline-none placeholder:text-forest/40"/></label></div>
      <div className="scrollbar-none mt-6 flex gap-2 overflow-x-auto pb-3">{categories.map((c)=><button type="button" key={c.title} onClick={()=>setActive(c.tag)} aria-pressed={active===c.tag} className={'shrink-0 rounded-full px-5 py-2 text-sm font-semibold '+(active===c.tag?'bg-forest text-white':'border border-forest/20 bg-[#fffdf6] text-forest')}>{c.title}</button>)}</div>
      {filtered.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((recipe)=>{
        const image=recipeImage(recipe.slug,recipe.heroImage);
        const packshot=image.startsWith('/products/');
        return <Link href={'/recipes/'+recipe.slug} key={recipe.slug} className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] bg-[#fffbf2] shadow-[0_5px_24px_rgba(2,48,37,.08)] ring-1 ring-forest/5 transition-shadow hover:shadow-lg">
          <div className={'relative aspect-[4/3] overflow-hidden '+(packshot?'bg-[#f3e4cf]':'')}><Image src={image} alt="" fill sizes="(max-width:768px) 95vw, 320px" className={'transition-transform duration-300 group-hover:scale-[1.05] '+(packshot?'object-contain p-3 mix-blend-multiply':'object-cover')}/></div>
          <div className="flex flex-1 flex-col p-5"><h3 className="font-display text-xl leading-tight font-bold text-forest">{recipe.title}</h3>{recipe.subtitle&&<p className="mt-1 text-sm text-ink/60">{recipe.subtitle}</p>}<div className="mt-auto flex items-center justify-between pt-5"><span className="flex items-center gap-1 text-sm font-semibold text-forest"><Clock3 size={16}/>{recipe.minutes} min</span><span className="flex items-center gap-1 font-display text-xs font-bold text-terracotta uppercase">See recipe <ArrowRight size={15}/></span></div></div>
        </Link>;
      })}</div>:<p className="py-16 text-center text-ink/65">No recipes found. Try a different category or search.</p>}
    </section>
    <div className="bg-[#f3ebda] px-5 py-10 text-center"><Sparkles className="mx-auto text-saffron"/><h2 className="mt-2 font-display text-2xl font-bold text-forest uppercase">Make every cup your own</h2><p className="mx-auto mt-2 max-w-md text-sm text-ink/70">Discover the complete MAGO cup range and find your next favourite flavour.</p><Link href="/shop" className="mt-5 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 font-display text-sm font-bold text-white uppercase">Explore our cups <ArrowRight size={17}/></Link></div>
  </div>;
}
