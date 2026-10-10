import type { Product } from '@/lib/types';

export function isPurchasable(p: Pick<Product, 'status' | 'stock' | 'trackInventory' | 'allowBackorder'>): boolean {
  if (p.status !== 'active') return false;
  return !p.trackInventory || p.allowBackorder || p.stock > 0;
}
