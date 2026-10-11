import { Ban, Dumbbell, Leaf, Timer, TreePine } from 'lucide-react';
import { cn } from '@/lib/cn';

const benefits = [
  { icon: Dumbbell, title: 'High protein', detail: '30g per cup' },
  { icon: Leaf, title: 'Real ingredients', detail: null },
  { icon: Timer, title: 'Ready in minutes', detail: null },
  { icon: Ban, title: 'No artificial colours', detail: null },
  { icon: TreePine, title: 'Made in Lebanon', detail: null },
] as const;

export function BenefitIcons({ variant, className }: { variant: 'hero' | 'product'; className?: string }) {
  return (
    <ul
      className={cn(
        'grid grid-cols-5',
        variant === 'hero' ? 'max-w-xl divide-x divide-forest/20' : 'gap-2 rounded-2xl bg-cream-light p-3 ring-1 ring-forest/5',
        className,
      )}
    >
      {benefits.map(({ icon: Icon, title, detail }) => (
        <li key={title} className="flex flex-col items-center gap-1.5 px-1 text-center">
          <span className="flex size-10 items-center justify-center rounded-full border-2 border-forest text-forest md:size-11">
            <Icon size={20} aria-hidden />
          </span>
          <span className="font-display text-[10px] leading-tight font-semibold text-forest uppercase md:text-[11px]">
            {title}
            {detail ? <span className="block font-sans font-medium normal-case text-ink/70">{detail}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
