'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ManagedMediaImage } from '@/components/media/ManagedMediaImage';
import { useState } from 'react';
import { mixBoxGallery } from '@/config/visual-media';

export function MixBoxGallery({compact=false}:{compact?:boolean}) {
  const [index,setIndex]=useState(0);
  const image=mixBoxGallery[index];
  const go=(dir:number)=>setIndex(old=>(old+dir+mixBoxGallery.length)%mixBoxGallery.length);
  return <div className={compact?'w-full':'w-full'}>
    <div className={'relative isolate overflow-hidden '+(compact?'aspect-[1.46] bg-[#edd4b7]':'aspect-[5/4] rounded-[1.7rem] bg-[#f6e3cd] shadow-[0_14px_46px_rgba(25,36,20,.1)]')}>
      <ManagedMediaImage key={image.id} slotKey={'mix:'+image.id} fallback={image.src} alt={image.alt} fill priority={!compact&&index===0}
        sizes={compact?'350px':'(max-width:768px) 90vw, 650px'}
        className="object-cover transition-opacity duration-300"
        style={{objectPosition:image.position??'center',transform:'scale('+(image.zoom??1)+')'}}/>
      {!compact&&<><button type="button" aria-label="Previous mix box image" onClick={()=>go(-1)} className="absolute left-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-[#fffaf1]/95 text-forest shadow-md hover:bg-white"><ChevronLeft size={23}/></button><button type="button" aria-label="Next mix box image" onClick={()=>go(1)} className="absolute right-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-[#fffaf1]/95 text-forest shadow-md hover:bg-white"><ChevronRight size={23}/></button></>}
      <span className="absolute right-3 bottom-3 rounded-full bg-[#fffaf2]/90 px-3 py-1 text-[11px] font-bold text-forest">{index+1} / {mixBoxGallery.length}</span>
    </div>
    <div role="group" aria-label="Mix Box image gallery" className={'mt-3 grid grid-cols-4 gap-2 '+(compact?'px-2 pb-2':'')}>
      {mixBoxGallery.map((item,i)=><button type="button" key={item.id} onClick={()=>setIndex(i)}
        aria-label={'Show '+item.label} aria-pressed={index===i}
        className={'relative aspect-[4/3] overflow-hidden rounded-lg border-2 bg-[#f4e3cd] transition '+(index===i?'border-forest shadow-sm':'border-transparent hover:border-forest/40')}>
        <ManagedMediaImage slotKey={'mix:'+item.id} fallback={item.src} alt="" fill sizes={compact?'80px':'(min-width:768px) 140px, 22vw'} className="object-cover" style={{objectPosition:item.position??'center',transform:'scale('+(item.zoom??1)+')'}}/>
      </button>)}
    </div>
  </div>;
}
