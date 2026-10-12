'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Button, ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { boxCount } from '@/lib/mix-box/box';
import { useMixBox } from '@/lib/mix-box/store';
import { useHydratedMixBox } from '@/lib/mix-box/use-mix-box';

const reviewClass = 'h-9 px-4 text-xs md:h-11 md:px-6 md:text-sm';

/**
 * Sticky progress tray under the cup grid: the slots, the count and the way to review.
 * Phones get two short rows (count + clear, then slots + review); wider screens one row.
 */
export function BoxTray({ size, className }: { size: number; className?: string }) {
  const hydrated = useHydratedMixBox();
  const cups = useMixBox((s) => s.cups);
  const clear = useMixBox((s) => s.clear);
  const count = hydrated ? boxCount(cups) : 0;
  const slots = hydrated ? cups.flatMap((c) => Array.from({ length: c.quantity }, () => c)) : [];
  const missing = Math.max(0, size - count);
  const full = missing === 0;

  return (
    <div
      data-testid="box-tray"
      className={cn('sticky bottom-3 z-20 rounded-3xl bg-forest px-4 py-3 text-cream-light shadow-xl md:p-4', className)}
    >
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 md:flex md:gap-5">
        <ul className="order-3 flex items-center gap-1 md:order-none md:gap-2" aria-label="Cups in your box">
          {Array.from({ length: size }, (_, i) => {
            const cup = slots[i];
            return (
              <li
                key={i}
                className={cn(
                  'relative flex size-8 items-center justify-center overflow-hidden rounded-full md:size-14',
                  cup ? 'bg-cream-light' : 'border-2 border-dashed border-cream-light/40 text-cream-light/60',
                )}
              >
                {cup?.image ? (
                  <Image src={cup.image} alt={`${cup.name} ${cup.flavour ?? ''}`.trim()} fill sizes="56px" className="object-contain p-1 mix-blend-multiply" />
                ) : (
                  <span className="font-display text-xs font-bold md:text-sm" aria-hidden>
                    {i + 1}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <div className="order-1 min-w-0 md:order-none md:flex-1">
          <p className="font-display font-bold uppercase md:text-lg">
            Your box{' '}
            <span data-testid="box-count" className="text-sun tabular-nums">
              {count}/{size}
            </span>
          </p>
          <p className="hidden text-sm text-cream-light/80 md:block" aria-live="polite">
            {full ? 'Your box is full. Time to review it!' : `Add ${missing} more cup${missing === 1 ? '' : 's'} to complete your box.`}
          </p>
        </div>
        <div className="order-2 justify-self-end md:order-none">
          {count > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="text-xs font-medium text-cream-light/80 underline-offset-4 hover:text-cream-light hover:underline md:text-sm"
            >
              Clear box
            </button>
          ) : null}
        </div>
        <div className="order-4 justify-self-end md:order-none">
          {full ? (
            <ButtonLink href="/mix-box/review" variant="light" className={reviewClass}>
              <span className="md:hidden">Review</span>
              <span className="hidden md:inline">Review my box</span> <ArrowRight size={16} aria-hidden />
            </ButtonLink>
          ) : (
            <Button variant="light" disabled className={reviewClass}>
              <span className="md:hidden">Review</span>
              <span className="hidden md:inline">Review my box</span> <ArrowRight size={16} aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
