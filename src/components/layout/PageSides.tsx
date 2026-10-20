import { ArchDecor, LeafSprig } from '@/components/brand/Decor';
import { cn } from '@/lib/cn';

/**
 * One repeating block of the side artwork, built from separate elements (arches, leaves, a sun-coloured
 * blob) instead of a picture, so it never has a seam or a stretched edge. Every block is the same height,
 * so the column runs on down the whole page.
 */
function Block({ flip }: { flip: boolean }) {
  return (
    <div className={cn('relative h-[640px] w-full shrink-0', flip && '-scale-x-100')}>
      <div className="absolute top-[4%] -left-10 h-40 w-40 rounded-full bg-[#fbd48a]/70 blur-[2px]" />
      <ArchDecor tone="terracotta" className="absolute top-[8%] -left-16 w-44 opacity-90" />
      <LeafSprig className="absolute top-[2%] left-14 w-24 -rotate-[25deg] text-leaf" />
      <ArchDecor tone="peach" className="absolute top-[40%] -left-12 w-36 opacity-90" />
      <LeafSprig className="absolute top-[34%] left-6 w-20 rotate-[160deg] text-forest-light" />
      <div className="absolute top-[62%] -left-12 h-32 w-32 rounded-full bg-[#f6a54b]/60" />
      <ArchDecor tone="sage" className="absolute top-[70%] -left-14 w-36 opacity-80" />
      <LeafSprig className="absolute top-[86%] left-10 w-24 rotate-[20deg] text-leaf" />
    </div>
  );
}

/** The right-hand block, in the style of the right side of the approved design: tall nested arches with a leafy vine along the edge. */
function Arch({ className, inner }: { className?: string; inner: string }) {
  return (
    <div className={cn('absolute rounded-t-full bg-[#d4502c] p-3', className)}>
      <div className="h-full rounded-t-full bg-[#fbe7c4] p-3">
        <div className={cn('h-full rounded-t-full', inner)} />
      </div>
    </div>
  );
}

function RightBlock() {
  return (
    <div className="relative h-[640px] w-full shrink-0">
      <div className="absolute top-[2%] right-10 h-36 w-36 rounded-full bg-[#fbd48a]/70" />
      <Arch className="top-[10%] -right-6 h-[300px] w-36" inner="bg-[#7f8f3e]" />
      <LeafSprig className="absolute top-[3%] right-2 w-28 rotate-[8deg] text-leaf" />
      <div className="absolute top-[56%] right-16 h-32 w-32 rounded-full bg-[#f6a54b]/60" />
      <Arch className="top-[58%] -right-8 h-[260px] w-40" inner="bg-[#f2a33a]" />
      <LeafSprig className="absolute top-[48%] right-1 w-24 -rotate-[12deg] text-forest-light" />
      <LeafSprig className="absolute top-[88%] right-3 w-28 rotate-[190deg] text-leaf" />
    </div>
  );
}

const strip = 'pointer-events-none absolute top-[118px] bottom-0 -z-10 hidden w-[240px] overflow-hidden min-[900px]:block';
const COUNT = 14;

/** Artwork down both sides of every page, behind the content (the parent must be `relative isolate`). */
export function PageSides({ children }: { children: React.ReactNode }) {
  const left = Array.from({ length: COUNT }, (_, i) => <Block key={i} flip={false} />);
  const right = Array.from({ length: COUNT }, (_, i) => <RightBlock key={i} />);
  return (
    <div className="relative isolate flex min-h-0 flex-1 flex-col">
      <div aria-hidden className={cn(strip, 'left-0')}>
        {left}
      </div>
      <div aria-hidden className={cn(strip, 'right-0')}>
        {right}
      </div>
      {children}
    </div>
  );
}
