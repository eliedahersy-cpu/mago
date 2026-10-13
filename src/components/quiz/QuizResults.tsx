'use client';

import { RotateCcw, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode, Ref } from 'react';
import { ArchDecor, LeafSprig, ScriptNote, SunMark } from '@/components/brand/Decor';
import { WishlistButton } from '@/components/product/WishlistButton';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { toCartProduct } from '@/lib/cart/lines';
import { useCart } from '@/lib/cart/store';
import { isPurchasable } from '@/lib/catalog/stock';
import { cn } from '@/lib/cn';
import type { Product } from '@/lib/types';

type Tone = 'terracotta' | 'saffron' | 'forest';

const badgeTone: Record<Tone, string> = {
  terracotta: 'bg-terracotta text-white',
  saffron: 'bg-sun text-forest',
  forest: 'bg-forest text-white',
};

const TONES: Tone[] = ['terracotta', 'saffron', 'forest'];

export function packshot(product: Product): string | null {
  return (product.images.find((i) => i.kind === 'packshot') ?? product.images[0])?.url ?? null;
}

function lifestyle(product: Product): string | null {
  return product.images.find((i) => i.kind === 'lifestyle')?.url ?? null;
}

const fullName = (p: Product) => [p.name, p.flavour].filter(Boolean).join(' ');

function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cn('inline-block rounded-full px-2 py-1 font-display text-[9px] leading-none font-bold tracking-wide uppercase sm:px-2.5 sm:text-[10px] md:text-[11px]', badgeTone[tone])}>
      {children}
    </span>
  );
}

const cardShell =
  'relative flex w-[46vw] max-w-[230px] shrink-0 snap-start flex-col rounded-2xl bg-cream-light p-3 shadow-[0_8px_24px_rgba(40,53,28,0.08)] ring-1 ring-forest/10 sm:w-auto sm:max-w-none';

/** A recommended cup: badge, wishlist heart, packshot, rating, tagline and Add to cart. */
function MatchCard({ product, badge, tone }: { product: Product; badge: string; tone: Tone }) {
  const add = useCart((s) => s.add);
  const image = packshot(product);
  const buyable = isPurchasable(product);
  return (
    <article data-testid="match-card" className={cardShell}>
      <div className="flex items-start justify-between gap-2">
        <Badge tone={tone}>{badge}</Badge>
        <WishlistButton productId={product.id} label={fullName(product)} className="-mt-1 -mr-1 size-8 bg-transparent shadow-none ring-0" />
      </div>
      <Link href={`/shop/${product.slug}`} className="relative mt-1 block aspect-[5/4]" aria-label={fullName(product)}>
        {image ? <Image src={image} alt="" fill sizes="(min-width: 1024px) 220px, 46vw" className="object-contain mix-blend-multiply" /> : null}
      </Link>
      {product.ratingCount > 0 ? <StarRating avg={product.ratingAvg} count={product.ratingCount} className="mt-1" /> : null}
      <p className="mt-1 font-display text-sm leading-tight font-bold text-forest md:text-base">
        {product.name}
        <span className="block font-sans text-xs font-medium text-ink/80 md:text-[13px]">{product.flavour}</span>
      </p>
      {product.tagline ? <p className="mt-1 line-clamp-2 text-xs leading-snug text-ink/75 md:text-[13px]">{product.tagline}</p> : null}
      <div className="mt-auto pt-3">
        <Button size="sm" className="w-full" disabled={!buyable} onClick={() => add(toCartProduct(product))}>
          {buyable ? 'Add to cart' : 'Sold out'}
        </Button>
      </div>
    </article>
  );
}

/** What the results will hold, shown before the quiz starts. */
function PreviewCard({ badge, tone, image, title, body }: { badge: string; tone: Tone; image: string; title: string; body: string }) {
  return (
    <article className="relative flex min-w-0 flex-col rounded-2xl bg-cream-light p-2 shadow-[0_8px_24px_rgba(40,53,28,0.08)] ring-1 ring-forest/10 sm:p-3">
      <div className="leading-none">
        <Badge tone={tone}>{badge}</Badge>
      </div>
      <div className="relative mt-2 aspect-[5/4]">
        <Image src={image} alt="" fill sizes="(min-width: 1024px) 220px, 31vw" className="object-contain mix-blend-multiply" />
      </div>
      <p className="mt-2 font-display text-xs leading-tight font-bold text-forest sm:text-sm md:text-base">{title}</p>
      <p className="mt-1 hidden text-xs leading-snug text-ink/75 sm:block md:text-[13px]">{body}</p>
    </article>
  );
}

export type ResultsPhase = 'intro' | 'quiz' | 'done';

export interface MixEntry {
  product: Product;
  quantity: number;
}

/**
 * The band under the questions. Before the quiz it explains what the results hold; during the quiz it
 * previews the best matches for the answers so far; at the end it offers the 5-cup mix and a retake.
 */
export function QuizResults({
  phase,
  picks,
  eyebrow,
  title,
  body,
  sample,
  mix,
  boxSize,
  canAddAll,
  addedAll,
  bestValue,
  onAddAll,
  onRetake,
  headingRef,
}: {
  phase: ResultsPhase;
  picks: { product: Product; badge: string }[];
  eyebrow: string;
  title: string;
  body: string;
  /** Cups shown on the preview cards before the quiz starts. */
  sample: Product[];
  mix: MixEntry[];
  boxSize: number;
  canAddAll: boolean;
  addedAll: boolean;
  bestValue: boolean;
  onAddAll: () => void;
  onRetake: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const hero = phase === 'intro' ? sample[0] : picks[0]?.product;
  const heroPhoto = hero ? (phase === 'intro' ? null : lifestyle(hero)) : null;
  const heroPack = hero ? packshot(hero) : null;

  return (
    <section
      aria-labelledby="quiz-results-title"
      className="relative isolate scroll-mt-24 overflow-hidden bg-[linear-gradient(180deg,#f4ecd5_0%,#efe6cb_100%)]"
    >
      <LeafSprig className="pointer-events-none absolute -top-6 -right-4 -z-10 hidden w-36 rotate-[30deg] text-leaf/80 md:block" />
      <ArchDecor tone="peach" className="pointer-events-none absolute -right-8 -bottom-16 -z-10 w-28 opacity-60 md:w-40" />

      <div className="mx-auto grid max-w-7xl lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)_minmax(0,2.1fr)] lg:grid-rows-[1fr_auto]">
        <figure className="relative hidden overflow-hidden lg:row-span-2 lg:block lg:min-h-[360px]">
          {heroPhoto ? (
            <Image src={heroPhoto} alt="" fill sizes="25vw" className="object-cover" />
          ) : heroPack ? (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_70%,#f7d9b0_0%,#efe6cb_70%)]">
              <Image src={heroPack} alt="" fill sizes="25vw" className="object-contain object-bottom p-6 pt-20 mix-blend-multiply" />
            </div>
          ) : null}
          <ScriptNote arrow="down" className="absolute top-6 left-5 -rotate-6 text-xl text-forest drop-shadow-[0_1px_0_#fff]">
            {phase === 'intro' ? (
              <>
                Your personalised
                <br />
                MAGO selection
              </>
            ) : (
              <>
                Same pasta.
                <br />
                More possibilities.
              </>
            )}
          </ScriptNote>
        </figure>

        <div className="px-5 pt-8 md:px-10 lg:col-start-2 lg:row-start-1 lg:self-end lg:pt-10 lg:pr-4 lg:pl-8">
          <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-forest uppercase md:text-sm">
            {eyebrow}
            <SunMark className="w-7" />
          </p>
          <h2
            id="quiz-results-title"
            ref={headingRef}
            tabIndex={-1}
            className="mt-1 font-display text-[1.9rem] leading-[0.95] font-bold text-forest uppercase outline-none md:text-[2.6rem]"
          >
            {title}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/80 md:text-base">{body}</p>
        </div>

        <div
          className={cn(
            'px-5 pt-5 pb-2 sm:grid sm:grid-cols-3 sm:gap-3 md:px-10 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:self-center lg:py-10 lg:pr-10 lg:pl-4',
            phase === 'intro' ? 'grid grid-cols-3 gap-2' : 'flex snap-x gap-3 overflow-x-auto [scrollbar-width:none] sm:overflow-visible',
          )}
        >
          {phase === 'intro'
            ? [
                { badge: 'Your top match', tone: 'terracotta' as const, image: sample[0] ? packshot(sample[0]) : null, title: 'Primary Match', body: 'Your best flavour match based on your answers.' },
                { badge: 'Great alternatives', tone: 'saffron' as const, image: sample[1] ? packshot(sample[1]) : null, title: 'Alternative Options', body: 'Other flavours you’ll love too.' },
                { badge: `Your ${boxSize}-cup mix`, tone: 'forest' as const, image: '/products/mago-mix-box-open.webp', title: 'Suggested Mix & Match', body: `A curated ${boxSize}-cup box made for you.` },
              ].map((c) => (c.image ? <PreviewCard key={c.badge} {...c} image={c.image} /> : null))
            : picks.map((p, i) => <MatchCard key={p.product.id} product={p.product} badge={p.badge} tone={TONES[i] ?? 'forest'} />)}
        </div>

        {phase === 'done' ? (
          <div className="px-5 pt-4 pb-8 md:px-10 lg:col-start-2 lg:row-start-2 lg:pt-5 lg:pr-4 lg:pb-10 lg:pl-8">
            <p className="text-xs font-bold tracking-wide text-forest uppercase">Your {boxSize}-cup mix</p>
            <ul className="mt-2 flex flex-wrap gap-2" aria-label={`Your ${boxSize}-cup mix`}>
              {mix.map(({ product, quantity }) => (
                <li key={product.id} className="relative size-12 rounded-xl bg-cream-light ring-1 ring-forest/10" title={fullName(product)}>
                  {packshot(product) ? (
                    <Image src={packshot(product)!} alt={fullName(product)} fill sizes="48px" className="object-contain p-0.5 mix-blend-multiply" />
                  ) : null}
                  {quantity > 1 ? (
                    <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-forest text-[10px] font-bold text-white">
                      ×{quantity}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            {bestValue ? <p className="mt-2 text-xs text-ink/75">Best value: all {boxSize} cups come together in one Mix Box.</p> : null}
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-1 lg:max-w-xs">
              <Button onClick={onAddAll} disabled={!canAddAll} className="px-3">
                <ShoppingBag size={17} aria-hidden /> Add all to cart
              </Button>
              <Button variant="outline" onClick={onRetake} className="px-3">
                <RotateCcw size={17} aria-hidden /> Retake quiz
              </Button>
            </div>
            <p role="status" className="mt-2 min-h-5 text-sm font-medium text-forest">
              {addedAll ? `Your ${boxSize}-cup Mix Box is in your cart.` : !canAddAll ? 'Not enough cups in stock to fill a Mix Box right now.' : ''}
            </p>
          </div>
        ) : (
          <div className="pb-6 lg:hidden" />
        )}
      </div>
    </section>
  );
}
