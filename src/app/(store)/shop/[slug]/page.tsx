import { ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArchDecor, LeafSprig } from '@/components/brand/Decor';
import { BenefitIcons } from '@/components/product/BenefitIcons';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGallery } from '@/components/product/ProductGallery';
import { leafThemeFor, SideLeaves } from '@/components/product/SideLeaves';
import { ProductPurchase } from '@/components/product/ProductPurchase';
import {
  CompleteTheExperience,
  IngredientsPanel,
  NutritionPanel,
  PerksRow,
  PreparationBanner,
  PreparationPanel,
  ReviewList,
  StoryPanel,
  UpsellStrip,
} from '@/components/product/ProductSections';
import { ProductTabs } from '@/components/product/ProductTabs';
import { JsonLd } from '@/components/seo/JsonLd';
import { ReviewForm } from '@/components/product/ReviewForm';
import { Badge } from '@/components/ui/Badge';
import { Carousel } from '@/components/ui/Carousel';
import { Container } from '@/components/ui/Container';
import { StarRating } from '@/components/ui/StarRating';
import { toCartProduct } from '@/lib/cart/lines';
import { isPurchasable } from '@/lib/catalog/stock';
import {
  getActiveAutomaticDiscount,
  getActiveProductSlugs,
  getApprovedReviews,
  getProductBySlug,
  getProductsBySlugs,
  getRelatedProducts,
  getSettings,
} from '@/lib/data/cached';
import { formatPrice } from '@/lib/format';
import { productJsonLd, siteUrl } from '@/lib/seo/jsonld';

// Unknown or draft slugs must return a real 404, so this segment may block instead of streaming a shell.
export const instant = false;

export async function generateStaticParams() {
  return (await getActiveProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<'/shop/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const title = [product.name, product.flavour].filter(Boolean).join(' ');
  return {
    title,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    openGraph: { title, images: product.images[0] ? [product.images[0].url] : [] },
  };
}

export default async function ProductPage({ params }: PageProps<'/shop/[slug]'>) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  if (product.type === 'bundle') redirect('/mix-box');

  const [related, reviews, discount, settings, extras] = await Promise.all([
    getRelatedProducts(product, 5),
    getApprovedReviews(product.id),
    getActiveAutomaticDiscount(),
    getSettings(),
    getProductsBySlugs(['mago-mix-box', 'recipe-booklet']),
  ]);
  const mixBox = extras.find((p) => p.slug === 'mago-mix-box') ?? null;
  const booklet = extras.find((p) => p.slug === 'recipe-booklet') ?? null;
  const collection = product.collections.find((c) => c.slug !== 'best-sellers') ?? product.collections[0];
  const isCup = product.type === 'cup';
  const leafTheme = leafThemeFor(product.slug);

  // Same order as the design: ingredients first; "How to prepare" scrolls to its band on wide screens.
  const tabs = [
    ...(product.ingredients.length ? [{ id: 'ingredients', label: 'Ingredients', content: <IngredientsPanel product={product} /> }] : []),
    ...(product.nutrition.length ? [{ id: 'nutrition', label: 'Nutritional facts', content: <NutritionPanel product={product} /> }] : []),
    ...(product.preparation.length ? [{ id: 'prepare', label: 'How to prepare', scrollTo: 'prepare', content: <PreparationPanel product={product} /> }] : []),
    ...(product.story ? [{ id: 'about', label: 'Our story behind this flavour', content: <StoryPanel product={product} review={reviews[0] ?? null} /> }] : []),
    {
      id: 'reviews',
      label: `Reviews (${product.ratingCount})`,
      content: (
        <div className="space-y-6">
          <ReviewList reviews={reviews} />
          <ReviewForm productId={product.id} productName={[product.name, product.flavour].filter(Boolean).join(' ')} returnTo={`/shop/${product.slug}`} />
        </div>
      ),
    },
  ];

  return (
    <div className="relative isolate overflow-hidden">
      <JsonLd data={productJsonLd(product, siteUrl())} />
      {leafTheme ? (
        <SideLeaves theme={leafTheme} />
      ) : (
        <>
          <ArchDecor className="pointer-events-none absolute top-24 -left-12 hidden w-28 opacity-50 xl:block" />
          <LeafSprig className="pointer-events-none absolute top-16 -right-4 hidden w-16 rotate-12 opacity-70 xl:block" />
        </>
      )}
      <Container className="max-w-[1140px] pt-6 pb-4">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-ink/75">
            <li>
              <Link href="/" className="hover:text-forest">Home</Link>
            </li>
            <ChevronRight size={14} aria-hidden />
            <li>
              <Link href="/shop" className="hover:text-forest">Our Cups</Link>
            </li>
            {collection ? (
              <>
                <ChevronRight size={14} aria-hidden />
                <li>
                  <Link href={`/shop?collection=${collection.slug}`} className="hover:text-forest">
                    {collection.title}
                  </Link>
                </li>
              </>
            ) : null}
            <ChevronRight size={14} aria-hidden />
            <li aria-current="page" className="font-medium text-[#9c3418]">
              {product.flavour ?? product.name}
            </li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <ProductGallery images={product.images} name={[product.name, product.flavour].filter(Boolean).join(' ')} proteinG={isCup ? product.proteinG : null} />

          <div className="flex flex-col gap-5">
            {product.isBestSeller ? <Badge className="self-start">Best seller</Badge> : null}
            <h1 className="font-display leading-none font-bold text-forest">
              <span className="block text-2xl md:text-3xl">{product.name}</span>
              {product.flavour ? <span className="mt-1 block text-4xl md:text-5xl">{product.flavour}</span> : null}
            </h1>
            <StarRating avg={product.ratingAvg} count={product.ratingCount} size="md" />
            {product.description ? <p className="text-lg leading-relaxed text-ink/85">{product.description}</p> : null}
            {isCup ? <BenefitIcons variant="product" /> : null}
            <p className="font-display text-3xl font-bold text-forest">{formatPrice(product.price)}</p>
            <ProductPurchase product={toCartProduct(product)} purchasable={isPurchasable(product)} />
            <PerksRow freeShippingThreshold={settings.freeShippingThreshold} />
            {isCup && discount ? <UpsellStrip discount={discount} /> : null}
          </div>
        </div>
      </Container>

      <Container className="max-w-[1140px] py-8">
        <ProductTabs tabs={tabs} />
        {product.preparation.length ? (
          <div className="mt-6">
            <PreparationBanner product={product} />
          </div>
        ) : null}
      </Container>

      <Container className="grid max-w-[1140px] gap-8 pb-14 lg:grid-cols-[1.2fr_1fr]">
        {related.length > 0 ? (
          <section aria-labelledby="related-title" className="min-w-0">
            <h2 id="related-title" className="font-display text-xl font-bold text-forest uppercase">
              You may also like
            </h2>
            <Carousel ariaLabel="You may also like" className="mt-4" itemClassName="w-[17.5rem]">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} variant="row" />
              ))}
            </Carousel>
          </section>
        ) : null}
        <CompleteTheExperience mixBox={mixBox} booklet={booklet} cupPrice={isCup ? product.price : 4.5} />
      </Container>
    </div>
  );
}
