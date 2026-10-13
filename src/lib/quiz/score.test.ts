import { emptyAnswers, QUIZ_QUESTIONS } from '@/lib/quiz/config';
import { quizPicks, rankCups, scoreCup, suggestedMix, tasteProfile, toggleAnswer } from '@/lib/quiz/score';
import type { Product } from '@/lib/types';

function makeProduct(slug: string, overrides: Partial<Product> = {}): Product {
  return {
    id: slug, slug, name: 'Cup', flavour: slug, type: 'cup', status: 'active', tagline: null, sauce: null,
    shortDescription: null, description: null, story: null, price: 4.5, compareAtPrice: null, stock: 10,
    trackInventory: true, allowBackorder: false, proteinG: 30, prepMinutes: 4, isBestSeller: false,
    isFeatured: false, sortOrder: 0, badges: [], ingredients: [], nutrition: [], preparation: [],
    flavourProfiles: [], spiceLevel: 0, textures: [], occasions: [], style: null, bundleSize: null,
    ratingAvg: null, ratingCount: 0, images: [], collections: [], seoTitle: null, seoDescription: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const pastina = makeProduct('pastina', { flavourProfiles: ['sweet', 'comforting'], textures: ['soft'], occasions: ['at-home'], style: 'fusion', sortOrder: 1 });
const muhammara = makeProduct('muhammara', { flavourProfiles: ['spicy'], spiceLevel: 3, textures: ['twirly'], occasions: ['quick-lunch', 'on-the-go', 'post-workout'], style: 'lebanese', sortOrder: 2 });
const rishta = makeProduct('rishta', { flavourProfiles: ['soupy', 'comforting'], spiceLevel: 1, textures: ['brothy'], occasions: ['at-home', 'quick-lunch'], style: 'lebanese', sortOrder: 3 });
const pesto = makeProduct('pesto', { flavourProfiles: ['herby'], textures: ['twirly'], occasions: ['quick-lunch', 'at-home'], style: 'italian', sortOrder: 4 });
const truffle = makeProduct('truffle', { flavourProfiles: ['creamy'], textures: ['twirly', 'creamy'], occasions: ['at-home'], style: 'italian', sortOrder: 5 });
const mac = makeProduct('mac', { flavourProfiles: ['creamy', 'comforting'], textures: ['creamy', 'soft'], occasions: ['at-home'], style: 'italian', sortOrder: 6 });
const toum = makeProduct('toum', { flavourProfiles: ['comforting'], textures: ['twirly'], occasions: ['quick-lunch'], style: 'lebanese', sortOrder: 7 });
const cups = [mac, toum, truffle, pesto, rishta, muhammara, pastina];

const slugs = (ps: Product[]) => ps.map((p) => p.slug);
const answers = (picked: Partial<Record<string, string[]>>) => ({ ...emptyAnswers(), ...picked });

test('has the six steps from the spec, in order', () => {
  expect(QUIZ_QUESTIONS.map((q) => q.id)).toEqual(['flavours', 'spice', 'texture', 'occasion', 'priority', 'style']);
  expect(QUIZ_QUESTIONS[0].max).toBe(3);
  expect(QUIZ_QUESTIONS[0].options.map((o) => o.label)).toEqual([
    'Spicy & Bold', 'Creamy & Rich', 'Fresh & Herby', 'Comforting & Classic', 'Soupy & Light', 'Sweet & Unique',
  ]);
  expect(QUIZ_QUESTIONS[1].options.map((o) => o.label)).toEqual(['No Heat', 'Mild Warmth', 'Medium Kick', 'Spicy', 'Extra Hot']);
  for (const q of QUIZ_QUESTIONS) for (const o of q.options) expect(o.image).toMatch(/^\/images\/quiz\/[a-z0-9-]+\.webp$/);
});

test('with no answers keeps shop order', () => {
  expect(slugs(rankCups(cups, emptyAnswers()))).toEqual(['pastina', 'muhammara', 'rishta', 'pesto', 'truffle', 'mac', 'toum']);
});

test('favourite flavours lead the ranking', () => {
  expect(rankCups(cups, answers({ flavours: ['spicy'] }))[0].slug).toBe('muhammara');
  expect(slugs(rankCups(cups, answers({ flavours: ['soupy', 'sweet'] })).slice(0, 2))).toEqual(['pastina', 'rishta']);
});

test('spice level rewards cups close to the chosen heat', () => {
  expect(rankCups(cups, answers({ spice: ['3'] }))[0].slug).toBe('muhammara');
  const noHeat = answers({ spice: ['0'] });
  expect(scoreCup(muhammara, noHeat)).toBeLessThan(scoreCup(pesto, noHeat));
});

test('texture, occasion and style each count', () => {
  expect(rankCups(cups, answers({ texture: ['brothy'] }))[0].slug).toBe('rishta');
  expect(rankCups(cups, answers({ occasion: ['post-workout'] }))[0].slug).toBe('muhammara');
  expect(slugs(rankCups(cups, answers({ style: ['italian'] })).slice(0, 3))).toEqual(['pesto', 'truffle', 'mac']);
  expect(rankCups(cups, answers({ style: ['both'] }))[0].slug).toBe('pastina');
});

test('purchase priority boosts bold or comforting cups', () => {
  expect(rankCups(cups, answers({ priority: ['bold'] }))[0].slug).toBe('muhammara');
  const comfort = rankCups(cups, answers({ priority: ['comfort'] }));
  expect(slugs(comfort.slice(0, 4)).sort()).toEqual(['mac', 'pastina', 'rishta', 'truffle']);
});

test('picks a best match, an alternative and a discovery in a different style', () => {
  const ranked = rankCups(cups, answers({ flavours: ['spicy', 'comforting'], style: ['lebanese'] }));
  expect(slugs(ranked.slice(0, 3))).toEqual(['muhammara', 'rishta', 'toum']);
  const picks = quizPicks(ranked);
  expect(picks.map((p) => p.product.slug)).toEqual(['muhammara', 'rishta', 'pastina']);
  expect(picks.map((p) => p.kind)).toEqual(['best', 'also', 'discovery']);
});

test('falls back to the third cup when every cup shares a style', () => {
  const same = [muhammara, rishta, toum];
  expect(quizPicks(rankCups(same, emptyAnswers())).map((p) => p.product.slug)).toEqual(['muhammara', 'rishta', 'toum']);
});

test('suggests a 5-cup mix of the top distinct cups', () => {
  const ranked = rankCups(cups, answers({ flavours: ['creamy'] }));
  const mix = suggestedMix(ranked, 5);
  expect(mix.map((m) => [m.product.slug, m.quantity])).toEqual([
    ['truffle', 1], ['mac', 1], ['pastina', 1], ['muhammara', 1], ['rishta', 1],
  ]);
});

test('with few cups the mix holds at most 2 of any one', () => {
  expect(suggestedMix([muhammara, pesto, rishta], 5).map((m) => [m.product.slug, m.quantity])).toEqual([
    ['muhammara', 2], ['pesto', 2], ['rishta', 1],
  ]);
  const short = suggestedMix([muhammara, pesto], 5);
  expect(short.reduce((n, m) => n + m.quantity, 0)).toBe(4);
});

test('the mix skips cups that cannot be bought', () => {
  const soldOut = { ...muhammara, stock: 0 };
  const mix = suggestedMix([soldOut, ...cups.filter((c) => c !== muhammara)], 5);
  expect(mix.map((m) => m.product.slug)).not.toContain('muhammara');
});

test('toggling keeps to the step limit', () => {
  const flavours = QUIZ_QUESTIONS[0];
  let picked: string[] = [];
  for (const id of ['spicy', 'creamy', 'herby', 'sweet']) picked = toggleAnswer(flavours, picked, id);
  expect(picked).toEqual(['spicy', 'creamy', 'herby']);
  expect(toggleAnswer(flavours, picked, 'creamy')).toEqual(['spicy', 'herby']);
  const spice = QUIZ_QUESTIONS[1];
  expect(toggleAnswer(spice, ['1'], '3')).toEqual(['3']);
  expect(toggleAnswer(spice, ['3'], '3')).toEqual([]);
});

test('describes the taste profile from the first favourite flavour', () => {
  expect(tasteProfile(emptyAnswers())).toBeNull();
  expect(tasteProfile(answers({ flavours: ['spicy', 'sweet'] }))?.title).toBe('Bold flavours are your thing.');
  expect(tasteProfile(answers({ flavours: ['soupy'] }))?.title).toBe('Warm and soupy is your thing.');
});
