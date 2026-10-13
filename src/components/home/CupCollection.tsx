'use client';

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArchDecor, LeafSprig, SunMark } from '@/components/brand/Decor';
import { ButtonLink } from '@/components/ui/Button';
import { cutoutImage } from '@/lib/catalog/cutout';
import { cn } from '@/lib/cn';
import type { Product } from '@/lib/types';

const AUTOPLAY_MS = 4500;

/** Shortest signed distance from the active slide, so the ring loops both ways. */
function offsetFrom(index: number, active: number, length: number): number {
  const forward = (index - active + length) % length;
  return forward > length / 2 ? forward - length : forward;
}

function packshot(p: Product) {
  return p.images.find((i) => i.kind === 'packshot') ?? p.images[0];
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('text-saffron', className)} aria-hidden fill="currentColor">
      <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12C11.4 17.8 6.2 12.6 0 12 6.2 11.4 11.4 6.2 12 0Z" />
    </svg>
  );
}

/**
 * The home "MAGO cup collection": a looping carousel that turns on its own. Phones show one cup with its
 * neighbours peeking in at the edges; wider screens show five, the middle one forward.
 */
export function CupCollection({ products }: { products: Product[] }) {
  const length = products.length;
  const [active, setActive] = useState(Math.floor(length / 2));
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const [stopped, setStopped] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setStill(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (paused || stopped || still || length < 2) return;
    const timer = window.setInterval(() => setActive((a) => (a + 1) % length), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, stopped, still, length]);

  if (length === 0) return null;
  const move = (by: number) => setActive((a) => (a + by + length) % length);
  const current = products[active];

  return (
    <section aria-labelledby="cup-collection-title" className="relative isolate overflow-hidden bg-[#fbf1e1] pt-9 pb-10 md:pt-14 md:pb-14">
      {/* Mediterranean arches and leaves framing the section, as on the packaging. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <ArchDecor tone="peach" className="absolute top-4 -left-12 w-24 opacity-75 md:top-10 md:w-36" />
        <ArchDecor tone="sage" className="absolute top-[44%] -left-14 w-24 opacity-60 md:w-32" />
        <ArchDecor tone="terracotta" className="absolute -bottom-20 left-6 w-20 opacity-45 md:w-28" />
        <ArchDecor tone="terracotta" className="absolute top-2 -right-12 w-24 opacity-55 md:top-8 md:w-36" />
        <ArchDecor tone="sage" className="absolute top-[46%] -right-14 w-24 opacity-60 md:w-32" />
        <ArchDecor tone="peach" className="absolute right-4 -bottom-20 w-20 opacity-70 md:w-28" />
        <LeafSprig className="absolute -top-2 left-3 w-12 -rotate-[30deg] text-leaf md:w-20" />
        <LeafSprig className="absolute -top-1 right-4 w-12 rotate-[28deg] text-forest-light md:w-20" />
        <LeafSprig className="absolute -bottom-6 -left-4 w-14 rotate-[210deg] text-forest-light md:w-24" />
        <LeafSprig className="absolute -right-4 -bottom-6 w-14 rotate-[150deg] text-leaf md:w-24" />
      </div>

      <div className="relative px-4 text-center">
        <div className="relative mx-auto w-fit">
          <SunMark className="mx-auto w-16 md:w-20" />
          <Sparkle className="absolute top-3 -left-10 size-4 md:-left-14 md:size-5" />
          <Sparkle className="absolute top-6 -right-9 size-3 md:-right-12 md:size-4" />
        </div>
        <h2
          id="cup-collection-title"
          className="mt-1 font-display text-[2.55rem] leading-[0.95] font-bold text-forest uppercase sm:text-5xl lg:text-6xl"
        >
          The MAGO cup <br className="sm:hidden" />
          collection
        </h2>
        <p className="mt-2 font-serif text-lg text-ink/85 md:text-2xl">Five moods. Endless possibilities.</p>
      </div>

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="MAGO cups"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
          setPaused(true);
        }}
        onTouchEnd={(e) => {
          const start = touchX.current;
          touchX.current = null;
          if (start === null) return;
          const delta = (e.changedTouches[0]?.clientX ?? start) - start;
          if (Math.abs(delta) > 35) move(delta < 0 ? 1 : -1);
        }}
        className="relative mx-auto mt-5 max-w-[1400px] touch-pan-y md:mt-8"
      >
        <div className="relative h-[min(86vw,360px)] sm:h-[400px] md:h-[440px] lg:h-[480px]">
          {/* soft stage the cups stand on */}
          <div aria-hidden className="absolute inset-x-[8%] bottom-0 h-16 rounded-[50%] bg-[radial-gradient(ellipse_at_center,#f1d8b1_0%,transparent_70%)] md:bottom-24" />
          {products.map((p, i) => {
            const offset = offsetFrom(i, active, length);
            const distance = Math.abs(offset);
            const centre = offset === 0;
            const shot = packshot(p);
            const image = shot ? cutoutImage(shot.url) : null;
            // Without a transparent cutout, multiply the whole slide so the white studio background drops out.
            const blend = shot !== undefined && image === shot.url;
            const label = `${p.name} ${p.flavour ?? ''}`.trim();
            const style = {
              '--o': offset,
              '--d': distance,
              zIndex: 10 - distance,
            } as CSSProperties;
            return (
              <div
                key={p.id}
                data-testid="showcase-card"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${length}: ${label}`}
                aria-hidden={distance > 2 || undefined}
                style={style}
                className={cn(
                  'absolute top-0 left-1/2 flex w-[58vw] max-w-[300px] flex-col items-center text-center',
                  // phones: neighbours peek in from the edges; wider: five across, shrinking outwards
                  'cup-slide md:w-[clamp(170px,17vw,250px)]',
                  blend && 'mix-blend-multiply',
                  distance > 1 && 'max-md:opacity-0',
                  distance > 2 && 'opacity-0',
                  !still && 'transition-[transform,opacity] duration-700 ease-[cubic-bezier(.22,1,.36,1)]',
                )}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setActive(i)}
                  aria-label={centre ? label : `Show ${label}`}
                  className={cn(
                    'relative block aspect-[4/5] w-full',
                    centre && !blend && 'drop-shadow-[0_16px_14px_rgba(55,39,23,0.2)]',
                    !centre && 'cursor-pointer',
                  )}
                >
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 250px, 58vw"
                      className="object-contain"
                    />
                  ) : null}
                </button>
                {/* wider screens: every visible cup carries its own name and link */}
                <div className="hidden w-full md:block">
                  <h3 className="mt-1 font-display text-lg leading-tight font-bold text-forest uppercase lg:text-xl">{p.name}</h3>
                  <p className="min-h-10 font-serif text-sm leading-snug text-ink/85 lg:text-base">{p.flavour}</p>
                  <ButtonLink
                    href={`/shop/${p.slug}`}
                    size="sm"
                    tabIndex={distance > 2 ? -1 : undefined}
                    className="mt-2"
                    aria-label={`View details: ${label}`}
                  >
                    View details
                  </ButtonLink>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous cup"
            className="absolute top-[42%] left-[calc(50%-36vw)] z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-cream-light/95 text-forest shadow-lg ring-1 ring-forest/10 transition hover:bg-white sm:left-[calc(50%-34vw)] md:top-[38%] md:left-4 md:size-12 lg:left-8"
          >
            <ChevronLeft size={24} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next cup"
            className="absolute top-[42%] right-[calc(50%-36vw)] z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-cream-light/95 text-forest shadow-lg ring-1 ring-forest/10 transition hover:bg-white sm:right-[calc(50%-34vw)] md:top-[38%] md:right-4 md:size-12 lg:right-8"
          >
            <ChevronRight size={24} aria-hidden />
          </button>
        </div>

        {/* phones: the cup in front is named below the ring */}
        <div className="px-6 text-center md:hidden" aria-live={paused ? 'polite' : 'off'}>
          <h3 className="font-display text-[1.7rem] leading-tight font-bold text-forest uppercase">{current.name}</h3>
          <p className="font-serif text-lg text-ink/85">{current.flavour}</p>
          <Link
            href={`/shop/${current.slug}`}
            className="mx-auto mt-4 flex h-12 max-w-[17rem] items-center justify-center rounded-full bg-forest font-display text-sm font-semibold tracking-wide text-cream-light uppercase transition-colors hover:bg-forest-light"
          >
            View details
            <span className="sr-only">: {`${current.name} ${current.flavour ?? ''}`.trim()}</span>
          </Link>
        </div>

        <div className="mt-5 flex items-center justify-center gap-4 md:mt-6">
          <div className="flex items-center gap-2.5" role="group" aria-label="Choose a cup">
            {products.map((p, i) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setActive(i)}
                aria-label={`Show ${p.name} ${p.flavour ?? ''}`.trim()}
                aria-current={i === active ? 'true' : undefined}
                className={cn('size-2.5 rounded-full transition-all', i === active ? 'scale-125 bg-forest' : 'bg-forest/25 hover:bg-forest/50')}
              />
            ))}
          </div>
          {!still && length > 1 ? (
            <button
              type="button"
              onClick={() => setStopped((s) => !s)}
              aria-label={stopped ? 'Play the carousel' : 'Pause the carousel'}
              className="grid size-7 place-items-center rounded-full text-forest/70 ring-1 ring-forest/20 transition hover:bg-cream-light hover:text-forest"
            >
              {stopped ? <Play size={12} fill="currentColor" aria-hidden /> : <Pause size={12} fill="currentColor" aria-hidden />}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
