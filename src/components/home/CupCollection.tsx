'use client';

import { ChevronLeft, ChevronRight, Leaf, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArchDecor, LeafSprig } from '@/components/brand/Decor';
import type { Product } from '@/lib/types';

const PAUSE_MS = 5200;
function distance(index:number,active:number,length:number) {
  const forward=(index-active+length)%length;
  return forward>length/2?forward-length:forward;
}
function imageFor(p:Product) {return p.images.find(i=>i.kind==='packshot')?.url??p.images[0]?.url??'/products/fusilli-spicy-muhammara.webp';}

export function CupCollection({products}:{products:Product[]}) {
  const [active,setActive] = useState(Math.min(2,Math.max(0,products.length-1)));
  const [paused,setPaused] = useState(false);
  const [reducedMotion,setReducedMotion] = useState(false);
  const pointer = useRef<number|null>(null);
  const length=products.length;

  useEffect(()=>{
    const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change',update);
    return()=>mq.removeEventListener('change',update);
  },[]);
  useEffect(()=>{
    if(paused||reducedMotion||length<2) return;
    const timer=window.setInterval(()=>setActive(current=>(current+1)%length),PAUSE_MS);
    return()=>window.clearInterval(timer);
  },[paused,reducedMotion,length]);
  const move=(by:number)=>setActive(current=>(current+by+length)%length);

  if(!length) return null;

  return <section aria-label="The MAGO cup collection" className="relative isolate overflow-hidden bg-[#fff5e5] py-10 md:py-16">
    <ArchDecor tone="terracotta" className="pointer-events-none absolute -right-12 -top-20 -z-10 w-40 opacity-40 md:w-64"/>
    <ArchDecor tone="saffron" className="pointer-events-none absolute -bottom-28 -left-12 -z-10 w-40 opacity-40 md:w-60"/>
    <LeafSprig className="pointer-events-none absolute -left-5 top-1/3 -z-10 w-24 -rotate-12 text-leaf/75 md:w-40"/>
    <LeafSprig className="pointer-events-none absolute -right-3 bottom-4 -z-10 w-24 rotate-12 text-leaf/75 md:w-36"/>
    <div className="relative mx-auto max-w-[1460px] px-4">
      <div className="text-center">
        <h2 className="font-display text-[clamp(2rem,4.5vw,4.8rem)] leading-tight font-bold uppercase text-forest">The MAGO cup collection</h2>
        <p className="mt-1 text-base text-forest/80 md:text-2xl">Five moods. Endless possibilities.</p>
      </div>
      <div role="region" aria-roledescription="carousel" aria-label="MAGO cups, infinite loop" aria-live="off"
        onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
        onFocusCapture={()=>setPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setPaused(false)}}
        onTouchStart={e=>{pointer.current=e.touches[0]?.clientX??null}}
        onTouchEnd={e=>{if(pointer.current!==null){const delta=(e.changedTouches[0]?.clientX??pointer.current)-pointer.current;if(Math.abs(delta)>35)move(delta<0?1:-1);pointer.current=null}}}
        className="relative mt-6 h-[445px] touch-pan-y sm:h-[485px] md:h-[555px]">
        <div className="pointer-events-none absolute right-[4%] bottom-14 left-[4%] h-36 rounded-[50%] border-t border-[#e6c39d] bg-[radial-gradient(ellipse_at_center,#f5dfba_0%,transparent_72%)] md:bottom-16"/>
        {products.map((p,i)=>{
          const offset=distance(i,active,length);
          const abs=Math.abs(offset);
          const highlighted=offset===0;
          const visible=abs<=2;
          const scale=Math.max(.69,1-abs*.15);
          return <article key={p.id}
            aria-hidden={!visible?true:undefined}
            className={'absolute left-1/2 top-0 flex w-[67vw] max-w-[270px] flex-col items-center text-center md:w-[min(20.5vw,300px)] md:max-w-[300px] [--item-step:clamp(148px,62vw,235px)] md:[--item-step:clamp(175px,19vw,290px)] '+(reducedMotion?'':'transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(.22,1,.36,1)]')}
            style={{
              zIndex:10-abs,
              transform:'translateX(calc(-50% + var(--item-step) * '+offset+')) translateY('+(abs*31)+'px) scale('+scale+')',
              opacity:visible?1:0,
              filter:highlighted?'none':'saturate(.94)'
            }}>
            <button type="button" tabIndex={visible&&!highlighted?0:-1} disabled={!visible||highlighted} aria-label={'Highlight '+p.name+' '+(p.flavour??'')} onClick={()=>setActive(i)}
              className={'relative block aspect-[4/5] w-full rounded-[45%_45%_26%_26%] outline-offset-4 '+(highlighted?'drop-shadow-[0_22px_18px_rgba(55,39,23,.22)]':'drop-shadow-[0_10px_12px_rgba(55,39,23,.11)]')}>
              <Image src={imageFor(p)} alt={p.name+' '+(p.flavour??'')} fill
                sizes="(min-width:1024px) 300px, (min-width:768px) 250px, 68vw"
                className="object-contain mix-blend-multiply" priority={highlighted}/>
            </button>
            <div className={'relative -mt-1 w-full '+(highlighted?'':'md:opacity-95')}>
              <h3 className="font-display text-[clamp(15px,1.55vw,22px)] leading-tight font-bold uppercase text-forest">{p.name}</h3>
              <p className="mt-0.5 min-h-10 text-[13px] leading-snug text-forest/90 md:text-base">{p.flavour}</p>
              <Link href={'/shop/'+p.slug}
                tabIndex={visible?0:-1}
                className={'mx-auto mt-1 inline-flex min-h-9 items-center justify-center rounded-full bg-forest px-5 py-2 font-display text-xs font-bold text-white uppercase shadow-sm transition hover:bg-forest-light md:text-sm '+(!highlighted?'max-md:pointer-events-none max-md:opacity-0':'')}
              >View details</Link>
            </div>
          </article>;
        })}
        <button type="button" onClick={()=>move(-1)} aria-label="Previous cup" className="absolute left-0 top-[38%] z-30 grid size-11 place-items-center rounded-full border border-forest/15 bg-[#fffaf0]/95 text-forest shadow-lg transition hover:bg-white md:left-5 md:size-13"><ChevronLeft aria-hidden size={25}/></button>
        <button type="button" onClick={()=>move(1)} aria-label="Next cup" className="absolute right-0 top-[38%] z-30 grid size-11 place-items-center rounded-full border border-forest/15 bg-[#fffaf0]/95 text-forest shadow-lg transition hover:bg-white md:right-5 md:size-13"><ChevronRight aria-hidden size={25}/></button>
      </div>
      <div className="flex items-center justify-center gap-3" role="group" aria-label="Choose a cup">
        {products.map((p,i)=><button type="button" key={p.id} aria-label={'Show '+p.name+' '+(p.flavour??'')} aria-current={i===active?'true':undefined}
          onClick={()=>setActive(i)} className={'size-2.5 rounded-full transition-all '+(i===active?'scale-125 bg-forest':'bg-forest/25 hover:bg-forest/50')}/>)}
      </div>
      <p className="sr-only" aria-live="polite">{products[active].name} {products[active].flavour}, item {active+1} of {length}</p>
    </div>
  </section>;
}
