'use client';

import { cn } from '@/lib/cn';
import { boxCount } from '@/lib/mix-box/box';
import { useMixBox } from '@/lib/mix-box/store';
import { useHydratedMixBox } from '@/lib/mix-box/use-mix-box';

/** Hero progress: one circle per cup slot, filled as the box fills. */
export function BoxStepper({ size, className }: { size: number; className?: string }) {
  const hydrated = useHydratedMixBox();
  const count = useMixBox((s) => boxCount(s.cups));
  const filled = hydrated ? count : 0;
  const label = filled === 0 ? `Choose ${size} cups` : filled < size ? `${filled} of ${size} chosen` : 'Your box is full!';

  return (
    <div className={cn('flex flex-col items-center md:items-start', className)}>
      <ol className="flex items-center" aria-hidden>
        {Array.from({ length: size }, (_, i) => (
          <li key={i} className="flex items-center">
            {i > 0 ? <span className={cn('h-0.5 w-3 md:w-5', i < filled ? 'bg-forest' : 'bg-forest/25')} /> : null}
            <span
              className={cn(
                'flex size-10 items-center justify-center rounded-full border-2 font-display font-bold transition-colors md:size-12 md:text-lg',
                i < filled ? 'border-forest bg-forest text-cream-light' : 'border-terracotta/50 bg-cream-light text-forest',
              )}
            >
              {i + 1}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 font-medium text-ink/80" aria-live="polite">
        {label}
      </p>
    </div>
  );
}
