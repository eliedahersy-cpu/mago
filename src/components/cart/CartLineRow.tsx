'use client';

import { ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { lineUnitPrice, type CartLine } from '@/lib/cart/lines';
import { formatPrice } from '@/lib/format';

function Thumb({ href, image }: { href: string; image: string | null }) {
  return (
    <Link href={href} tabIndex={-1} aria-hidden className="shrink-0 rounded-xl bg-cream p-1">
      {image ? (
        <Image src={image} alt="" width={72} height={90} className="h-[90px] w-[72px] object-contain mix-blend-multiply" />
      ) : (
        <span className="flex h-[90px] w-[72px] items-center justify-center text-forest/40">
          <ShoppingBag size={24} aria-hidden />
        </span>
      )}
    </Link>
  );
}

/** One cart line (a product or a Mix Box with its cups), shared by the drawer and the cart page. */
export function CartLineRow({
  line,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  onQuantity: (qty: number) => void;
  onRemove: () => void;
}) {
  const isBox = line.kind === 'box';
  const href = isBox ? '/mix-box' : `/shop/${line.slug}`;
  const flavour = isBox ? null : line.flavour;
  const label = `${line.name} ${flavour ?? ''}`.trim();
  const unitPrice = lineUnitPrice(line);
  const cupCount = isBox ? line.cups.reduce((n, c) => n + c.quantity, 0) : 0;

  return (
    <li data-testid={isBox ? 'cart-box' : 'cart-line'} className="flex gap-4 py-4">
      <Thumb href={href} image={line.image} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={href} className="font-display leading-tight font-semibold text-forest">
          {line.name}
          {flavour ? <span className="block text-sm font-medium text-ink/80">{flavour}</span> : null}
        </Link>
        {isBox ? (
          <>
            <span className="mt-0.5 text-sm text-ink/70">
              {cupCount} cups · {formatPrice(unitPrice)} per box
            </span>
            <ul className="mt-1.5 space-y-0.5 text-sm text-ink/80">
              {line.cups.map((cup) => (
                <li key={cup.productId}>
                  {cup.quantity} × {cup.name} {cup.flavour}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <span className="mt-0.5 text-sm text-ink/70">{formatPrice(unitPrice)} each</span>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <QuantityStepper size="sm" label={`Quantity of ${label}`} value={line.quantity} onChange={onQuantity} />
          <span className="font-semibold text-forest tabular-nums">{formatPrice(unitPrice * line.quantity)}</span>
        </div>
      </div>
      <button
        type="button"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
        className="self-start rounded-full p-1.5 text-ink/50 hover:bg-forest/10 hover:text-terracotta"
      >
        <Trash2 size={18} aria-hidden />
      </button>
    </li>
  );
}
