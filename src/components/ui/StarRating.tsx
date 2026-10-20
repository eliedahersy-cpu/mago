import { Star } from 'lucide-react';
import { ratingStars } from '@/lib/catalog/rating';
import { cn } from '@/lib/cn';

export function StarRating({
  avg,
  count,
  size = 'sm',
  className,
}: {
  avg: number | null;
  count: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (count === 0 || avg === null) {
    const px0 = size === 'sm' ? 14 : 18;
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span className="flex text-saffron/35" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={px0} fill="currentColor" strokeWidth={0} />
          ))}
        </span>
        <span className={cn('text-sm text-ink/70', size === 'sm' && 'max-sm:sr-only')}>No reviews yet</span>
      </div>
    );
  }
  const px = size === 'sm' ? 14 : 18;
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="flex text-saffron" aria-hidden>
        {ratingStars(avg).map((fill, i) => (
          <span key={i} className="relative inline-block" style={{ width: px, height: px }}>
            <Star size={px} fill="currentColor" strokeWidth={0} className="absolute inset-0 opacity-25" />
            {fill !== 'empty' ? (
              <span className="absolute inset-0 overflow-hidden" style={{ width: fill === 'half' ? px / 2 : px }}>
                <Star size={px} fill="currentColor" strokeWidth={0} />
              </span>
            ) : null}
          </span>
        ))}
      </span>
      <span className="text-sm text-ink/70">
        <span className="sr-only">Rated </span>
        {avg.toFixed(1)}
        <span className="sr-only"> out of 5</span> ({count} {count === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}
