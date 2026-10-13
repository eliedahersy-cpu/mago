import { imagePath, imageProblem, MAX_IMAGE_BYTES } from '@/lib/admin/image';
import { parseLines, parsePairs, parseProductForm, parseSteps, slugify } from '@/lib/admin/product-form';

function form(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const item of Array.isArray(v) ? v : [v]) fd.append(k, item);
  return fd;
}

const valid = {
  name: 'Fusilli Cup',
  flavour: 'Spicy Muhammara',
  slug: '',
  type: 'cup',
  status: 'active',
  price: '4.50',
  stock: '120',
  lowStockThreshold: '10',
  spiceLevel: '3',
  sortOrder: '2',
};

test('slugs are lowercase words joined by dashes', () => {
  expect(slugify('Fusilli Cup — Spicy Muhammara!')).toBe('fusilli-cup-spicy-muhammara');
  expect(slugify('  Crème Brûlée  ')).toBe('creme-brulee');
  expect(slugify('---')).toBe('');
});

test('text areas become lists, label/value pairs and titled steps', () => {
  expect(parseLines(' Basil \n\n Parmesan\r\nPine nuts ')).toEqual(['Basil', 'Parmesan', 'Pine nuts']);
  expect(parsePairs('Protein: 30 g per serving\nno colon here\nEnergy : 420 kcal')).toEqual([
    { label: 'Protein', value: '30 g per serving' },
    { label: 'Energy', value: '420 kcal' },
  ]);
  expect(parseSteps('Add water: Fill to the line.\nWait 4 minutes')).toEqual([
    { title: 'Add water', body: 'Fill to the line.' },
    { title: 'Wait 4 minutes', body: '' },
  ]);
});

test('a valid product form fills defaults and builds the slug from name and flavour', () => {
  const r = parseProductForm(
    form({
      ...valid,
      trackInventory: 'on',
      isFeatured: 'on',
      ingredients: 'Peppers\nWalnuts',
      flavourProfiles: ['spicy', 'bogus'],
      collectionIds: ['00000000-0000-4000-8000-000000000001', 'not-a-uuid'],
    }),
  );
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.data).toMatchObject({
    slug: 'fusilli-cup-spicy-muhammara',
    price: 4.5,
    stock: 120,
    trackInventory: true,
    allowBackorder: false,
    isFeatured: true,
    compareAtPrice: null,
    proteinG: null,
    ingredients: [{ name: 'Peppers' }, { name: 'Walnuts' }],
    flavourProfiles: ['spicy'],
    collectionIds: ['00000000-0000-4000-8000-000000000001'],
    style: null,
  });
});

test('refuses missing names, bad prices, bad slugs and a sale price below the price', () => {
  const r = parseProductForm(form({ ...valid, name: ' ', price: '-1', slug: 'Bad Slug', compareAtPrice: '2' }));
  expect(r.ok).toBe(false);
  if (r.ok) return;
  expect(Object.keys(r.fieldErrors).sort()).toEqual(['name', 'price', 'slug']);
  const r2 = parseProductForm(form({ ...valid, compareAtPrice: '3' }));
  expect(r2.ok).toBe(false);
  if (!r2.ok) expect(r2.fieldErrors.compareAtPrice).toBe('Compare-at price must be higher than the price.');
});

test('images must be JPEG, PNG, WebP or AVIF and at most 5 MB', () => {
  expect(imageProblem({ type: 'image/webp', size: 200_000 })).toBeNull();
  expect(imageProblem({ type: 'image/gif', size: 10 })).toBe('Use a JPEG, PNG, WebP or AVIF image.');
  expect(imageProblem({ type: 'application/pdf', size: 10 })).toBe('Use a JPEG, PNG, WebP or AVIF image.');
  expect(imageProblem({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 })).toBe('Images must be 5 MB or smaller.');
  expect(imageProblem({ type: 'image/png', size: 0 })).toBe('That file is empty.');
  expect(imagePath('p1', 'u1', 'image/jpeg')).toBe('p1/u1.jpg');
  expect(imagePath('p1', 'u1', 'image/avif')).toBe('p1/u1.avif');
});
