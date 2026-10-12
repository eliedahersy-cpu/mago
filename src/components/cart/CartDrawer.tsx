'use client';

import { ArrowRight, Gift, ShoppingBag, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { cartCount, cartSubtotal } from '@/lib/cart/lines';
import { useCart } from '@/lib/cart/store';
import { formatPrice } from '@/lib/format';
import { CartLineRow } from './CartLineRow';

export function CartDrawer() {
  const dialog = useRef<HTMLDialogElement>(null);
  const { lines, orderNotes, isOpen, close, setQuantity, remove } = useCart();
  const pathname = usePathname();

  // Read the persisted cart once on the client.
  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (isOpen && !el.open) el.showModal();
    if (!isOpen && el.open) el.close();
  }, [isOpen]);

  // Navigating (e.g. to checkout or a product) closes the drawer.
  useEffect(() => {
    close();
  }, [pathname, close]);

  const count = cartCount(lines);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="cart-title"
      onClose={close}
      onClick={(e) => e.target === dialog.current && close()}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-cream-light p-0 backdrop:bg-forest/40 open:flex open:flex-col sm:rounded-l-3xl"
    >
      <div className="flex items-center justify-between border-b border-forest/10 px-5 py-4">
        <h2 id="cart-title" className="font-display text-xl font-bold text-forest uppercase">
          Your cart ({count})
        </h2>
        <button
          type="button"
          aria-label="Close cart"
          onClick={close}
          className="flex size-10 items-center justify-center rounded-full text-forest hover:bg-forest/10"
        >
          <X size={22} aria-hidden />
        </button>
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <ShoppingBag size={40} className="text-forest/40" aria-hidden />
          <p className="font-display text-lg font-semibold text-forest">Your cart is empty</p>
          <ButtonLink href="/shop">
            Explore our cups <ArrowRight size={16} aria-hidden />
          </ButtonLink>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-forest/10 overflow-y-auto px-5">
            {lines.map((line) => (
              <CartLineRow key={line.id} line={line} onQuantity={(n) => setQuantity(line.id, n)} onRemove={() => remove(line.id)} />
            ))}
          </ul>
          <div className="border-t border-forest/10 px-5 py-5">
            {orderNotes.isGift || orderNotes.giftNote ? (
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-leaf">
                <Gift size={16} aria-hidden /> Gift note added
              </p>
            ) : null}
            <div className="flex items-center justify-between font-display text-lg font-semibold text-forest">
              <span>Subtotal</span>
              <span data-testid="cart-subtotal" className="tabular-nums">
                {formatPrice(cartSubtotal(lines))}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink/70">Delivery and discounts are calculated at checkout.</p>
            <ButtonLink href="/checkout" size="lg" className="mt-4 w-full">
              Checkout <ArrowRight size={18} aria-hidden />
            </ButtonLink>
            <div className="mt-3 flex items-center justify-between text-sm font-medium text-forest">
              <Link href="/cart" className="underline-offset-4 hover:underline">
                View cart
              </Link>
              <button type="button" onClick={close} className="underline-offset-4 hover:underline">
                Continue shopping
              </button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
