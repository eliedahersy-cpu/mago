import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'outline' | 'light' | 'ghost';
type Size = 'sm' | 'md' | 'lg';
type StyleProps = { variant?: Variant; size?: Size };

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold uppercase tracking-wide whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-forest text-cream-light hover:bg-forest-light',
  outline: 'border-2 border-forest text-forest hover:bg-forest hover:text-cream-light',
  light: 'bg-cream-light text-forest hover:bg-white',
  ghost: 'text-forest hover:bg-forest/10',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-base',
};

export function buttonVariants({ variant = 'primary', size = 'md' }: StyleProps = {}): string {
  return cn(base, variants[variant], sizes[size]);
}

export function Button({ variant, size, className, type = 'button', ...props }: ComponentProps<'button'> & StyleProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
