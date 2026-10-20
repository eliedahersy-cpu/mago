'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

/**
 * The painted sides from the approved designs, in front of the page blocks at both edges (as in the
 * mockups), with the content kept between them. Recipes pages use the recipes pattern; every other page
 * uses the leaf-and-arch pattern. Each tile fades into the page cream at its joins, so the strips run on
 * from below the header to the footer without hard edges. Shown from 900px wide.
 */
const strip =
  'pointer-events-none absolute top-[118px] bottom-0 z-30 hidden w-[160px] bg-[length:160px_auto] bg-repeat-y min-[900px]:block';

export function PageSides({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const set = pathname.startsWith('/recipes') ? 'recipes-' : '';
  return (
    <div className="relative isolate flex min-h-0 flex-1 flex-col">
      <div
        aria-hidden
        style={{ backgroundImage: `url(/images/sides/${set}left.webp)` }}
        className={cn(strip, 'left-0 bg-left-top [mask-image:linear-gradient(to_right,#000_88%,transparent)]')}
      />
      <div
        aria-hidden
        style={{ backgroundImage: `url(/images/sides/${set}right.webp)` }}
        className={cn(strip, 'right-0 bg-right-top [mask-image:linear-gradient(to_left,#000_88%,transparent)]')}
      />
      {children}
    </div>
  );
}
