'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Children, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

const arrow =
  'absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-cream-light text-forest shadow-md ring-1 ring-forest/10 transition hover:bg-white';

export function Carousel({
  children,
  ariaLabel,
  itemClassName,
  className,
}: {
  children: ReactNode;
  ariaLabel: string;
  itemClassName?: string;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children);
  const [index, setIndex] = useState(0);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = track.current;
    if (!el || items.length === 0) return;
    setIndex(Math.min(items.length - 1, Math.round(el.scrollLeft / (el.scrollWidth / items.length))));
  };

  return (
    <div className={cn('relative', className)} role="region" aria-roledescription="carousel" aria-label={ariaLabel}>
      <div ref={track} onScroll={onScroll} className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {items.map((child, i) => (
          <div key={i} className={cn('shrink-0 snap-start', itemClassName)}>
            {child}
          </div>
        ))}
      </div>
      <button type="button" aria-label="Previous" onClick={() => scroll(-1)} className={cn(arrow, 'left-1 md:-left-5')}>
        <ChevronLeft size={20} aria-hidden />
      </button>
      <button type="button" aria-label="Next" onClick={() => scroll(1)} className={cn(arrow, 'right-1 md:-right-5')}>
        <ChevronRight size={20} aria-hidden />
      </button>
      <div className="mt-3 flex justify-center gap-1.5 md:hidden" aria-hidden>
        {items.map((_, i) => (
          <span key={i} className={cn('size-2 rounded-full', i === index ? 'bg-forest' : 'bg-forest/25')} />
        ))}
      </div>
    </div>
  );
}
