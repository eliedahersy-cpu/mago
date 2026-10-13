import { ChevronLeft, Clock, Globe, MapPin, Navigation, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StoreBadge } from '@/components/stores/StoreLocator';
import { JsonLd } from '@/components/seo/JsonLd';
import { StoreMap } from '@/components/stores/StoreMap';
import { Container } from '@/components/ui/Container';
import { getStores } from '@/lib/data/cached';
import { siteUrl, storeJsonLd } from '@/lib/seo/jsonld';
import { directionsUrl, distanceKm, formatDistance, sortByDistance } from '@/lib/stores/geo';

// Unknown or inactive stores are a real 404.
export const instant = false;

export async function generateStaticParams() {
  return (await getStores()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<'/stores/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const store = (await getStores()).find((s) => s.slug === slug);
  return store ? { title: `${store.name} — MAGO stockist`, description: `Find MAGO pasta cups at ${store.name}, ${[store.area, store.city].filter(Boolean).join(', ')}.` } : {};
}

export default async function StorePage({ params }: PageProps<'/stores/[slug]'>) {
  const { slug } = await params;
  const stores = await getStores();
  const store = stores.find((s) => s.slug === slug);
  if (!store) notFound();
  const here = store.lat !== null && store.lng !== null ? { lat: store.lat, lng: store.lng } : null;
  const nearby = sortByDistance(
    stores.filter((s) => s.id !== store.id),
    here,
  ).slice(0, 3);
  const place = [store.address, store.area, store.city].filter((v, i, a) => v && a.indexOf(v) === i).join(', ');

  return (
    <Container className="py-8 md:py-12">
      <JsonLd data={storeJsonLd(store, siteUrl())} />
      <Link href="/stores" className="inline-flex items-center gap-1 text-sm font-medium text-forest/80 hover:text-forest">
        <ChevronLeft size={16} aria-hidden /> All stores
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {here ? (
          <StoreMap points={[{ id: store.id, lat: here.lat, lng: here.lng, label: store.name }]} activeId={store.id} zoom={15} className="h-72 md:h-[420px]" />
        ) : store.image ? (
          <div className="relative h-72 overflow-hidden rounded-2xl md:h-[420px]">
            <Image src={store.image} alt={store.name} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
          </div>
        ) : null}
        <div className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5 md:p-7">
          <div className="flex items-center gap-3">
            <StoreBadge name={store.chain ?? store.name} className="size-14" />
            <h1 className="font-display text-3xl leading-tight font-bold text-forest md:text-4xl">{store.name}</h1>
          </div>
          <ul className="mt-5 space-y-2.5 text-ink/85">
            {place ? (
              <li className="flex items-start gap-2">
                <MapPin size={18} className="mt-0.5 shrink-0 text-forest" aria-hidden /> {place}
              </li>
            ) : null}
            {store.hours ? (
              <li className="flex items-start gap-2">
                <Clock size={18} className="mt-0.5 shrink-0 text-forest" aria-hidden /> {store.hours}
              </li>
            ) : null}
            {store.phone ? (
              <li className="flex items-start gap-2">
                <Phone size={18} className="mt-0.5 shrink-0 text-forest" aria-hidden />
                <a href={`tel:${store.phone.replace(/\s/g, '')}`} className="hover:underline">
                  {store.phone}
                </a>
              </li>
            ) : null}
            {store.website ? (
              <li className="flex items-start gap-2">
                <Globe size={18} className="mt-0.5 shrink-0 text-forest" aria-hidden />
                <a href={store.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {store.website.replace(/^https?:\/\//, '')}
                </a>
              </li>
            ) : null}
          </ul>
          <a
            href={directionsUrl(store)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-forest font-display text-sm font-semibold tracking-wide text-cream-light uppercase hover:bg-forest-light"
          >
            <Navigation size={17} aria-hidden /> Directions
          </a>
        </div>
      </div>

      {store.products.length ? (
        <section aria-labelledby="available" className="mt-10">
          <h2 id="available" className="font-display text-2xl font-bold text-forest uppercase">
            Available MAGO products
          </h2>
          <p className="mt-1 text-sm text-ink/65">Ranges change from store to store; call ahead for a favourite.</p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {store.products.map((p) => (
              <li key={p.id}>
                <Link href={`/shop/${p.slug}`} className="group block rounded-2xl bg-cream-light p-3 text-center ring-1 ring-forest/5 hover:shadow-md">
                  <span className="relative mx-auto block aspect-square w-full">
                    {p.image ? <Image src={p.image} alt="" fill sizes="160px" className="object-contain mix-blend-multiply transition-transform group-hover:scale-105" /> : null}
                  </span>
                  <span className="mt-2 block font-display text-sm leading-tight font-bold text-forest">{p.name}</span>
                  <span className="block text-xs text-ink/70">{p.flavour}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {nearby.length ? (
        <section aria-labelledby="nearby" className="mt-10">
          <h2 id="nearby" className="font-display text-2xl font-bold text-forest uppercase">
            More nearby
          </h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {nearby.map((s) => (
              <li key={s.id}>
                <Link href={`/stores/${s.slug}`} className="flex items-center gap-3 rounded-2xl bg-cream-light p-3 ring-1 ring-forest/5 hover:shadow-md">
                  <StoreBadge name={s.chain ?? s.name} />
                  <span className="min-w-0">
                    <span className="block font-display font-bold text-forest">{s.name}</span>
                    <span className="block text-sm text-ink/70">
                      {[s.area, s.city].filter((v, i, a) => v && a.indexOf(v) === i).join(', ')}
                      {here && s.lat !== null && s.lng !== null ? ` · ${formatDistance(distanceKm(here, { lat: s.lat, lng: s.lng }))}` : ''}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Container>
  );
}
