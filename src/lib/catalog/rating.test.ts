import { ratingStars } from '@/lib/catalog/rating';

const F = 'full';
const H = 'half';
const E = 'empty';

test('rounds to nearest half', () => {
  expect(ratingStars(4.8)).toEqual([F, F, F, F, F]);
  expect(ratingStars(4.3)).toEqual([F, F, F, F, H]);
  expect(ratingStars(4.2)).toEqual([F, F, F, F, E]);
});

test('handles null and out of range', () => {
  expect(ratingStars(null)).toEqual([E, E, E, E, E]);
  expect(ratingStars(7)).toEqual([F, F, F, F, F]);
  expect(ratingStars(-1)).toEqual([E, E, E, E, E]);
});
