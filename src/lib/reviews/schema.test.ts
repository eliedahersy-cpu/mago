import { parseReviewForm } from '@/lib/reviews/schema';

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

test('a review needs 1–5 stars and 10–1000 characters; the title is optional', () => {
  expect(parseReviewForm(form({ productId: '00000000-0000-4000-8000-000000000001', rating: '4', title: '  ', body: '  Smoky and filling, great lunch.  ' }))).toEqual({
    ok: true,
    data: { productId: '00000000-0000-4000-8000-000000000001', rating: 4, title: null, body: 'Smoky and filling, great lunch.' },
  });
  const bad = parseReviewForm(form({ productId: 'nope', rating: '6', title: 'x'.repeat(81), body: 'short' }));
  expect(bad.ok).toBe(false);
  if (!bad.ok) expect(Object.keys(bad.fieldErrors).sort()).toEqual(['body', 'productId', 'rating', 'title']);
  const none = parseReviewForm(form({ productId: '00000000-0000-4000-8000-000000000001', body: 'No stars given here.' }));
  expect(none.ok).toBe(false);
  if (!none.ok) expect(none.fieldErrors.rating).toBe('Choose a rating from 1 to 5 stars.');
});
