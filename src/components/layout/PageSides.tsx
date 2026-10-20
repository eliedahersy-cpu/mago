import { cn } from '@/lib/cn';

/**
 * The painted leaf-and-arch sides from the approved artwork, repeated down every page behind the content.
 * Each tile fades to the page cream at its top and bottom, and the strip fades out towards the content,
 * so there are no hard joins. Shown from 900px wide, starting below the header.
 */
const strip =
  'pointer-events-none absolute top-[118px] bottom-0 -z-10 hidden w-[260px] bg-[length:260px_auto] bg-repeat-y min-[900px]:block';

export function PageSides({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-0 flex-1 flex-col">
      <div
        aria-hidden
        className={cn(strip, "left-0 bg-[url('/images/sides/left.webp')] bg-left-top [mask-image:linear-gradient(to_right,#000_70%,transparent)]")}
      />
      <div
        aria-hidden
        className={cn(strip, "right-0 bg-[url('/images/sides/right.webp')] bg-right-top [mask-image:linear-gradient(to_left,#000_70%,transparent)]")}
      />
      {children}
    </div>
  );
}
