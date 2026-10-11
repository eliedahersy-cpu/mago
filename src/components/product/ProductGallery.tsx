'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { ProductImage } from '@/lib/types';

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      {images.length > 1 ? (
        <ul className="scrollbar-none flex gap-2 overflow-x-auto lg:max-h-[560px] lg:flex-col lg:overflow-y-auto">
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
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-cream-dark/50">
        {current ? (
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1024px) 45vw, 100vw"
            className={cn(current.kind === 'packshot' ? 'object-contain p-6 mix-blend-multiply' : 'object-cover')}
          />
        ) : null}
      </div>
    </div>
  );
}
