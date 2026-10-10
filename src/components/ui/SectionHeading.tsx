import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function SectionHeading({
  title,
  subtitle,
  align = 'center',
  as: Tag = 'h2',
  className,
}: {
  title: ReactNode;
  subtitle?: string;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2';
  className?: string;
}) {
  return (
    <div className={cn(align === 'center' ? 'text-center' : 'text-left', className)}>
      <Tag className="font-display text-3xl leading-none font-bold text-forest uppercase md:text-4xl">{title}</Tag>
      {subtitle ? <p className="mt-2 text-base text-ink/80 md:text-lg">{subtitle}</p> : null}
    </div>
  );
}
