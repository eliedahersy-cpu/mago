import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const tones = {
  terracotta: 'bg-terracotta text-cream-light',
  saffron: 'bg-sun text-forest',
  forest: 'bg-forest text-cream-light',
} as const;

export function Badge({
  tone = 'terracotta',
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 font-display text-xs font-semibold tracking-wide uppercase',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProteinBadge({ grams = 30, className }: { grams?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`${grams} grams of protein per cup`}
      className={cn(
        'flex size-14 flex-col items-center justify-center rounded-full border-2 border-forest bg-white text-center font-display leading-none text-forest shadow-sm',
        className,
      )}
    >
      <span className="text-base font-bold">{grams}G</span>
      <span className="mt-0.5 text-[7px] font-semibold uppercase">
        Protein
        <br />
        per cup
      </span>
    </span>
  );
}
