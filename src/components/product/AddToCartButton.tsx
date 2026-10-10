'use client';

import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { CartProduct } from '@/lib/cart/lines';
import { useCart } from '@/lib/cart/store';

export function AddToCartButton({
  product,
  quantity = 1,
  disabled,
  label = 'Add to cart',
  size = 'sm',
  showIcon,
  className,
}: {
  product: CartProduct;
  quantity?: number;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}) {
  const add = useCart((s) => s.add);
  return (
    <Button size={size} disabled={disabled} className={className} onClick={() => add(product, quantity)}>
      {showIcon && !disabled ? <ShoppingBag size={16} aria-hidden /> : null}
      {disabled ? 'Sold out' : label}
    </Button>
  );
}
