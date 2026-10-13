import { isPurchasable } from '@/lib/catalog/stock';
import type { Product } from '@/lib/types';

/** schema.org structured data for search engines. Only real data: no rating without reviews. */

const absolute = (base: string, url: string) => (/^https?:\/\//.test(url) ? url : `${base}${url.startsWith('/') ? '' : '/'}${url}`);

export function productJsonLd(p: Product, base: string) {
  const name = [p.name, p.flavour].filter(Boolean).join(' ');
  const images = [...p.images].sort((a, b) => a.position - b.position).map((i) => absolute(base, i.url));
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: p.seoDescription ?? p.shortDescription ?? p.description ?? p.tagline ?? undefined,
    image: images,
    brand: { '@type': 'Brand', name: 'MAGO' },
    ...(p.ratingCount > 0 && p.ratingAvg !== null
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.ratingAvg, reviewCount: p.ratingCount, bestRating: 5, worstRating: 1 } }
      : {}),
    offers: {
      '@type': 'Offer',
      url: `${base}/shop/${p.slug}`,
      price: p.price.toFixed(2),
      priceCurrency: 'USD',
      availability: isPurchasable(p) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

export interface RecipeForSeo {
  slug: string;
  title: string;
  intro: string | null;
  heroImage: string | null;
  minutes: number;
  servings: string | null;
  ingredients: string[];
  steps: { title: string; body: string }[];
  tags: string[];
}

export function recipeJsonLd(r: RecipeForSeo, base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.title,
    description: r.intro ?? undefined,
    image: r.heroImage ? [absolute(base, r.heroImage)] : undefined,
    totalTime: `PT${r.minutes}M`,
    recipeYield: r.servings ?? undefined,
    recipeCategory: r.tags[0],
    author: { '@type': 'Organization', name: 'MAGO' },
    recipeIngredient: r.ingredients,
    recipeInstructions: r.steps.map((s) => ({ '@type': 'HowToStep', name: s.title, text: s.body || s.title })),
    url: `${base}/recipes/${r.slug}`,
  };
}

export interface StoreForSeo {
  slug: string;
  name: string;
  address: string | null;
  area: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  hours: string | null;
}

export function storeJsonLd(s: StoreForSeo, base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: s.name,
    url: `${base}/stores/${s.slug}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: s.address ?? undefined,
      addressLocality: s.city ?? s.area ?? undefined,
      addressCountry: 'LB',
    },
    ...(s.lat !== null && s.lng !== null ? { geo: { '@type': 'GeoCoordinates', latitude: s.lat, longitude: s.lng } } : {}),
    telephone: s.phone ?? undefined,
  };
}

export function websiteJsonLd(base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MAGO',
    url: base,
    potentialAction: { '@type': 'SearchAction', target: `${base}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  };
}

export function organizationJsonLd(base: string, sameAs: string[] = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MAGO',
    url: base,
    logo: `${base}/brand/logo.webp`,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** JSON for a <script type="application/ld+json">: `<` and line separators escaped so text can never end the script. */
export function serializeJsonLd(data: unknown): string {
  // `\u003c` and the escaped line separators parse back to the same JSON but can never close the script.
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replaceAll(String.fromCharCode(0x2028), '\\u2028')
    .replaceAll(String.fromCharCode(0x2029), '\\u2029');
}

/** The site's public address (env in production, the live domain as a fallback). */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://mago-rose.vercel.app').replace(/\/$/, '');
}
