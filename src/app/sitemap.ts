import type { MetadataRoute } from 'next';
import { infoPages } from '@/content/info-pages';
import { getAllActiveProducts, getRecipeSlugs, getStores } from '@/lib/data/cached';
import { siteUrl } from '@/lib/seo/jsonld';

/** Public pages only: active products, published recipes, active stores. Private pages are left out. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, recipes, stores] = await Promise.all([getAllActiveProducts(), getRecipeSlugs(), getStores()]);
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'weekly') => ({
    url: `${base}${path}`,
    changeFrequency,
    priority,
  });
  return [
    page('/', 1, 'daily'),
    page('/shop', 0.9, 'daily'),
    page('/mix-box', 0.9),
    page('/subscribe', 0.8),
    page('/find-your-match', 0.7),
    page('/recipes', 0.7),
    page('/stores', 0.7),
    page('/our-story', 0.5, 'monthly'),
    ...Object.keys(infoPages).map((slug) => page(`/${slug}`, 0.3, 'monthly')),
    ...products.filter((p) => p.type !== 'bundle').map((p) => page(`/shop/${p.slug}`, p.type === 'cup' ? 0.8 : 0.6)),
    ...recipes.map((slug) => page(`/recipes/${slug}`, 0.6)),
    ...stores.map((s) => page(`/stores/${s.slug}`, 0.4, 'monthly')),
  ];
}
