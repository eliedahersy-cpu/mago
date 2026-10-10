import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Pill({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-9 shrink-0 items-center rounded-full px-5 text-sm font-medium transition-colors',
        active ? 'bg-forest text-cream-light' : 'bg-cream-dark/70 text-ink hover:bg-cream-dark',
      )}
    >
      {children}
    </Link>
  );
}
