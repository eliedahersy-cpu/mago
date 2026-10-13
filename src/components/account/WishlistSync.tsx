'use client';

import { useWishlistSync } from '@/lib/wishlist/use-wishlist';

/** Keeps the signed-in flag current and merges a guest wishlist into the account after sign-in. */
export function WishlistSync() {
  useWishlistSync();
  return null;
}
