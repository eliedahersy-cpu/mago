'use client';

import { ArrowRight, CalendarDays, Check, Gift, Leaf, Minus, Plus, RotateCcw, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArchDecor, LeafSprig, SunMark } from '@/components/brand/Decor';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

const plans = [
  {weeks:2, discount:15, label:'Every 2 weeks'},
  {weeks:4, discount:10, label:'Every 4 weeks'},
  {weeks:6, discount:10, label:'Every 6 weeks'},
];
const MAX_CUPS=5;

function shot(p:Product){return p.images.find(x=>x.kind==='packshot')?.url ?? p.images[0]?.url ?? '/products/fusilli-spicy-muhammara.webp'}

export function SubscribePreview({cups}:{cups:Product[]}) {
  const [frequency,setFrequency] = useState(4);
  const [selection,setSelection] = useState<Record<string,number>>({});
  const [review,setReview] = useState(false);
  const count=Object.values(selection).reduce((sum,n)=>sum+n,0);
  const selected=cups.filter(p=>selection[p.id]>0);
  const plan=plans.find(p=>p.weeks===frequency)!;
  const subtotal=selected.reduce((sum,p)=>sum+p.price*selection[p.id],0);
  const discount=subtotal*plan.discount/100;
  const total=subtotal-discount;
  function change(id:string,n:number){
    const previous=selection[id]||0;
    if(n>previous && count>=MAX_CUPS) return;
    setSelection(old=>({...old,[id]:Math.max(0,Math.min(MAX_CUPS,n))}));
    setReview(false);
  }
  return <div className="overflow-hidden bg-[#fff7e8]">
    <section className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_70%_30%,#f9dcb0_0%,#fff7e8_65%)]">
      <ArchDecor tone="saffron" className="pointer-events-none absolute -top-20 -right-8 -z-10 w-60 opacity-25"/>
      <LeafSprig className="pointer-events-none absolute -top-12 -left-5 -z-10 w-36 -rotate-45 text-forest"/>
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 md:grid-cols-[1fr_1fr] md:px-10 md:py-20">
        <div><SunMark className="w-20"/>
          <h1 className="mt-3 font-display text-5xl leading-[.95] font-bold text-forest uppercase md:text-7xl">Subscribe<br/><span className="text-terracotta">& save</span></h1>
          <p className="mt-5 text-lg font-medium text-forest">Your favourite MAGO cups, always on hand.</p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink/75 md:text-base">Choose your five-cup mix and delivery frequency. This is a staging preview: recurring subscriptions and deliveries are not yet activated.</p>
          <div className="mt-7 grid grid-cols-3 gap-3 text-center text-xs font-semibold text-forest">
            <div className="flex flex-col items-center gap-2"><Gift size={28} strokeWidth={1.5}/>Preview savings</div>
            <div className="flex flex-col items-center gap-2"><Truck size={28} strokeWidth={1.5}/>Flexible frequency</div>
            <div className="flex flex-col items-center gap-2"><RotateCcw size={28} strokeWidth={1.5}/>Easy to customise</div>
          </div>
        </div>
        <div className="relative mx-auto aspect-[5/4] w-full max-w-lg"><Image src="/products/mago-mix-box-open.webp" alt="The MAGO five-cup mix box" fill priority sizes="(max-width:768px) 95vw, 530px" className="object-contain mix-blend-multiply drop-shadow-xl"/></div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="flex items-baseline gap-3"><span className="font-display text-3xl font-bold text-terracotta">01</span><h2 className="font-display text-3xl font-bold text-forest uppercase md:text-4xl">Choose your delivery rhythm</h2></div>
          <p className="mt-2 text-sm text-ink/70">Illustrative discounts shown from the staging plan configuration; final subscription terms will be confirmed before launch.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">{plans.map(p=><button type="button" key={p.weeks} onClick={()=>{setFrequency(p.weeks);setReview(false)}} aria-pressed={frequency===p.weeks} className={'relative flex min-h-36 flex-col items-start rounded-[1.4rem] border-2 p-5 text-left transition '+(frequency===p.weeks?'border-forest bg-[#f2ead6] shadow-md':'border-forest/10 bg-[#fffdf7] hover:border-forest/30')}>
            {frequency===p.weeks&&<span className="absolute top-4 right-4 rounded-full bg-forest p-1 text-white"><Check size={15}/></span>}
            <CalendarDays size={28} className="text-forest"/><span className="mt-4 font-display text-lg font-bold text-forest">{p.label}</span><span className="mt-1 text-sm font-bold text-terracotta">{p.discount}% illustrative saving</span>
          </button>)}</div>
          <div className="mt-10 flex items-baseline gap-3"><span className="font-display text-3xl font-bold text-terracotta">02</span><h2 className="font-display text-3xl font-bold text-forest uppercase md:text-4xl">Build your five-cup box</h2></div>
          <p className="mt-2 text-sm text-ink/70">Choose five cups in any combination. You can select the same flavour more than once.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cups.map(p=>{
              const n=selection[p.id]||0;
              return <article key={p.id} className={'rounded-[1.3rem] border bg-[#fffdf7] p-3 '+(n?'border-forest shadow-sm':'border-forest/10')}>
                <Link href={'/shop/'+p.slug} className="relative block aspect-square"><Image src={shot(p)} alt={p.name+' '+(p.flavour??'')} fill sizes="(max-width:768px) 40vw, 200px" className="object-contain mix-blend-multiply"/></Link>
                <Link href={'/shop/'+p.slug} className="mt-1 line-clamp-2 min-h-11 font-display text-sm leading-tight font-bold text-forest">{p.name}<span className="block">{p.flavour}</span></Link>
                <p className="mt-1 text-xs font-bold text-forest">{formatPrice(p.price)}</p>
                <div className="mt-3 flex h-9 items-center justify-between rounded-full border border-forest/20">
                  <button type="button" disabled={!n} aria-label={'Remove '+p.name} onClick={()=>change(p.id,n-1)} className="grid size-9 place-items-center text-forest disabled:opacity-25"><Minus size={15}/></button>
                  <span className="font-display text-sm font-bold text-forest">{n}</span>
                  <button type="button" disabled={count===MAX_CUPS||!p.allowBackorder&&p.trackInventory&&p.stock<=0} aria-label={'Add '+p.name} onClick={()=>change(p.id,n+1)} className="grid size-9 place-items-center text-forest disabled:opacity-25"><Plus size={15}/></button>
                </div>
              </article>;
            })}
          </div>
        </div>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-[1.8rem] bg-[#f5e6cf] shadow-[0_8px_36px_rgba(2,48,37,.1)] ring-1 ring-forest/10">
            <div className="relative h-44 bg-[#f0dbc0]"><Image src="/products/mago-mix-box.webp" alt="MAGO Mix Box" fill sizes="340px" className="object-contain mix-blend-multiply"/></div>
            <div className="p-5"><h2 className="font-display text-2xl font-bold text-forest uppercase">Your subscription preview</h2><p className="mt-1 text-sm text-ink/65">{count} of 5 cups selected · {plan.label}</p>
              <div className="mt-4 flex gap-2">{Array.from({length:MAX_CUPS},(_,i)=><span key={i} className={'flex size-9 flex-1 items-center justify-center rounded-lg border-2 '+(i<count?'border-forest bg-forest text-white':'border-forest/20 bg-[#fff9ef] text-forest/40')}>{i<count?<Check size={18}/>:i+1}</span>)}</div>
              <ul className="mt-4 space-y-2">{selected.map(p=><li key={p.id} className="flex items-center gap-2 text-xs font-medium text-forest"><div className="relative size-10 shrink-0"><Image src={shot(p)} alt="" fill sizes="40px" className="object-contain mix-blend-multiply"/></div><span className="flex-1">{p.name} {p.flavour}</span><strong>{selection[p.id]}×</strong></li>)}</ul>
              <div className="mt-5 space-y-2 border-t border-forest/15 pt-4 text-sm text-forest"><div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between text-terracotta"><span>Indicative {plan.discount}% saving</span><span>−{formatPrice(discount)}</span></div><div className="flex justify-between border-t border-forest/15 pt-3 font-display text-lg font-bold"><span>Illustrative box total</span><span>{formatPrice(total)}</span></div></div>
              <Button className="mt-5 w-full" disabled={count!==MAX_CUPS} onClick={()=>setReview(true)}>Review my subscription <ArrowRight size={16}/></Button>
              {review&&<div role="status" className="mt-4 rounded-xl border border-forest/30 bg-[#e7efd9] p-4 text-sm text-forest"><strong className="font-display">Selection ready to preview.</strong><p className="mt-1">Your five selected cups would arrive {plan.label.toLowerCase()} at an illustrative cost of {formatPrice(total)} before delivery. Nothing has been ordered, saved or charged.</p></div>}
              <p className="mt-4 text-xs leading-relaxed text-ink/60">Preview only. Subscription enrolment, billing, fulfilment and plan management are not active.</p>
              <Link href="/mix-box" className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-forest underline-offset-4 hover:underline">Prefer a one-time Mix Box? <ArrowRight size={14}/></Link>
            </div>
          </div>
        </aside>
      </div>
    </section>
    <div className="bg-[#edeedc] px-5 py-10"><div className="mx-auto grid max-w-5xl gap-5 text-center sm:grid-cols-3">
      {[{Icon:Leaf,label:'Your choice',text:'Pick the MAGO cups you love.'},{Icon:CalendarDays,label:'Your schedule',text:'Explore delivery frequencies.'},{Icon:Gift,label:'Your mix',text:'Five cups, endless possibilities.'}].map(({Icon,label,text})=><div key={label} className="flex flex-col items-center"><Icon size={28} className="text-forest"/><h3 className="mt-2 font-display font-bold text-forest uppercase">{label}</h3><p className="mt-1 text-xs text-ink/70">{text}</p></div>)}
    </div></div>
  </div>;
}
