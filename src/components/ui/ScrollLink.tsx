'use client';

import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { buttonVariants } from './Button';

/**
 * A button-styled link to a spot on the same page. It scrolls every time it is pressed, including when the
 * address already ends in that #hash (a plain anchor does nothing the second time).
 */
export function ScrollLink({
  href,
  variant,
  size,
  bare = false,
  className,
  onClick,
  ...props
}: Omit<ComponentProps<'a'>, 'href'> & { href: `#${string}`; variant?: 'primary' | 'outline' | 'light' | 'ghost'; size?: 'sm' | 'md' | 'lg'; bare?: boolean }) {
  return (
    <a
      href={href}
      className={bare ? className : cn(buttonVariants({ variant, size }), className)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        const target = document.getElementById(href.slice(1));
        if (!target) return;
        e.preventDefault();
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(null, '', href);
      }}
      {...props}
    />
  );
}
