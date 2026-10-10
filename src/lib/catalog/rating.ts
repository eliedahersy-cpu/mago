export type StarFill = 'full' | 'half' | 'empty';

/** Five star fills for an average rating, rounded to the nearest half star. */
export function ratingStars(avg: number | null): StarFill[] {
  const rounded = avg === null || Number.isNaN(avg) ? 0 : Math.min(5, Math.max(0, Math.round(avg * 2) / 2));
  return Array.from({ length: 5 }, (_, i) => {
    if (rounded >= i + 1) return 'full';
    if (rounded >= i + 0.5) return 'half';
    return 'empty';
  });
}
