import { CupCollection } from '@/components/home/CupCollection';
import { Hero } from '@/components/home/Hero';
import { FeatureStrip, OnTheGoBanner, QuizBanner } from '@/components/marketing/Banners';
import { MixBoxBanner } from '@/components/marketing/MixBoxBanner';
import { RecipesCarousel } from '@/components/recipe/RecipeCard';
import { getFeaturedProducts, getRecipeCards } from '@/lib/data/cached';

export default async function HomePage() {
  const [featured, recipes] = await Promise.all([getFeaturedProducts(5), getRecipeCards(8)]);
  return (
    <>
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
