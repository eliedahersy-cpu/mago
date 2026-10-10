'use client';

import { Minus, Plus } from 'lucide-react';
import { MAX_LINE_QTY } from '@/lib/cart/lines';
import { cn } from '@/lib/cn';

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = MAX_LINE_QTY,
  label,
  size = 'md',
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const btn = cn(
    'flex items-center justify-center text-forest transition-colors hover:bg-forest/10 disabled:opacity-40',
    size === 'sm' ? 'size-8' : 'size-11',
  );
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex items-center rounded-full border border-forest/20 bg-white', className)}
    >
      <button type="button" aria-label="Decrease quantity" className={cn(btn, 'rounded-l-full')} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus size={size === 'sm' ? 14 : 16} aria-hidden />
      </button>
      <output aria-live="polite" className={cn('min-w-8 text-center font-semibold tabular-nums', size === 'sm' ? 'text-sm' : 'text-base')}>
        {value}
      </output>
      <button type="button" aria-label="Increase quantity" className={cn(btn, 'rounded-r-full')} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus size={size === 'sm' ? 14 : 16} aria-hidden />
      </button>
    </div>
  );
}
