import { cn } from '@/lib/cn';

export type LeafTheme = 'lemon' | 'herbs';

/** Cups whose product-page design has its own side artwork; the rest use the herb leaves. */
export function leafThemeFor(slug: string): LeafTheme | null {
  if (slug === 'fusilli-spicy-muhammara') return null;
  return slug === 'fusilli-al-pesto-genovese' || slug === 'tagliolini-al-limone' ? 'lemon' : 'herbs';
}

const edge = 'pointer-events-none absolute inset-y-0 -z-10 hidden w-[max(0px,calc((100%-1140px)/2))] min-[1280px]:block';

/** Leaf artwork down both sides of the page on wide screens, as in the product-page designs. */
export function SideLeaves({ theme }: { theme: LeafTheme }) {
  const style = {
    backgroundImage: `url(/images/decor/leaves-${theme}.webp)`,
    backgroundRepeat: 'repeat-y',
    backgroundSize: '100% auto',
    mixBlendMode: 'multiply' as const,
    maskImage: 'linear-gradient(to right, #000 60%, transparent)',
    WebkitMaskImage: 'linear-gradient(to right, #000 60%, transparent)',
  };
  return (
    <>
      <div aria-hidden className={cn(edge, 'left-0')} style={style} />
      <div aria-hidden className={cn(edge, 'right-0 -scale-x-100')} style={style} />
    </>
  );
}
