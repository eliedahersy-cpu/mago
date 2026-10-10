'use client';

import { ArrowRight, ShoppingBag, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { ButtonLink } from '@/components/ui/Button';
import { cartCount, cartSubtotal } from '@/lib/cart/lines';
import { useCart } from '@/lib/cart/store';
import { formatPrice } from '@/lib/format';

export function CartDrawer() {
  const dialog = useRef<HTMLDialogElement>(null);
  const { lines, isOpen, close, setQuantity, remove } = useCart();
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
              <li key={line.id} className="flex gap-4 py-4">
                <Link href={`/shop/${line.slug}`} className="shrink-0 rounded-xl bg-cream p-1">
                  {line.image ? (
                    <Image src={line.image} alt="" width={72} height={90} className="h-[90px] w-[72px] object-contain mix-blend-multiply" />
                  ) : (
                    <span className="flex h-[90px] w-[72px] items-center justify-center text-forest/40">
                      <ShoppingBag size={24} aria-hidden />
                    </span>
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link href={`/shop/${line.slug}`} className="font-display leading-tight font-semibold text-forest">
                    {line.name}
                    {line.flavour ? <span className="block text-sm font-medium text-ink/80">{line.flavour}</span> : null}
                  </Link>
                  <span className="mt-0.5 text-sm text-ink/70">{formatPrice(line.unitPrice)} each</span>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <QuantityStepper
                      size="sm"
                      label={`Quantity of ${line.name} ${line.flavour ?? ''}`.trim()}
                      value={line.quantity}
                      onChange={(n) => setQuantity(line.id, n)}
                    />
                    <span className="font-semibold text-forest tabular-nums">{formatPrice(line.unitPrice * line.quantity)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${line.name} ${line.flavour ?? ''}`.trim()}
                  onClick={() => remove(line.id)}
                  className="self-start rounded-full p-1.5 text-ink/50 hover:bg-forest/10 hover:text-terracotta"
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-forest/10 px-5 py-5">
            <div className="flex items-center justify-between font-display text-lg font-semibold text-forest">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatPrice(cartSubtotal(lines))}</span>
            </div>
            <p className="mt-1 text-sm text-ink/70">Delivery and discounts are calculated at checkout.</p>
            <ButtonLink href="/checkout" size="lg" className="mt-4 w-full">
              Checkout <ArrowRight size={18} aria-hidden />
            </ButtonLink>
            <button type="button" onClick={close} className="mt-3 w-full text-center text-sm font-medium text-forest underline-offset-4 hover:underline">
              Continue shopping
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
