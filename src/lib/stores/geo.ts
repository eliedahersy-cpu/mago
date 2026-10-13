/** Store locator helpers: distances, directions links and search. */

export interface Point {
  lat: number;
  lng: number;
}

export const STORE_TYPES = [
  { key: 'supermarket', label: 'Supermarkets' },
  { key: 'minimarket', label: 'Minimarkets' },
  { key: 'online', label: 'Online' },
  { key: 'cafe_restaurant', label: 'Cafés & Restaurants' },
] as const;
export type StoreType = (typeof STORE_TYPES)[number]['key'];

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance between two points, in km. */
export function distanceKm(a: Point, b: Point): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 100) * 10} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

type Located = { lat: number | null; lng: number | null };

/** Nearest first when `from` is known; stores without coordinates go last. Otherwise the order is kept. */
export function sortByDistance<T extends Located>(stores: T[], from: Point | null): T[] {
  if (!from) return [...stores].sort((a, b) => Number(a.lat === null) - Number(b.lat === null));
  const d = (s: T) => (s.lat === null || s.lng === null ? Number.POSITIVE_INFINITY : distanceKm(from, { lat: s.lat, lng: s.lng }));
  return [...stores].sort((a, b) => d(a) - d(b));
}

/** Google Maps directions to the store (coordinates when we have them, else its address). */
export function directionsUrl(s: Located & { name: string; address: string | null; city: string | null }): string {
  const destination = s.lat !== null && s.lng !== null ? `${s.lat},${s.lng}` : [s.name, s.address, s.city, 'Lebanon'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&${new URLSearchParams({ destination })}`;
}

const fold = (v: string) => v.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function matchesStoreSearch(s: { name: string; chain: string | null; area: string | null; city: string | null }, q: string): boolean {
  const term = fold(q.trim());
  if (!term) return true;
  return fold([s.name, s.chain, s.area, s.city].filter(Boolean).join(' ')).includes(term);
}
