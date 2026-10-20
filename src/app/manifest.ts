import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo/jsonld';

// Makes the shop installable as an app ("Download app" in the footer and the floating button).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'MAGO — Good food, brighter days',
    short_name: 'MAGO',
    description: 'Mediterranean pasta cups with 30g of protein. Build a Mix Box, find your match, subscribe and save.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f9e9d1',
    theme_color: '#023025',
    icons: [
      { src: '/app-icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/app-icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/app-icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Lets Chrome report the installed app (navigator.getInstalledRelatedApps) so the install buttons hide.
    related_applications: [{ platform: 'webapp', url: `${siteUrl()}/manifest.webmanifest` }],
    shortcuts: [
      { name: 'Our shop', url: '/shop' },
      { name: 'Build a Mix Box', url: '/mix-box' },
      { name: 'Subscribe & save', url: '/subscribe' },
      { name: 'Cart', url: '/cart' },
    ],
  };
}
