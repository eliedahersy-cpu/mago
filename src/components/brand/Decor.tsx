import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Half sun with rays, as in the MAGO logo. Colour via `text-*` (default sun). */
export function SunMark({ className }: { className?: string }) {
  const rays = Array.from({ length: 9 }, (_, i) => {
    const angle = Math.PI - (i * Math.PI) / 8;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x1: 60 + 46 * cos, y1: 60 - 46 * sin, x2: 60 + 58 * cos, y2: 60 - 58 * sin };
  });
  return (
    <svg viewBox="0 0 120 64" className={cn('text-sun', className)} aria-hidden fill="none">
      <path d="M24 62a36 36 0 0 1 72 0Z" fill="currentColor" />
      {rays.map((r, i) => (
        <line key={i} {...r} stroke="currentColor" strokeWidth={6} strokeLinecap="round" />
      ))}
    </svg>
  );
}

const archTones = {
  terracotta: ['#c14120', '#e0754f', '#f2dcbc'],
  forest: ['#0d4a39', '#3e7a3a', '#f2dcbc'],
  saffron: ['#f0900f', '#f6b52a', '#f9e9d1'],
  peach: ['#e48d63', '#f2b48c', '#f8e2c8'],
  sage: ['#6f9a7c', '#a9c4a6', '#eef0dc'],
} as const;

/** Nested Mediterranean arch used as background decoration. */
export function ArchDecor({ tone = 'terracotta', className }: { tone?: keyof typeof archTones; className?: string }) {
  const [a, b, c] = archTones[tone];
  return (
    <svg viewBox="0 0 100 140" className={className} aria-hidden>
      <path d="M0 140V50a50 50 0 0 1 100 0v90Z" fill={a} />
      <path d="M14 140V54a36 36 0 0 1 72 0v86Z" fill={b} />
      <path d="M28 140V58a22 22 0 0 1 44 0v82Z" fill={c} />
    </svg>
  );
}

/** Leafy branch (olive/basil style). Colour via `text-*` (default leaf). */
export function LeafSprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 160" className={cn('text-leaf', className)} aria-hidden fill="currentColor">
      <path d="M40 158C40 110 38 62 44 6" stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M40 132C22 126 10 112 8 94c18 4 30 18 32 38Z" />
      <path d="M41 116c16-8 26-22 26-40-16 6-26 20-26 40Z" />
      <path d="M40 92C24 86 14 72 14 56c16 4 26 18 26 36Z" />
      <path d="M42 70c14-8 22-20 22-36-14 6-22 18-22 36Z" />
      <path d="M43 40C32 34 26 22 28 8c11 5 16 17 15 32Z" />
    </svg>
  );
}

/** Handwritten annotation with a curved arrow, e.g. "Same pasta. More possibilities." */
export function ScriptNote({
  children,
  arrow = 'left',
  className,
}: {
  children: ReactNode;
  arrow?: 'left' | 'right' | 'down';
  className?: string;
}) {
  const svg = (
    <svg
      viewBox="0 0 60 40"
      className={cn('h-8 w-12 shrink-0', arrow === 'right' && '-scale-x-100', arrow === 'down' && 'rotate-[-70deg]')}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M56 6C42 28 22 34 7 30" />
      <path d="M14 23 6 30l10 4" />
    </svg>
  );
  return (
    <span className={cn('inline-flex items-end gap-1 font-script text-2xl leading-tight text-ink', className)}>
      {arrow === 'left' ? svg : null}
      <span>{children}</span>
      {arrow !== 'left' ? svg : null}
    </span>
  );
}
