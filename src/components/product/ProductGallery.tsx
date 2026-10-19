'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ArchDecor, LeafSprig } from '@/components/brand/Decor';
import { cutoutImage } from '@/lib/catalog/cutout';
import { cn } from '@/lib/cn';
import type { ProductImage } from '@/lib/types';

/** Round "30G protein per cup" seal, as on the packaging. */
function ProteinSeal({ grams }: { grams: number }) {
  return (
    <span className="absolute right-[6%] bottom-[6%] grid size-20 place-items-center rounded-full bg-cream-light text-center font-display leading-none font-bold text-forest uppercase shadow-lg ring-2 ring-forest md:size-24">
      <span>
        <span className="block text-2xl md:text-3xl">{grams}g</span>
        <span className="block text-[10px] md:text-xs">Protein</span>
        <span className="block text-[9px] md:text-[10px]">per cup</span>
      </span>
    </span>
  );
}

export function ProductGallery({ images, name, proteinG = null }: { images: ProductImage[]; name: string; proteinG?: number | null }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  const cutout = current?.kind === 'packshot' ? cutoutImage(current.url) : null;
  // Cups with a transparent cutout stand in an illustrated scene; other packshots keep the plain panel.
  const staged = cutout !== null && cutout !== current?.url;

  return (
    <div className="flex min-w-0 flex-col-reverse gap-3 lg:flex-row">
      {images.length > 1 ? (
        <ul className="scrollbar-none flex max-w-full gap-2 overflow-x-auto lg:max-h-[560px] lg:flex-col lg:overflow-y-auto">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-pressed={i === active}
                onClick={() => setActive(i)}
                className={cn(
                  'relative block size-20 shrink-0 overflow-hidden rounded-xl bg-cream-dark/50 ring-2 transition',
                  i === active ? 'ring-forest' : 'ring-transparent hover:ring-forest/30',
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="80px"
                  className={cn(img.kind === 'packshot' ? 'object-contain p-1 mix-blend-multiply' : 'object-cover')}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div
        className={cn(
          'relative isolate aspect-square w-full overflow-hidden rounded-3xl',
          staged ? 'bg-[radial-gradient(ellipse_at_50%_60%,#fff4e2_0%,#f8e4c7_60%,#f1d6b3_100%)]' : 'bg-cream-dark/50',
        )}
      >
        {staged ? (
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <ArchDecor tone="terracotta" className="absolute -bottom-6 left-[6%] w-[38%] opacity-90" />
            <ArchDecor tone="peach" className="absolute -right-[4%] -bottom-10 w-[34%] opacity-90" />
            <LeafSprig className="absolute -top-2 -left-4 w-[22%] -rotate-[25deg] text-leaf" />
            <LeafSprig className="absolute top-[30%] -right-6 w-[20%] rotate-[205deg] text-forest-light" />
            <div className="absolute inset-x-[12%] bottom-[7%] h-[12%] rounded-[50%] bg-[#6b4a2a]/15 blur-md" />
          </div>
        ) : null}
        {current ? (
          <Image
            src={staged ? cutout! : current.url}
            alt={current.alt || name}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1024px) 45vw, 100vw"
            className={cn(
              current.kind !== 'packshot' && 'object-cover',
              current.kind === 'packshot' && staged && 'object-contain p-[9%] drop-shadow-[0_18px_18px_rgba(55,39,23,0.2)]',
              current.kind === 'packshot' && !staged && 'object-contain p-6 mix-blend-multiply',
            )}
          />
        ) : null}
        {staged && proteinG ? <ProteinSeal grams={proteinG} /> : null}
      </div>
    </div>
  );
}
