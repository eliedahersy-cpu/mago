import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge, ProteinBadge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { toCartProduct } from '@/lib/cart/lines';
import { isPurchasable } from '@/lib/catalog/stock';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';
import { AddToCartButton } from './AddToCartButton';
import { WishlistButton } from './WishlistButton';

function Packshot({ product, sizes, className }: { product: Product; sizes: string; className?: string }) {
  const image = product.images.find((i) => i.kind === 'packshot') ?? product.images[0];
  if (!image) return null;
  return (
    <Image
      src={image.url}
      alt={image.alt || `${product.name} ${product.flavour ?? ''}`.trim()}
      fill
      sizes={sizes}
      className={cn('object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105', className)}
    />
  );
}

export function ProductCard({ product, variant = 'shop' }: { product: Product; variant?: 'shop' | 'compact' }) {
  const href = `/shop/${product.slug}`;
  const purchasable = isPurchasable(product);

  const compact = variant === 'compact';
  return (
    <article
      data-testid="product-card"
      className="group relative flex h-full flex-col rounded-2xl bg-cream-light p-3 shadow-sm ring-1 ring-forest/5 transition-shadow hover:shadow-md"
    >
      <Link href={href} tabIndex={-1} aria-hidden className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-cream-dark/50">
        <Packshot product={product} sizes={compact ? '200px' : '(min-width: 1280px) 18vw, (min-width: 768px) 30vw, 45vw'} className="p-3" />
        {product.isBestSeller ? <Badge className="absolute top-2 left-2">Best seller</Badge> : null}
        {product.proteinG && !compact ? (
          <ProteinBadge grams={product.proteinG} className="absolute right-2 bottom-2 size-12" />
        ) : null}
      </Link>
      {!compact ? (
        <WishlistButton productId={product.id} label={`${product.name} ${product.flavour ?? ''}`.trim()} className="absolute top-5 right-5 z-10" />
      ) : null}
      <div className="mt-3 flex flex-1 flex-col px-1">
        <h3 className={cn('font-display leading-tight font-semibold text-forest', compact ? 'text-sm' : 'text-base')}>
          <Link href={href} className="hover:text-terracotta">
            {product.name}
            {product.flavour ? <span className="block">{product.flavour}</span> : null}
          </Link>
        </h3>
        {!compact ? <StarRating avg={product.ratingAvg} count={product.ratingCount} className="mt-1" /> : null}
        {!compact && product.tagline ? <p className="mt-1 line-clamp-2 text-sm text-ink/70">{product.tagline}</p> : null}
        <div className="mt-auto pt-3">
          <p className={cn('font-display font-bold text-forest', compact ? 'text-base' : 'text-lg')}>{formatPrice(product.price)}</p>
          <AddToCartButton product={toCartProduct(product)} disabled={!purchasable} className="mt-2 w-full" />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, variant = 'shop' }: { products: Product[]; variant?: 'shop' | 'compact' }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} variant={variant} />
        </li>
      ))}
    </ul>
  );
}

export function ViewAllLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 font-display text-sm font-semibold text-forest hover:text-terracotta">
      {children} <ArrowRight size={16} aria-hidden />
    </Link>
  );
}
