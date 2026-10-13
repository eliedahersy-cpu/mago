import { directionsUrl, distanceKm, formatDistance, matchesStoreSearch, sortByDistance } from '@/lib/stores/geo';

const hamra = { lat: 33.8966, lng: 35.4823 };
const dbayeh = { lat: 33.938, lng: 35.588 };

test('straight-line distance in kilometres', () => {
  expect(distanceKm(hamra, dbayeh)).toBeCloseTo(10.8, 0);
  expect(distanceKm(hamra, hamra)).toBe(0);
});

test('distances read naturally', () => {
  expect(formatDistance(0.42)).toBe('420 m');
  expect(formatDistance(2.345)).toBe('2.3 km');
  expect(formatDistance(12.6)).toBe('13 km');
});

test('stores sort nearest first when we know where you are, otherwise keep their order', () => {
  const stores = [
    { slug: 'far', lat: 34.43, lng: 35.84 },
    { slug: 'near', lat: 33.9, lng: 35.49 },
    { slug: 'nowhere', lat: null, lng: null },
  ];
  expect(sortByDistance(stores, hamra).map((s) => s.slug)).toEqual(['near', 'far', 'nowhere']);
  expect(sortByDistance(stores, null).map((s) => s.slug)).toEqual(['far', 'near', 'nowhere']);
});

test('directions open Google Maps at the store', () => {
  expect(directionsUrl({ lat: 33.8966, lng: 35.4823, name: 'Spinneys Hamra', address: null, city: 'Beirut' })).toBe(
    'https://www.google.com/maps/dir/?api=1&destination=33.8966%2C35.4823',
  );
  expect(directionsUrl({ lat: null, lng: null, name: 'Azzi', address: 'Main Road', city: 'Jal el Dib' })).toBe(
    'https://www.google.com/maps/dir/?api=1&destination=Azzi%2C+Main+Road%2C+Jal+el+Dib%2C+Lebanon',
  );
});

test('search matches name, chain, area and city, ignoring case and accents', () => {
  const s = { name: 'Fahed Supermarket', chain: 'Fahed', area: 'Achrafieh', city: 'Beirut' };
  expect(matchesStoreSearch(s, 'achraf')).toBe(true);
  expect(matchesStoreSearch(s, 'BEIRUT')).toBe(true);
  expect(matchesStoreSearch(s, 'Achrafiéh')).toBe(true);
  expect(matchesStoreSearch(s, 'tripoli')).toBe(false);
  expect(matchesStoreSearch(s, '  ')).toBe(true);
});
