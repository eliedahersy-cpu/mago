import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo/jsonld';

/** Keep crawlers on the public shop; personal and admin pages are off limits. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/account', '/auth', '/checkout', '/cart', '/order/', '/subscribe/build', '/mix-box/review', '/search', '/shopping-list'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
