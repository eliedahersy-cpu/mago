import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchForm } from '@/components/layout/SearchForm';
import { ProductGrid } from '@/components/product/ProductCard';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Container } from '@/components/ui/Container';
import { searchCatalog } from '@/lib/data/cached';

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false },
};

export default function SearchPage({ searchParams }: PageProps<'/search'>) {
  return (
    <Container className="py-10 md:py-14">
      <Suspense fallback={<p className="text-ink/60">Searching…</p>}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function SearchResults({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = (await searchParams).q;
  const raw = (Array.isArray(q) ? q[0] : q) ?? '';
  const { term, products, recipes } = await searchCatalog(raw);

  if (!term) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="font-display text-4xl font-bold text-forest uppercase">Search MAGO</h1>
        <SearchForm className="mt-6" />
      </div>
    );
  }

  const empty = products.length === 0 && recipes.length === 0;
  return (
    <>
      <h1 className="font-display text-3xl font-bold text-forest md:text-4xl">Search results for &ldquo;{term}&rdquo;</h1>
      <SearchForm defaultValue={term} className="mt-5 max-w-xl" />
      {empty ? (
        <p className="mt-10 text-lg text-ink/80">
          No matches for &quot;{term}&quot;. Try &quot;pesto&quot; or &quot;soup&quot;.
        </p>
      ) : null}
      {products.length > 0 ? (
        <section className="mt-10" aria-labelledby="search-products">
          <h2 id="search-products" className="mb-4 font-display text-xl font-bold text-forest uppercase">
            Cups &amp; products ({products.length})
          </h2>
          <ProductGrid products={products} />
        </section>
      ) : null}
      {recipes.length > 0 ? (
        <section className="mt-12" aria-labelledby="search-recipes">
          <h2 id="search-recipes" className="mb-4 font-display text-xl font-bold text-forest uppercase">
            Recipes ({recipes.length})
          </h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {recipes.map((r) => (
              <li key={r.slug}>
                <RecipeCard recipe={r} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
