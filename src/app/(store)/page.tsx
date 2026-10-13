import { CupCollection } from '@/components/home/CupCollection';
import { Hero } from '@/components/home/Hero';
import { FeatureStrip, OnTheGoBanner, QuizBanner } from '@/components/marketing/Banners';
import { MixBoxBanner } from '@/components/marketing/MixBoxBanner';
import { RecipesCarousel } from '@/components/recipe/RecipeCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { getFeaturedProducts, getRecipeCards, getSettings } from '@/lib/data/cached';
import { organizationJsonLd, siteUrl, websiteJsonLd } from '@/lib/seo/jsonld';

export default async function HomePage() {
  const [featured, recipes, settings] = await Promise.all([getFeaturedProducts(5), getRecipeCards(8), getSettings()]);
  return (
    <>
      <JsonLd data={[websiteJsonLd(siteUrl()), organizationJsonLd(siteUrl(), Object.values(settings.socialLinks).filter((v): v is string => Boolean(v)))]} />
      <Hero />
      <CupCollection products={featured} />
      <MixBoxBanner variant="home" />
      <QuizBanner />
      <FeatureStrip />
      <RecipesCarousel recipes={recipes} />
      <OnTheGoBanner />
    </>
  );
}
