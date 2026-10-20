import { cutoutImage } from '@/lib/catalog/cutout';

test('uses the transparent cutout for a seeded cup packshot', () => {
  expect(cutoutImage('/products/fusilli-spicy-muhammara.webp')).toBe('/products/cutouts/fusilli-spicy-muhammara-v2.webp');
});

test('keeps any other image as it is', () => {
  expect(cutoutImage('/products/mago-mix-box.webp')).toBe('/products/mago-mix-box.webp');
  expect(cutoutImage('https://x.supabase.co/storage/v1/object/public/product-images/a/b.webp')).toMatch(/^https:/);
  expect(cutoutImage('/products/../secret.webp')).toBe('/products/../secret.webp');
});
