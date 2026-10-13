'use client';

import { Check, ImagePlus, Info, RotateCcw, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { mixBoxGallery, recipeImage } from '@/config/visual-media';
import { prepareLocalImage, removeLocalMedia, useLocalMediaMap, writeLocalMedia } from '@/lib/media/local-media';
import type { RecipeSummary } from '@/lib/types';

type Slot={key:string;label:string;fallback:string;description:string};

function MediaSlot({slot}:{slot:Slot}) {
  const map=useLocalMediaMap();
  const input=useRef<HTMLInputElement>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const current=map[slot.key]||slot.fallback;
  const preview=current.startsWith('data:');
  async function changed(file:File|undefined) {
    if(!file)return;
    setBusy(true);setMessage('');
    try {
      const value=await prepareLocalImage(file);
      writeLocalMedia(slot.key,value);
      setMessage('Image updated in your browser preview.');
    }catch(e){setMessage(e instanceof Error?e.message:'Unable to preview this image. Storage may be full.');}
    finally{setBusy(false);if(input.current)input.current.value='';}
  }
  return <article className="overflow-hidden rounded-[1.3rem] bg-[#fffdf7] shadow-sm ring-1 ring-forest/10">
    <div className="relative aspect-[4/3] bg-[#f0dfc7]"><Image src={current} alt={slot.description} fill unoptimized={preview} sizes="(max-width:768px) 46vw, 270px" className="object-cover"/></div>
    <div className="p-4"><h3 className="font-display text-lg font-bold text-forest">{slot.label}</h3><p className="mt-1 line-clamp-2 min-h-9 text-xs leading-relaxed text-ink/65">{slot.description}</p>
      <input ref={input} className="sr-only" type="file" accept="image/*" aria-label={'Replace '+slot.label} onChange={e=>void changed(e.target.files?.[0])}/>
      <button type="button" disabled={busy} onClick={()=>input.current?.click()} className="mt-4 flex min-h-9 w-full items-center justify-center gap-2 rounded-full bg-forest px-3 py-2 font-display text-xs font-bold text-white uppercase disabled:opacity-50"><Upload size={15}/>{busy?'Processing…':'Replace picture'}</button>
      {preview&&<button type="button" onClick={()=>{removeLocalMedia(slot.key);setMessage('Restored original image.')}} className="mt-2 flex w-full items-center justify-center gap-2 text-xs font-semibold text-forest"><RotateCcw size={15}/> Restore original</button>}
      {message&&<p role="status" className="mt-2 text-xs text-forest">{message}</p>}
    </div>
  </article>;
}

export function MediaStudio({recipes}:{recipes:RecipeSummary[]}) {
  const map=useLocalMediaMap();
  const previewCount=Object.keys(map).length;
  const mix:Slot[]=mixBoxGallery.map((item,i)=>({key:'mix:'+item.id,label:(i+1)+'. '+item.label,fallback:item.src,description:item.alt}));
  const recipeSlots:Slot[]=recipes.map(r=>({key:'recipe:'+r.slug,label:r.title,fallback:recipeImage(r.slug,r.heroImage),description:r.productName||'MAGO recipe photograph'}));
  const [search,setSearch]=useState('');
  const filtered=recipeSlots.filter(s=>s.label.toLowerCase().includes(search.trim().toLowerCase()));
  return <div className="min-h-screen bg-[#fff6e8] px-5 py-10 md:py-14">
    <div className="mx-auto max-w-6xl">
      <p className="font-display text-sm font-bold tracking-widest text-terracotta uppercase">Staging design tools</p>
      <h1 className="mt-2 font-display text-4xl font-bold text-forest uppercase md:text-6xl">MAGO Visual Studio</h1>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink/75">Replace Mix Box gallery pictures and recipe photos to preview them directly on this staging website. Your choices are saved only in this browser, not published for other visitors.</p>
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-forest/15 bg-[#f0ebd9] p-4 text-sm text-forest">
        <Info className="size-6 shrink-0"/><p className="flex-1">Local design preview — <strong>{previewCount} replacement{previewCount===1?'':'s'} applied.</strong> To publish images to the real site, provide the original approved image files for the shared website assets.</p>
        <Link href="/mix-box" className="rounded-full bg-forest px-4 py-2 text-xs font-bold text-white">View Mix Box</Link>
        <Link href="/recipes" className="rounded-full border border-forest px-4 py-2 text-xs font-bold text-forest">View Recipes</Link>
      </div>
      <section className="mt-12"><h2 className="font-display text-3xl font-bold text-forest uppercase">Mix Box pictures</h2><p className="mt-2 text-sm text-ink/70">Slot 1 is the closed box. Slots 2–4 are open-box views; replace each with a distinct approved photo whenever ready.</p><div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">{mix.map(slot=><MediaSlot key={slot.key} slot={slot}/>)}</div></section>
      <section className="mt-14"><h2 className="font-display text-3xl font-bold text-forest uppercase">Recipe photographs</h2><p className="mt-2 text-sm text-ink/70">Replace any recipe image. The same preview will appear on the homepage recipe carousel, recipe listing and recipe detail page.</p>
        <input value={search} onChange={e=>setSearch(e.target.value)} type="search" aria-label="Find a recipe to edit" placeholder="Search recipe name…" className="mt-5 h-11 w-full max-w-lg rounded-full border border-forest/20 bg-white px-5 text-forest outline-none focus:border-forest"/>
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{filtered.map(slot=><MediaSlot key={slot.key} slot={slot}/>)}</div>
        {!filtered.length&&<p className="py-10 text-center text-ink/65">No recipes match this search.</p>}
      </section>
      <div className="mt-12 rounded-2xl border border-forest/15 bg-[#f0ebd9] p-5 text-sm leading-relaxed text-forest"><strong>Publishing workflow:</strong> Use this editor to test crops and visual placement. The images remain in browser storage; clearing browser data removes previews. Send the final original images for permanent publishing through the MAGO repository and recipe database.</div>
    </div>
  </div>;
}
