import { productJsonLd, recipeJsonLd, serializeJsonLd, storeJsonLd, websiteJsonLd } from '@/lib/seo/jsonld';
import type { Product } from '@/lib/types';

const BASE = 'https://mago.example';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1', slug: 'fusilli-spicy-muhammara', name: 'Fusilli Cup', flavour: 'Spicy Muhammara', type: 'cup', status: 'active', tagline: 'Bold.',
    sauce: null, shortDescription: 'Smoky pepper pasta.', description: null, story: null, price: 4.5, compareAtPrice: null, stock: 10,
    trackInventory: true, allowBackorder: false, proteinG: 30, prepMinutes: 4, isBestSeller: true, isFeatured: true, sortOrder: 1, badges: [],
    ingredients: [], nutrition: [], preparation: [], flavourProfiles: [], spiceLevel: 3, textures: [], occasions: [], style: null, bundleSize: null,
    ratingAvg: null, ratingCount: 0, collections: [], seoTitle: null, seoDescription: null, createdAt: '2026-01-01T00:00:00Z',
    images: [
      { url: '/products/fusilli-spicy-muhammara.webp', alt: '', kind: 'packshot', position: 0 },
      { url: 'https://x.supabase.co/storage/v1/object/public/product-images/a.webp', alt: '', kind: 'lifestyle', position: 1 },
    ],
    ...overrides,
  } as Product;
}

test('a product has its price, stock and absolute images, and no rating until there are reviews', () => {
  const ld = productJsonLd(makeProduct(), BASE);
  expect(ld).toMatchObject({
    '@type': 'Product',
    name: 'Fusilli Cup Spicy Muhammara',
    image: [`${BASE}/products/fusilli-spicy-muhammara.webp`, 'https://x.supabase.co/storage/v1/object/public/product-images/a.webp'],
    brand: { '@type': 'Brand', name: 'MAGO' },
    offers: { '@type': 'Offer', price: '4.50', priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: `${BASE}/shop/fusilli-spicy-muhammara` },
  });
  expect(ld).not.toHaveProperty('aggregateRating');

  const rated = productJsonLd(makeProduct({ ratingAvg: 4.67, ratingCount: 3, stock: 0 }), BASE);
  expect(rated.aggregateRating).toEqual({ '@type': 'AggregateRating', ratingValue: 4.67, reviewCount: 3, bestRating: 5, worstRating: 1 });
  expect(rated.offers.availability).toBe('https://schema.org/OutOfStock');
});

test('a recipe has ISO durations, ingredients and steps', () => {
  const ld = recipeJsonLd(
    {
      slug: 'rishta-soup',
      title: 'Rishta Soup',
      intro: 'Warming.',
      heroImage: '/images/lifestyle-rainy-day-soup.webp',
      minutes: 12,
      servings: '1–2',
      ingredients: ['1 MAGO Rishta Cup', 'Lemon'],
      steps: [{ title: 'Prepare', body: 'Add hot water.' }],
      tags: ['soups'],
    },
    BASE,
  );
  expect(ld).toMatchObject({
    '@type': 'Recipe',
    name: 'Rishta Soup',
    totalTime: 'PT12M',
    recipeYield: '1–2',
    image: [`${BASE}/images/lifestyle-rainy-day-soup.webp`],
    recipeIngredient: ['1 MAGO Rishta Cup', 'Lemon'],
    recipeInstructions: [{ '@type': 'HowToStep', name: 'Prepare', text: 'Add hot water.' }],
  });
});

test('a store has an address and coordinates; the site has a search action', () => {
  expect(
    storeJsonLd({ slug: 'spinneys-hamra', name: 'Spinneys Hamra', address: 'Hamra Street', area: 'Hamra', city: 'Beirut', lat: 33.89, lng: 35.48, phone: null, hours: null }, BASE),
  ).toMatchObject({
    '@type': 'Store',
    address: { '@type': 'PostalAddress', streetAddress: 'Hamra Street', addressLocality: 'Beirut', addressCountry: 'LB' },
    geo: { '@type': 'GeoCoordinates', latitude: 33.89, longitude: 35.48 },
    url: `${BASE}/stores/spinneys-hamra`,
  });
  expect(websiteJsonLd(BASE).potentialAction).toEqual({ '@type': 'SearchAction', target: `${BASE}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' });
});

test('serialised JSON-LD cannot close its script tag', () => {
  const out = serializeJsonLd({ name: '</script><script>alert(1)</script>', note: 'a b' });
  expect(out).not.toContain('</script>');
  expect(out).not.toContain(' ');
  expect(JSON.parse(out)).toEqual({ name: '</script><script>alert(1)</script>', note: 'a b' });
});
