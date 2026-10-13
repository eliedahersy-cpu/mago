'use client';

import { Clock, List, LocateFixed, Map as MapIcon, MapPin, Navigation, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Store } from '@/lib/data/stores';
import { cn } from '@/lib/cn';
import { directionsUrl, distanceKm, formatDistance, matchesStoreSearch, type Point, sortByDistance, STORE_TYPES } from '@/lib/stores/geo';
import { StoreMap } from './StoreMap';

/** Square badge with the chain's initial in brand colours (no logos are used without permission). */
export function StoreBadge({ name, className }: { name: string; className?: string }) {
  const tones = ['bg-forest text-cream-light', 'bg-terracotta text-cream-light', 'bg-saffron text-forest', 'bg-leaf text-cream-light'];
  const tone = tones[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % tones.length];
  return (
    <span aria-hidden className={cn('grid size-12 shrink-0 place-items-center rounded-xl font-display text-xl font-bold', tone, className)}>
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function useMyLocation() {
  const [location, setLocation] = useState<Point | null>(null);
  const [status, setStatus] = useState<'idle' | 'finding' | 'denied' | 'unavailable'>('idle');
  function locate() {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }
    setStatus('finding');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('idle');
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }
  return { location, status, locate };
}

export function StoreLocator({ stores }: { stores: Store[] }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<string>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'map'>('list');
  const { location, status, locate } = useMyLocation();

  const shown = useMemo(
    () => sortByDistance(stores.filter((s) => (type === 'all' || s.type === type) && matchesStoreSearch(s, query)), location),
    [stores, type, query, location],
  );
  const points = useMemo(
    () => shown.filter((s) => s.lat !== null && s.lng !== null).map((s) => ({ id: s.id, lat: s.lat!, lng: s.lng!, label: s.name })),
    [shown],
  );
  const types = STORE_TYPES.filter((t) => stores.some((s) => s.type === t.key));

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Enter your city or area</span>
          <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-forest/50" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your city or area"
            className="w-full rounded-full border border-forest/15 bg-cream-light py-3 pr-4 pl-11 text-sm text-ink shadow-sm focus:border-forest focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={locate}
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-forest px-5 py-2.5 font-display text-sm font-semibold tracking-wide text-forest uppercase hover:bg-forest hover:text-cream-light"
        >
          <LocateFixed size={17} aria-hidden /> {status === 'finding' ? 'Finding you…' : location ? 'Update my location' : 'Use my location'}
        </button>
      </div>
      {status === 'denied' || status === 'unavailable' ? (
        <p role="status" className="mt-2 text-sm text-terracotta">
          {status === 'denied' ? 'Location is blocked in your browser. Search by city or area instead.' : 'We could not find your location. Search by city or area instead.'}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Type of store">
        {[{ key: 'all', label: 'All' }, ...types].map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={type === t.key}
            onClick={() => setType(t.key)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              type === t.key ? 'bg-forest text-cream-light' : 'bg-cream-dark/60 text-forest hover:bg-cream-dark',
            )}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex rounded-full bg-cream-dark/60 p-1 lg:hidden" role="group" aria-label="Show as">
          {(['list', 'map'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold', view === v ? 'bg-forest text-cream-light' : 'text-forest')}
            >
              {v === 'list' ? <List size={15} aria-hidden /> : <MapIcon size={15} aria-hidden />} {v === 'list' ? 'List' : 'Map'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <ul className={cn('space-y-3', view === 'map' && 'max-lg:hidden')} aria-live="polite">
          {shown.length ? (
            shown.map((s) => {
              const away = location && s.lat !== null && s.lng !== null ? formatDistance(distanceKm(location, { lat: s.lat, lng: s.lng })) : null;
              return (
                <li key={s.id}>
                  <article
                    className={cn(
                      'flex gap-3 rounded-2xl bg-cream-light p-3 shadow-sm ring-1 transition-shadow',
                      activeId === s.id ? 'ring-2 ring-terracotta' : 'ring-forest/10 hover:shadow-md',
                    )}
                  >
                    <StoreBadge name={s.chain ?? s.name} />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-lg leading-tight font-bold text-forest">
                        <Link href={`/stores/${s.slug}`} className="hover:underline">
                          {s.name}
                        </Link>
                      </h2>
                      <p className="flex items-center gap-1 text-sm text-ink/75">
                        <MapPin size={14} aria-hidden /> {[s.area, s.city].filter((v, i, a) => v && a.indexOf(v) === i).join(', ')}
                        {away ? <span className="font-semibold text-forest"> · {away} away</span> : null}
                      </p>
                      {s.hours ? (
                        <p className="flex items-center gap-1 text-sm text-ink/65">
                          <Clock size={14} aria-hidden /> {s.hours}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <a
                          href={directionsUrl(s)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-1.5 font-display text-xs font-semibold tracking-wide text-cream-light uppercase hover:bg-forest-light"
                        >
                          <Navigation size={13} aria-hidden /> Directions
                        </a>
                        {s.lat !== null ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveId(s.id);
                              setView('map');
                            }}
                            className="rounded-full px-3 py-1.5 text-xs font-semibold text-forest underline-offset-4 hover:underline"
                          >
                            Show on map
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })
          ) : (
            <li className="rounded-2xl bg-cream-light p-6 text-center text-ink/70">
              No stores match. You can always{' '}
              <Link href="/shop" className="font-semibold text-forest underline underline-offset-4">
                order online
              </Link>{' '}
              with delivery across Lebanon.
            </li>
          )}
        </ul>
        <div className={cn('lg:sticky lg:top-28 lg:self-start', view === 'list' && 'max-lg:hidden')}>
          <StoreMap points={points} activeId={activeId} onSelect={setActiveId} user={location} className="h-[420px] lg:h-[560px]" />
        </div>
      </div>
    </div>
  );
}
