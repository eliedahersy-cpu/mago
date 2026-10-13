'use client';

import { useState } from 'react';
import type { CartProduct } from '@/lib/cart/lines';
import { AddToCartButton } from './AddToCartButton';
import { QuantityStepper } from './QuantityStepper';
import { WishlistButton } from './WishlistButton';

export function ProductPurchase({ product, purchasable }: { product: CartProduct; purchasable: boolean }) {
  const [qty, setQty] = useState(1);
  return (
    <div data-testid="product-purchase" className="flex flex-wrap items-center gap-3">
      <QuantityStepper label="Quantity" value={qty} onChange={setQty} />
      <AddToCartButton
        product={product}
        quantity={qty}
        disabled={!purchasable}
        size="lg"
        showIcon
        className="min-w-52 flex-1"
      />
      <WishlistButton productId={product.productId} label={`${product.name} ${product.flavour ?? ''}`.trim()} className="size-13" />
    </div>
  );
}
