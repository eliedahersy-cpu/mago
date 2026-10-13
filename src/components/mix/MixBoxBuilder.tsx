'use client';

import { ArrowRight, Check, Gift, Heart, Leaf, Minus, Plus, ShoppingBag, Sparkles, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArchDecor, LeafSprig, SunMark } from '@/components/brand/Decor';
import { Button } from '@/components/ui/Button';
import { MixBoxGallery } from '@/components/mix/MixBoxGallery';
import { toCartProduct } from '@/lib/cart/lines';
import { useCart } from '@/lib/cart/store';
import { isPurchasable } from '@/lib/catalog/stock';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

const LIMIT = 5;
function packshot(p: Product) { return p.images.find((i)=>i.kind==='packshot')?.url ?? p.images[0]?.url ?? '/products/fusilli-spicy-muhammara.webp'; }

export function MixBoxBuilder({ cups }: { cups: Product[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState('All');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const add = useCart((s) => s.add);
  const count = Object.values(quantities).reduce((sum,n)=>sum+n,0);
  const chosen = cups.filter((p)=>quantities[p.id]>0);
  const total = chosen.reduce((sum,p)=>sum+p.price*quantities[p.id],0);
  const categories = ['All','Fusilli','Rishta','Pastina','Tagliolini','Conchiglie','Other'];
  const filtered = useMemo(()=>cups.filter((p)=>{
    if(showOnlySelected && !quantities[p.id]) return false;
    return filter==='All' || (filter==='Other' ? !['Fusilli','Rishta','Pastina','Tagliolini','Conchiglie'].some((v)=>p.name.toLowerCase().includes(v.toLowerCase())) : p.name.toLowerCase().includes(filter.toLowerCase()));
  }),[cups,filter,showOnlySelected,quantities]);
  function setQty(id: string, value: number) {
    const current=quantities[id]||0;
    if(value > current && count>=LIMIT) return;
    setQuantities((old)=>({...old,[id]:Math.max(0,Math.min(LIMIT,value))}));
  }
  function submit() {
    if(count!==LIMIT) return;
    chosen.forEach((p)=>add(toCartProduct(p),quantities[p.id]));
  }
  return <div className="overflow-hidden bg-[#fff7e9]">
    <section className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_70%_35%,#fee0b3_0%,#fff7e9_65%)]">
      <ArchDecor className="pointer-events-none absolute -top-20 right-[8%] -z-10 w-64 opacity-20"/>
      <LeafSprig className="pointer-events-none absolute -top-10 left-0 -z-10 w-32 -rotate-45 text-forest"/>
      <div className="mx-auto grid max-w-7xl items-center gap-7 px-5 py-10 md:grid-cols-2 md:px-10 md:py-16">
        <div>
          <SunMark className="w-20"/>
          <h1 className="font-display text-[clamp(3rem,6vw,5.5rem)] leading-[.96] font-bold tracking-tight text-forest uppercase">Build your<br/><span className="text-terracotta">MAGO Mix Box</span></h1>
          <p className="mt-4 text-lg text-forest md:text-2xl">Pick 5 cups. Your way.</p>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink/75 md:text-base">Choose your favourites, discover new flavours, or create a giftable assortment. The choice is entirely yours.</p>
          <ul className="mt-7 grid grid-cols-3 gap-2 text-center text-xs font-medium text-forest">
            <li className="flex flex-col items-center gap-2"><Heart size={28} strokeWidth={1.6}/>Mix your favourites</li>
            <li className="flex flex-col items-center gap-2"><Leaf size={28} strokeWidth={1.6}/>More flavours to explore</li>
            <li className="flex flex-col items-center gap-2"><Gift size={28} strokeWidth={1.6}/>The perfect gift</li>
          </ul>
        </div>
        <div className="mx-auto w-full max-w-[570px]"><MixBoxGallery /></div>
      </div>
    </section>
    <div className="border-y border-forest/10 bg-[#f5ecd9]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
        <div><p className="font-display text-sm font-bold text-forest uppercase">Your 5-cup mix</p><p className="text-xs text-forest/70">{count} of 5 cups selected</p></div>
        <div className="flex gap-2">{Array.from({length:LIMIT},(_,i)=><span key={i} className={'flex size-8 items-center justify-center rounded-full border-2 text-sm font-bold '+(i<count?'border-forest bg-forest text-white':'border-saffron bg-[#fff9ec] text-forest')}>{i<count?<Check size={16}/>:i+1}</span>)}</div>
        <span className="hidden font-display text-lg font-bold text-forest sm:block">{formatPrice(total)}</span>
      </div>
    </div>
    <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_350px] lg:px-10">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="font-display text-3xl font-bold text-forest uppercase md:text-4xl">Choose your cups</h2><p className="mt-1 text-sm text-ink/70">Select any five cups. Repeat a flavour or try them all.</p></div>
          <label className="flex items-center gap-2 text-xs font-semibold text-forest"><input type="checkbox" checked={showOnlySelected} onChange={(e)=>setShowOnlySelected(e.target.checked)} className="accent-[#023025]"/> Selected only</label>
        </div>
        <div className="scrollbar-none mt-6 flex gap-2 overflow-x-auto pb-3">{categories.map((category)=><button key={category} type="button" onClick={()=>setFilter(category)} className={'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition '+(filter===category?'border-forest bg-forest text-white':'border-forest/20 bg-[#fffaf1] text-forest hover:border-forest')}>{category}</button>)}</div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-3">
          {filtered.map((p)=>{
            const qty=quantities[p.id]||0;const available=isPurchasable(p);
            return <article key={p.id} className={'relative flex flex-col overflow-hidden rounded-2xl border bg-[#fffdf6] p-3 transition-shadow '+(qty?'border-forest shadow-md':'border-forest/10 shadow-sm hover:shadow-md')}>
              {qty>0 && <span className="absolute top-3 left-3 z-10 flex size-7 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">{qty}</span>}
              <Link href={'/shop/'+p.slug} className="relative block aspect-square w-full"><Image src={packshot(p)} alt={p.name+' '+(p.flavour??'')} fill sizes="(max-width:768px) 44vw, 220px" className="object-contain mix-blend-multiply"/></Link>
              <Link href={'/shop/'+p.slug} className="mt-1 line-clamp-2 min-h-10 font-display text-sm leading-tight font-bold text-forest md:text-base">{p.name}<span className="block">{p.flavour}</span></Link>
              <p className="mt-1 text-sm font-bold text-forest">{formatPrice(p.price)}</p>
              <div className="mt-auto pt-3">
                {qty===0 ? <Button size="sm" className="w-full px-1" disabled={!available||count>=LIMIT} onClick={()=>setQty(p.id,1)}><Plus size={15}/> Add</Button> :
                  <div className="flex h-9 items-center justify-between rounded-full border-2 border-forest text-forest"><button type="button" onClick={()=>setQty(p.id,qty-1)} className="grid size-8 place-items-center" aria-label={'Remove '+p.name}><Minus size={16}/></button><span className="font-bold tabular-nums">{qty}</span><button type="button" disabled={count>=LIMIT} onClick={()=>setQty(p.id,qty+1)} className="grid size-8 place-items-center disabled:opacity-30" aria-label={'Add '+p.name}><Plus size={16}/></button></div>}
              </div>
            </article>;
          })}
        </div>
        {!filtered.length&&<div className="py-12 text-center text-ink/70">No cups match this filter.</div>}
      </div>
      <aside className="lg:self-start lg:sticky lg:top-28">
        <div className="overflow-hidden rounded-[2rem] bg-[#f8e8d1] shadow-[0_10px_40px_rgba(2,48,37,.1)] ring-1 ring-forest/10">
          <MixBoxGallery compact />
          <div className="p-5"><h2 className="font-display text-2xl leading-tight font-bold text-forest uppercase">Your MAGO Mix Box</h2><p className="mt-1 text-sm text-ink/70">5 cups. Your mix.</p>
            <div className="mt-4 space-y-3">
              {chosen.map((p)=><div key={p.id} className="flex items-center gap-3 rounded-xl bg-[#fffaf2] p-2">
                <div className="relative size-14 shrink-0"><Image src={packshot(p)} alt="" fill sizes="56px" className="object-contain mix-blend-multiply"/></div>
                <div className="min-w-0 flex-1"><p className="text-xs leading-tight font-bold text-forest">{p.name} {p.flavour}</p><p className="text-xs text-ink/65">{formatPrice(p.price)} each</p></div>
                <div className="flex items-center gap-1"><button aria-label="Remove one" type="button" onClick={()=>setQty(p.id,quantities[p.id]-1)} className="grid size-6 place-items-center rounded-full bg-cream-dark"><Minus size={13}/></button><span className="w-4 text-center text-xs font-bold">{quantities[p.id]}</span><button aria-label="Add one" type="button" disabled={count>=LIMIT} onClick={()=>setQty(p.id,quantities[p.id]+1)} className="grid size-6 place-items-center rounded-full bg-cream-dark disabled:opacity-30"><Plus size={13}/></button></div>
              </div>)}
              {Array.from({length:Math.max(0,LIMIT-count)},(_,i)=><div key={i} className="flex h-12 items-center justify-center rounded-xl border border-dashed border-forest/25 text-sm text-forest/40">+ Choose a cup</div>)}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-forest/15 pt-4 font-display font-bold text-forest"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
            <p className="mt-1 text-xs text-ink/60">Prices shown before any checkout discounts and delivery.</p>
            <Button disabled={count!==LIMIT} className="mt-4 w-full" onClick={submit}><ShoppingBag size={17}/> Add my mix to cart <ArrowRight size={17}/></Button>
            <button type="button" disabled={!count} onClick={()=>setQuantities({})} className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-bold text-forest underline-offset-4 hover:underline disabled:opacity-30"><Trash2 size={14}/> Clear selection</button>
          </div>
        </div>
      </aside>
    </section>
    <section className="bg-[#efeddc] px-5 py-8"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 text-center font-display text-sm font-bold text-forest uppercase"><span className="flex items-center gap-2"><Heart/>Mix your favourites</span><span className="flex items-center gap-2"><Sparkles/>Discover something new</span><span className="flex items-center gap-2"><Gift/>Perfect for gifting</span></div></section>
  </div>;
}
