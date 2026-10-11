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
import { Container } from '@/components/ui/Container';
import { StarRating } from '@/components/ui/StarRating';
import { toCartProduct } from '@/lib/cart/lines';
import { isPurchasable } from '@/lib/catalog/stock';
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
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_2fr] md:items-center">
      <div>
        <h3 className="font-display text-2xl leading-none font-bold text-forest uppercase">
          Real ingredients.
          <br />
          Bold flavours.
        </h3>
        {product.sauce ? <p className="mt-3 text-ink/80">{product.sauce}</p> : null}
      </div>
      <ul className="flex flex-wrap gap-2">
        {product.ingredients.map((ing) => (
          <li key={ing.name} className="flex items-center gap-1.5 rounded-full bg-cream px-4 py-2 text-sm font-medium text-forest">
            <Leaf size={14} aria-hidden /> {ing.name}
          </li>
        ))}
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

export function PreparationPanel({ product }: { product: Product }) {
  const lifestyle = product.images.find((i) => i.kind === 'lifestyle');
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
      {lifestyle ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image src={lifestyle.url} alt={lifestyle.alt} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
        </div>
      ) : null}
    </div>
  );
}

const occasionInfo: Record<string, { label: string; icon: typeof Home }> = {
  'quick-lunch': { label: 'A quick lunch', icon: Briefcase },
  'on-the-go': { label: 'On-the-go days', icon: Package },
  'at-home': { label: 'At home', icon: Home },
  'post-workout': { label: 'Post-workout fuel', icon: Dumbbell },
};

export function StoryPanel({ product }: { product: Product }) {
  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <p className="text-lg leading-relaxed text-ink/90">{product.story}</p>
      {product.occasions.length > 0 ? (
        <div>
          <h3 className="font-display text-lg font-bold text-forest uppercase">Perfect for</h3>
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {product.occasions.map((o) => {
              const info = occasionInfo[o];
              if (!info) return null;
              const Icon = info.icon;
              return (
                <li key={o} className="flex flex-col items-center gap-1 rounded-xl bg-cream p-3 text-center text-xs font-medium text-forest">
                  <Icon size={20} aria-hidden /> {info.label}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
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
