import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Droplets,
  Dumbbell,
  Hand,
  Home,
  Leaf,
  Package,
  Refrigerator,
  Shuffle,
  Timer,
  Truck,
  UtensilsCrossed,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ArchDecor, LeafSprig, ScriptNote } from '@/components/brand/Decor';
import { Container } from '@/components/ui/Container';
import { StarRating } from '@/components/ui/StarRating';
import { toCartProduct } from '@/lib/cart/lines';
import { cutoutImage } from '@/lib/catalog/cutout';
import { ingredientPhoto } from '@/lib/catalog/ingredient-icons';
import { isPurchasable } from '@/lib/catalog/stock';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import type { AutomaticDiscount, Product, Review } from '@/lib/types';
import { AddToCartButton } from './AddToCartButton';

export function PerksRow({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const perks = [
    { icon: Truck, label: `Free delivery on orders over ${formatPrice(freeShippingThreshold).replace('.00', '')}` },
    { icon: Refrigerator, label: 'Refrigerator safe after preparation' },
    { icon: Hand, label: 'Cash on delivery' },
  ];
  return (
    <ul className="grid gap-2 sm:grid-cols-3">
      {perks.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2 rounded-xl bg-cream-light px-3 py-2.5 text-xs font-medium text-forest ring-1 ring-forest/5">
          <Icon size={18} className="shrink-0" aria-hidden /> {label}
        </li>
      ))}
    </ul>
  );
}

export function UpsellStrip({ discount }: { discount: AutomaticDiscount }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-leaf/10 px-4 py-3">
      <Shuffle size={22} className="shrink-0 text-forest" aria-hidden />
      <div className="flex-1">
        <p className="text-sm font-semibold text-forest">
          Buy any {discount.minCupQuantity} cups and save {Number(discount.value)}%
        </p>
        <p className="text-xs text-ink/70">Mix and match your favourite flavours.</p>
      </div>
      <Link href="/mix-box" className="inline-flex items-center gap-1 font-display text-xs font-semibold whitespace-nowrap text-forest uppercase hover:text-terracotta">
        Build your box <ArrowRight size={14} aria-hidden />
      </Link>
    </div>
  );
}

export function IngredientsPanel({ product }: { product: Product }) {
  const names = product.ingredients.map((i) => i.name.toLowerCase());
  const blend = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? '');
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:items-center lg:gap-10">
      <div>
        <h3 className="font-display text-2xl leading-none font-bold text-forest uppercase md:text-3xl">
          Real ingredients.
          <br />
          Bold flavours.
        </h3>
        <p className="mt-3 text-ink/85">
          {product.sauce ? `${product.sauce}. ` : ''}A delicious blend of {blend}, made with real, simple ingredients.
        </p>
      </div>
      <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:flex md:flex-wrap md:justify-between md:gap-x-5">
        {product.ingredients.map((ing) => {
          const photo = ingredientPhoto(ing.name);
          return (
            <li key={ing.name} className="flex w-full flex-col items-center gap-2 text-center md:w-24">
              <span className="relative flex h-16 w-full items-end justify-center md:h-[4.5rem]">
                {photo ? (
                  <Image src={photo} alt="" fill sizes="96px" className="object-contain object-bottom" />
                ) : (
                  <span className="flex size-14 items-center justify-center rounded-full bg-cream-dark/70 text-forest">
                    <Leaf size={24} strokeWidth={1.6} aria-hidden />
                  </span>
                )}
              </span>
              <span className="text-xs leading-tight font-semibold text-forest md:text-[13px]">{ing.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function NutritionPanel({ product }: { product: Product }) {
  return (
    <div className="max-w-md">
      <dl className="divide-y divide-forest/10">
        {product.nutrition.map((row) => (
          <div key={row.label} className="flex justify-between py-2.5">
            <dt className="font-medium text-forest">{row.label}</dt>
            <dd className="text-ink/80">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-ink/60">Full nutrition facts are printed on each cup.</p>
    </div>
  );
}

const stepIcons = [Droplets, Package, UtensilsCrossed];

/** A photo of someone enjoying the cup when there is one, otherwise the shared lifestyle photo. */
export function preparationImage(product: Product): { url: string; alt: string } {
  const own = product.images.find((i) => i.kind === 'lifestyle' && /enjoying/i.test(i.alt));
  return own ? { url: own.url, alt: own.alt } : { url: '/images/lifestyle-lemon-office.webp', alt: 'Enjoying a MAGO pasta cup' };
}

/** Desktop "How to prepare" band, as in the design: the steps on a cream card over a photo. */
export function PreparationBanner({ product }: { product: Product }) {
  const photo = preparationImage(product);
  return (
    <section id="prepare" aria-labelledby="prepare-title" className="relative isolate hidden scroll-mt-24 overflow-hidden rounded-3xl bg-[linear-gradient(100deg,#f9e9d1_0%,#f4dcbb_100%)] md:block">
      <ArchDecor tone="peach" className="pointer-events-none absolute bottom-0 -left-6 -z-10 w-24 opacity-80" />
      <div className="absolute inset-y-0 right-0 -z-10 w-[64%] [mask-image:linear-gradient(to_right,transparent,#000_22%)]">
        <Image src={photo.url} alt="" fill sizes="(min-width: 1280px) 780px, 64vw" className="object-cover object-[50%_28%]" />
      </div>
      <div className="grid min-h-72 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="m-5 rounded-2xl bg-cream-light/95 p-6 shadow-sm backdrop-blur-sm lg:m-8 lg:p-8">
          <h2 id="prepare-title" className="font-display text-2xl font-bold text-forest uppercase md:text-3xl">
            How to prepare
          </h2>
          <ol className="mt-5 grid grid-cols-3 gap-3">
            {product.preparation.map((step, i) => {
              const Icon = stepIcons[i] ?? UtensilsCrossed;
              return (
                <li key={step.title} className="flex flex-col items-center gap-2 text-center">
                  <Icon size={30} strokeWidth={1.5} className="text-forest" aria-hidden />
                  <span className="text-sm font-semibold text-forest">
                    {i + 1}. {step.title}
                  </span>
                </li>
              );
            })}
          </ol>
          {product.prepMinutes ? (
            <p className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-forest">
              <Timer size={18} aria-hidden /> Ready in {product.prepMinutes === 4 ? '3–4' : product.prepMinutes} minutes
            </p>
          ) : null}
        </div>
        <ScriptNote arrow="down" className="mt-8 mr-8 hidden -rotate-6 self-start justify-self-end text-2xl text-cream-light drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)] lg:inline-flex">
          Same pasta.
          <br />
          More possibilities.
        </ScriptNote>
      </div>
    </section>
  );
}

export function PreparationPanel({ product }: { product: Product }) {
  const lifestyle = preparationImage(product);
  return (
    <div className="grid gap-6 md:grid-cols-2 md:items-center">
      <div>
        <h3 className="font-display text-2xl font-bold text-forest uppercase">How to prepare</h3>
        <ol className="mt-4 space-y-4">
          {product.preparation.map((step, i) => {
            const Icon = stepIcons[i] ?? UtensilsCrossed;
            return (
              <li key={step.title} className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest text-cream-light">
                  <Icon size={18} aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-forest">
                    {i + 1}. {step.title}
                  </p>
                  <p className="text-sm text-ink/80">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {product.prepMinutes ? (
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-forest">
            <Timer size={18} aria-hidden /> Ready in {product.prepMinutes === 4 ? '3–4' : product.prepMinutes} minutes
          </p>
        ) : null}
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
        <Image src={lifestyle.url} alt={lifestyle.alt} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover object-[50%_30%]" />
      </div>
    </div>
  );
}

const occasionInfo: Record<string, { label: string; icon: typeof Home }> = {
  'quick-lunch': { label: 'A quick lunch', icon: Briefcase },
  'on-the-go': { label: 'On-the-go days', icon: Package },
  'at-home': { label: 'At home', icon: Home },
  'post-workout': { label: 'Post-workout fuel', icon: Dumbbell },
};

/** The About tab: the flavour's story, a photo, what it is perfect for and a customer quote. */
export function StoryPanel({ product, review = null }: { product: Product; review?: Review | null }) {
  const lifestyles = product.images.filter((i) => i.kind === 'lifestyle');
  const photo = lifestyles.find((i) => !/enjoying/i.test(i.alt)) ?? lifestyles[0];
  const pack = product.images.find((i) => i.kind === 'packshot');
  const cutout = pack ? cutoutImage(pack.url) : null;
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.15fr_1fr] lg:gap-8">
      <div>
        <h3 className="font-display text-2xl leading-tight font-bold text-forest uppercase md:text-3xl">{product.tagline ?? 'Our story'}</h3>
        <p className="mt-3 leading-relaxed text-ink/85">{product.story}</p>
      </div>
      <div className="relative isolate aspect-[4/3] overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_65%,#fff4e2_0%,#f3dcbb_75%)]">
        {photo ? (
          <Image src={photo.url} alt={photo.alt || ''} fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover" />
        ) : cutout ? (
          <>
            <ArchDecor tone="terracotta" className="absolute -bottom-6 left-[8%] -z-10 w-[30%] opacity-80" />
            <LeafSprig className="absolute top-2 right-3 -z-10 w-[16%] rotate-[25deg] text-leaf" />
            <Image src={cutout} alt="" fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-contain p-5" />
          </>
        ) : null}
        <ScriptNote
          arrow="down"
          className={cn('absolute top-3 right-4 -rotate-6 text-lg', photo ? 'text-cream-light drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]' : 'text-forest')}
        >
          Same pasta.
          <br />
          More possibilities.
        </ScriptNote>
      </div>
      <div>
        {product.occasions.length > 0 ? (
          <>
            <h3 className="font-display text-lg font-bold text-forest uppercase">Perfect for</h3>
            <ul className="mt-3 grid grid-cols-4 gap-2">
              {product.occasions.map((o) => {
                const info = occasionInfo[o];
                if (!info) return null;
                const Icon = info.icon;
                return (
                  <li key={o} className="flex flex-col items-center gap-1 text-center text-[11px] leading-tight font-medium text-forest">
                    <Icon size={24} strokeWidth={1.6} aria-hidden /> {info.label}
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
        {review ? (
          <blockquote className="mt-5 rounded-2xl bg-cream p-4 text-sm leading-relaxed text-ink/85">
            <p>&ldquo;{review.body}&rdquo;</p>
            <footer className="mt-2 flex items-center gap-2 text-xs text-ink/70">
              <span className="tracking-wider text-saffron" role="img" aria-label={`Rated ${review.rating} out of 5`}>
                {'★'.repeat(review.rating)}
              </span>
              &mdash; {review.authorName}
            </footer>
          </blockquote>
        ) : null}
      </div>
    </div>
  );
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-ink/70">No reviews yet. Be the first to try it.</p>;
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-2xl bg-cream p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-forest">{r.authorName}</p>
            <StarRating avg={r.rating} count={1} className="[&>span:last-child]:hidden" />
          </div>
          {r.title ? <p className="mt-2 font-medium text-ink">{r.title}</p> : null}
          <p className="mt-1 text-sm text-ink/80">{r.body}</p>
        </li>
      ))}
    </ul>
  );
}

export function CompleteTheExperience({ mixBox, booklet }: { mixBox: Product | null; booklet: Product | null }) {
  if (!mixBox && !booklet) return null;
  return (
    <section aria-labelledby="complete-title">
      <h2 id="complete-title" className="font-display text-xl font-bold text-forest uppercase">
        Complete the experience
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {mixBox ? (
          <li className="flex items-center gap-4 rounded-2xl bg-cream-light p-3 ring-1 ring-forest/5">
            <div className="relative size-20 shrink-0">
              <Image src={mixBox.images[0]?.url ?? '/products/mago-mix-box.webp'} alt="" fill sizes="80px" className="object-contain" />
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold text-forest">{mixBox.name}</p>
              <p className="text-sm text-ink/70">5 cups. Your way.</p>
            </div>
            <Link href="/mix-box" className="inline-flex items-center gap-1 font-display text-xs font-semibold text-forest uppercase hover:text-terracotta">
              Build <ArrowRight size={14} aria-hidden />
            </Link>
          </li>
        ) : null}
        {booklet ? (
          <li className="flex items-center gap-4 rounded-2xl bg-cream-light p-3 ring-1 ring-forest/5">
            <span className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-cream text-forest">
              <BookOpen size={32} aria-hidden />
            </span>
            <div className="flex-1">
              <p className="font-display font-semibold text-forest">{booklet.name}</p>
              <p className="text-sm text-ink/70">
                {booklet.tagline} · {formatPrice(booklet.price)}
              </p>
            </div>
            <AddToCartButton product={toCartProduct(booklet)} disabled={!isPurchasable(booklet)} label="Add" />
          </li>
        ) : null}
      </ul>
    </section>
  );
}

export function SectionShell({ children }: { children: React.ReactNode }) {
  return <Container className="py-8">{children}</Container>;
}
