'use client';

import { ShoppingBag } from 'lucide-react';
import { cartCount } from '@/lib/cart/lines';
import { useCart } from '@/lib/cart/store';

export function CartButton() {
  const count = useCart((s) => cartCount(s.lines));
  const hydrated = useCart((s) => s.hydrated);
  const open = useCart((s) => s.open);
  const shown = hydrated ? count : 0;
  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Open cart, ${shown} ${shown === 1 ? 'item' : 'items'}`}
      className="relative flex size-10 items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/10"
    >
      <ShoppingBag size={22} aria-hidden />
      {shown > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-[11px] font-bold text-cream-light">
          {shown > 99 ? '99+' : shown}
        </span>
      ) : null}
    </button>
  );
}
