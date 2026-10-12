import { mixHighlights } from '@/lib/mix-box/highlights';

const c = (name: string, flavour: string, flavourProfiles: string[]) => ({ name, flavour, image: `/${flavour}.webp`, flavourProfiles });

const mockupBox = [
  c('Fusilli Cup', 'Spicy Muhammara', ['spicy']),
  c('Fusilli Cup', 'Al Pesto Genovese', ['herby']),
  c('Rishta Cup', 'Lentil & Pasta Soup', ['soupy', 'comforting']),
  c('Pastina Cup', 'Sweet Cinnamon Milk Pasta', ['sweet', 'comforting']),
  c('Tagliolini Cup', 'Al Tartufo Bianco', ['creamy']),
];

test('the mockup box covers every mood in order', () => {
  const highlights = mixHighlights(mockupBox);
  expect(highlights.map((h) => h.key)).toEqual(['bold', 'fresh', 'comforting', 'sweet', 'indulgent']);
  expect(highlights[0]).toEqual({
    key: 'bold',
    title: 'Bold & Spicy',
    text: 'Fusilli Cup Spicy Muhammara brings vibrant, smoky flavours.',
    image: '/Spicy Muhammara.webp',
  });
});

test('several cups in one mood share a highlight with a plural verb', () => {
  const [only] = mixHighlights([c('Tagliolini Cup', 'Al Tartufo Bianco', ['creamy']), c('Tagliolini Cup', 'Al Limone', ['creamy'])]);
  expect(only.key).toBe('indulgent');
  expect(only.text).toBe('Tagliolini Cup Al Tartufo Bianco and Tagliolini Cup Al Limone bring a luxurious, gourmet finish.');
});

test('duplicates are named once and untagged cups are skipped', () => {
  const highlights = mixHighlights([mockupBox[0], mockupBox[0], c('Mystery Cup', 'Plain', [])]);
  expect(highlights).toHaveLength(1);
  expect(highlights[0].text).toBe('Fusilli Cup Spicy Muhammara brings vibrant, smoky flavours.');
});

test('an empty box has no highlights', () => expect(mixHighlights([])).toEqual([]));
