'use client';

import { ArrowRight, Gift, NotebookPen, Pencil, Refrigerator, ShieldCheck, Trash2, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { useCart } from '@/lib/cart/store';
import { formatPrice } from '@/lib/format';
import { boxCount, boxSubtotal, remainingSlots } from '@/lib/mix-box/box';
import { mixHighlights } from '@/lib/mix-box/highlights';
import { useMixBox } from '@/lib/mix-box/store';
import { useHydratedMixBox } from '@/lib/mix-box/use-mix-box';
import { estimateTotals } from '@/lib/pricing/estimate';
import type { AutomaticDiscount } from '@/lib/types';
import { WhyThisMix } from './WhyThisMix';

export interface ReviewBundle {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
}

export interface ReviewCupInfo {
  ratingAvg: number | null;
  ratingCount: number;
  flavourProfiles: string[];
}

interface Props {
  size: number;
  bundle: ReviewBundle | null;
  cupInfo: Record<string, ReviewCupInfo>;
  discount: AutomaticDiscount | null;
  shippingFlatFee: number;
  freeShippingThreshold: number;
}

const perks = [
  { icon: ShieldCheck, label: 'Pay on delivery' },
  { icon: Refrigerator, label: 'Refrigerator safe' },
  { icon: Truck, label: 'Delivery across Lebanon' },
];

export function MixBoxReview({ size, bundle, cupInfo, discount, shippingFlatFee, freeShippingThreshold }: Props) {
  const router = useRouter();
  const hydrated = useHydratedMixBox();
  const cups = useMixBox((s) => s.cups);
  const setQuantity = useMixBox((s) => s.setQuantity);
  const remove = useMixBox((s) => s.remove);
  const clearBox = useMixBox((s) => s.clear);
  const addBox = useCart((s) => s.addBox);
  const setOrderNotes = useCart((s) => s.setOrderNotes);
  const [instructions, setInstructions] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [giftNote, setGiftNote] = useState('');

  if (!hydrated) {
    return <p className="py-16 text-center text-ink/70">Loading your box…</p>;
  }

  const count = boxCount(cups);
  if (count === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="font-display text-2xl font-bold text-forest">Your Mix Box is empty</p>
        <p className="mt-2 text-ink/70">Pick {size} cups to build your box.</p>
        <ButtonLink href="/mix-box" className="mt-6">
          Start mixing <ArrowRight size={18} aria-hidden />
        </ButtonLink>
      </div>
    );
  }

  const remaining = remainingSlots(cups, size);
  const subtotal = boxSubtotal(cups);
  const totals = estimateTotals({ cupSubtotal: subtotal, cupCount: count, otherSubtotal: 0, discount, shippingFlatFee, freeShippingThreshold });
  const ready = remaining === 0 && bundle !== null;
  const highlights = mixHighlights(cups.map((c) => ({ ...c, flavourProfiles: cupInfo[c.productId]?.flavourProfiles ?? [] })));

  function commit(): boolean {
    if (!ready || !bundle) return false;
    addBox({ ...bundle, cups }, { open: false });
    setOrderNotes({ instructions: instructions.trim(), isGift: isGift || giftNote.trim() !== '', giftNote: giftNote.trim() });
    clearBox();
    return true;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
      <div className="space-y-6">
        <section aria-labelledby="box-contents" className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id="box-contents" className="font-display text-2xl leading-none font-bold text-forest">
              What&apos;s in your box
            </h2>
            <ButtonLink href="/mix-box" variant="outline" size="sm">
              <Pencil size={14} aria-hidden /> Edit my box
            </ButtonLink>
          </div>
          <ul className="mt-4 divide-y divide-forest/10">
            {cups.map((cup) => {
              const label = `${cup.name} ${cup.flavour ?? ''}`.trim();
              const info = cupInfo[cup.productId];
              return (
                <li
                  key={cup.productId}
                  data-testid="box-row"
                  className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-x-3 gap-y-2 py-3 sm:flex"
                >
                  <Link href={`/shop/${cup.slug}`} className="relative row-span-2 size-14 shrink-0 rounded-xl bg-cream-dark/50">
                    {cup.image ? <Image src={cup.image} alt="" fill sizes="56px" className="object-contain p-1 mix-blend-multiply" /> : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="font-display leading-tight font-semibold text-forest">
                      {cup.name} <span className="block font-medium text-ink/80 sm:inline sm:font-semibold sm:text-forest">{cup.flavour}</span>
                    </p>
                    {info ? <StarRating avg={info.ratingAvg} count={info.ratingCount} className="mt-0.5 hidden sm:flex" /> : null}
                  </div>
                  <span className="text-right font-semibold text-forest tabular-nums sm:w-14">{formatPrice(cup.unitPrice)}</span>
                  <QuantityStepper
                    size="sm"
                    label={`Quantity of ${label} in your box`}
                    value={cup.quantity}
                    max={cup.quantity + remaining}
                    onChange={(n) => setQuantity(cup.productId, n, size)}
                    className="justify-self-start"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${label} from your box`}
                    onClick={() => remove(cup.productId)}
                    className="rounded-full p-1.5 text-ink/50 hover:bg-forest/10 hover:text-terracotta"
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-label="Order notes" className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5">
            <label htmlFor="special-instructions" className="flex items-center gap-2 font-display font-semibold text-forest">
              <NotebookPen size={18} aria-hidden /> Special instructions <span className="font-sans text-sm font-normal text-ink/60">(optional)</span>
            </label>
            <textarea
              id="special-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="e.g. leave at front door, ring bell, etc."
              className="mt-3 w-full resize-none rounded-2xl border border-forest/15 bg-white px-4 py-3 text-sm focus:border-forest focus:outline-none"
            />
          </div>
          <div className="rounded-3xl bg-leaf/10 p-5 ring-1 ring-leaf/20">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="gift-note" className="flex items-center gap-2 font-display font-semibold text-forest">
                <Gift size={18} aria-hidden /> Gift note <span className="font-sans text-sm font-normal text-ink/60">(optional)</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-ink/80">
                <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} className="size-4 accent-forest" />
                This is a gift
              </label>
            </div>
            <textarea
              id="gift-note"
              value={giftNote}
              onChange={(e) => setGiftNote(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Write a short note to include with your order…"
              className="mt-3 w-full resize-none rounded-2xl border border-forest/15 bg-white px-4 py-3 text-sm focus:border-forest focus:outline-none"
            />
          </div>
        </section>
      </div>

      <div className="space-y-6 lg:sticky lg:top-28">
        <section aria-labelledby="order-summary" className="rounded-3xl bg-cream-light p-5 shadow-md ring-1 ring-forest/5 md:p-6">
          <h2 id="order-summary" className="font-display text-2xl leading-none font-bold text-forest">
            Order summary
          </h2>
          <div className="mt-3 flex items-center justify-between border-b border-forest/10 pb-3 text-sm">
            <span data-testid="summary-count">
              {count} {count === 1 ? 'cup' : 'cups'} selected
            </span>
            <Link href="/mix-box" className="font-semibold text-forest underline underline-offset-4">
              Edit
            </Link>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(totals.subtotal)}</dd>
            </div>
            {totals.discount > 0 ? (
              <div className="flex justify-between text-leaf">
                <dt>{discount?.title ?? 'Discount'}</dt>
                <dd className="tabular-nums">−{formatPrice(totals.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd className="tabular-nums">{totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-forest/10 pt-3 font-display text-xl font-bold text-forest">
              <dt>Total</dt>
              <dd data-testid="summary-total" className="tabular-nums">
                {formatPrice(totals.total)}
              </dd>
            </div>
          </dl>
          {remaining > 0 ? (
            <p className="mt-3 rounded-2xl bg-saffron/15 px-4 py-2 text-sm text-ink" role="status">
              Add {remaining} more {remaining === 1 ? 'cup' : 'cups'} to complete your box.{' '}
              <Link href="/mix-box" className="font-semibold text-forest underline underline-offset-4">
                Back to the builder
              </Link>
            </p>
          ) : null}
          {bundle === null ? (
            <p className="mt-3 rounded-2xl bg-terracotta/10 px-4 py-2 text-sm text-terracotta" role="alert">
              The Mix Box is unavailable right now.
            </p>
          ) : null}
          <Button size="lg" className="mt-4 w-full" disabled={!ready} onClick={() => commit() && router.push('/checkout')}>
            Proceed to checkout <ArrowRight size={18} aria-hidden />
          </Button>
          <Button variant="outline" className="mt-3 w-full" disabled={!ready} onClick={() => commit() && router.push('/shop')}>
            Add to cart &amp; keep shopping
          </Button>
          <p className="mt-3 text-center text-xs text-ink/60">Final total is confirmed at checkout.</p>
          <ul className="mt-4 grid grid-cols-3 gap-2 border-t border-forest/10 pt-4 text-center">
            {perks.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-1 text-xs font-medium text-forest">
                <Icon size={22} aria-hidden /> {label}
              </li>
            ))}
          </ul>
        </section>
        <WhyThisMix highlights={highlights} />
      </div>
    </div>
  );
}
