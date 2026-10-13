import { ArrowRight, Clock } from 'lucide-react';
import { ManagedMediaImage } from '@/components/media/ManagedMediaImage';
import Link from 'next/link';
import { Carousel } from '@/components/ui/Carousel';
import { buttonVariants } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { cn } from '@/lib/cn';
import { recipeImage } from '@/config/visual-media';
import type { RecipeSummary } from '@/lib/types';

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const src = recipeImage(recipe.slug, recipe.heroImage);
  const isPackshot = src.startsWith('/products/');
  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-cream-light shadow-sm ring-1 ring-forest/5 transition-shadow hover:shadow-md"
    >
      <div className={cn('relative aspect-[4/3] overflow-hidden', isPackshot && 'bg-cream-dark/50')}>
        {src ? (
          <ManagedMediaImage
            slotKey={'recipe:'+recipe.slug}
            fallback={src}
            alt=""
            fill
            sizes="(min-width: 1024px) 220px, 60vw"
            className={cn(
              'transition-transform duration-300 group-hover:scale-105',
              isPackshot ? 'object-contain p-3 mix-blend-multiply' : 'object-cover',
            )}
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-display leading-tight font-semibold text-forest">{recipe.title}</h3>
        {recipe.productName ? <p className="mt-0.5 text-xs text-ink/70">{recipe.productName}</p> : null}
        <p className="mt-auto flex items-center gap-1 pt-2 text-xs font-medium text-forest">
          <Clock size={14} aria-hidden /> {recipe.minutes} min
        </p>
      </div>
    </Link>
  );
}

export function RecipesCarousel({ recipes }: { recipes: RecipeSummary[] }) {
  return (
    <section className="py-12 md:py-16">
      <Container className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-center">
        <div className="text-center lg:text-left">
          <h2 className="font-display text-3xl leading-none font-bold text-forest uppercase">Recipes &amp; inspiration</h2>
          <p className="mt-2 text-lg text-ink/80">Simple ideas. Big flavours.</p>
          <Link href="/recipes" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-5')}>
            View all recipes <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <Carousel ariaLabel="Recipes" className="min-w-0" itemClassName="w-[62%] sm:w-[38%] lg:w-[calc(20%-0.8rem)]">
          {recipes.map((r) => (
            <RecipeCard key={r.slug} recipe={r} />
          ))}
        </Carousel>
      </Container>
    </section>
  );
}
