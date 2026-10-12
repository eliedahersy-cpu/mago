'use client';

import { Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { Button } from '@/components/ui/Button';
import type { BoxCup } from '@/lib/cart/lines';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { remainingSlots } from '@/lib/mix-box/box';
import { useMixBox } from '@/lib/mix-box/store';
import { useHydratedMixBox } from '@/lib/mix-box/use-mix-box';

/** What the builder needs to know about a cup (kept small: it is sent to the browser). */
export interface PickerCup extends Omit<BoxCup, 'quantity'> {
  description: string | null;
  purchasable: boolean;
}

export function CupPicker({ cups, size }: { cups: PickerCup[]; size: number }) {
  const hydrated = useHydratedMixBox();
  const box = useMixBox((s) => s.cups);
  const add = useMixBox((s) => s.add);
  const setQuantity = useMixBox((s) => s.setQuantity);
  const remaining = remainingSlots(box, size);

  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-6">
      {cups.map(({ description, purchasable, ...cup }) => {
        const inBox = hydrated ? (box.find((c) => c.productId === cup.productId)?.quantity ?? 0) : 0;
        const label = `${cup.name} ${cup.flavour ?? ''}`.trim();
        const href = `/shop/${cup.slug}`;
        return (
          <li key={cup.productId}>
            <article
              data-testid={`cup-card-${cup.slug}`}
              className={cn(
                'flex h-full flex-col rounded-2xl bg-cream-light p-3 shadow-sm ring-1 ring-forest/5 transition-shadow',
                inBox > 0 && 'shadow-md ring-2 ring-forest',
              )}
            >
              <Link href={href} tabIndex={-1} aria-hidden className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-cream-dark/50">
                {cup.image ? (
                  <Image
                    src={cup.image}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 15vw, (min-width: 768px) 30vw, 45vw"
                    className="object-contain p-3 mix-blend-multiply"
                  />
                ) : null}
                {inBox > 0 ? (
                  <span className="absolute top-2 right-2 rounded-full bg-forest px-2 py-0.5 font-display text-xs font-bold text-cream-light">
                    ×{inBox} in box
                  </span>
                ) : null}
              </Link>
              <h3 className="mt-3 font-display leading-tight font-semibold text-forest">
                <Link href={href} className="hover:text-terracotta">
                  {cup.name}
                  {cup.flavour ? <span className="block">{cup.flavour}</span> : null}
                </Link>
              </h3>
              {description ? <p className="mt-1 line-clamp-3 text-sm text-ink/70">{description}</p> : null}
              <div className="mt-auto pt-3">
                <p className="font-display text-lg font-bold text-forest">{formatPrice(cup.unitPrice)}</p>
                {inBox > 0 ? (
                  <QuantityStepper
                    size="sm"
                    label={`Quantity of ${label} in your box`}
                    value={inBox}
                    min={0}
                    max={inBox + remaining}
                    onChange={(n) => setQuantity(cup.productId, n, size)}
                    className="mt-2 flex w-full justify-between"
                  />
                ) : (
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    disabled={!hydrated || !purchasable || remaining === 0}
                    aria-label={!purchasable ? 'Sold out' : remaining === 0 ? 'Box full' : `Add ${label} to your box`}
                    onClick={() => add(cup, size)}
                  >
                    {!purchasable ? (
                      'Sold out'
                    ) : remaining === 0 ? (
                      'Box full'
                    ) : (
                      <>
                        <Plus size={16} aria-hidden /> Add
                      </>
                    )}
                  </Button>
                )}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
