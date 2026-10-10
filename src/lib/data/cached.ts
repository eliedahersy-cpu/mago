// Cached entry points used by pages and layouts (Cache Components). The plain
// query functions they wrap live next to this file so they stay testable
// outside the Next.js runtime. Plan 3 (admin) invalidates via these tags.
import { cacheLife, cacheTag } from 'next/cache';
import * as content from './content';

export const CACHE_TAGS = { settings: 'settings', catalog: 'catalog', recipes: 'recipes' } as const;

export async function getSettings() {
  'use cache';
  cacheLife('minutes');
  cacheTag(CACHE_TAGS.settings);
  return content.getSettings();
}
