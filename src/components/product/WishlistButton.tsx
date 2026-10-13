'use client';

import { Heart } from 'lucide-react';
import { setWishlisted } from '@/app/actions/wishlist';
import { cn } from '@/lib/cn';
import { useWishlist } from '@/lib/wishlist/store';
import { useAuthStatus, useHydratedWishlist } from '@/lib/wishlist/use-wishlist';

/** Heart toggle. Guests keep the list in this browser; signed-in customers also save it to the account. */
export function WishlistButton({ productId, label, className }: { productId: string; label: string; className?: string }) {
  const hydrated = useHydratedWishlist();
  const saved = useWishlist((s) => hydrated && s.ids.includes(productId));
  const toggle = useWishlist((s) => s.toggle);
  const signedIn = useAuthStatus((s) => s.signedIn);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${label} from your wishlist` : `Save ${label} to your wishlist`}
      disabled={!hydrated}
      onClick={() => {
        toggle(productId);
        if (signedIn) void setWishlisted(productId, !saved);
      }}
      className={cn(
        'flex size-10 items-center justify-center rounded-full bg-cream-light/90 text-terracotta shadow-sm ring-1 ring-forest/10 transition-colors hover:bg-white disabled:opacity-60',
        className,
      )}
    >
      <Heart size={20} fill={saved ? 'currentColor' : 'none'} aria-hidden />
    </button>
  );
}
