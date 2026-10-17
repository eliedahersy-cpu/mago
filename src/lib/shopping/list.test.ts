import { describe, expect, it } from 'vitest';
import { buildList, listAsText, parseIngredient, sanitizeRecipes, type ListRecipe } from './list';

const a: ListRecipe = {
  slug: 'a',
  title: 'Muhammara Fusilli',
  ingredients: ['1 MAGO Fusilli Cup Spicy Muhammara', '1 cup cherry tomatoes, halved', '1 tbsp olive oil', 'Optional: crumbled feta or labneh'],
  have: [],
};
const b: ListRecipe = {
  slug: 'b',
  title: 'Pesto Chicken',
  ingredients: ['1 MAGO Fusilli Cup Al Pesto Genovese', '1 cup cherry tomatoes', '1 tbsp olive oil', 'Fresh basil leaves'],
  have: [],
};

describe('parseIngredient', () => {
  it('splits amount, unit, name and note', () => {
    expect(parseIngredient('1 cup cherry tomatoes, halved')).toEqual({ qty: 1, unit: 'cup', name: 'cherry tomatoes', note: 'halved', optional: false });
    expect(parseIngredient('½ lemon')).toMatchObject({ qty: 0.5, name: 'lemon' });
    expect(parseIngredient('Optional: chopped walnuts')).toMatchObject({ qty: null, optional: true, name: 'chopped walnuts' });
  });
});

describe('buildList', () => {
  it('adds the same ingredient across recipes', () => {
    const items = buildList([a, b]);
    expect(items.find((i) => i.label.includes('tomatoes'))).toMatchObject({ label: '2 cups cherry tomatoes', recipes: ['Muhammara Fusilli', 'Pesto Chicken'] });
    expect(items.find((i) => i.label.includes('olive oil'))?.label).toBe('2 tbsp olive oil');
  });
  it('leaves out what the customer has', () => {
    const items = buildList([{ ...a, have: [1, 2] }, b]);
    expect(items.find((i) => i.label.includes('tomatoes'))?.label).toBe('1 cup cherry tomatoes');
    expect(items.find((i) => i.label.includes('olive oil'))?.label).toBe('1 tbsp olive oil');
  });
  it('marks MAGO cups and keeps different cups apart', () => {
    const cups = buildList([a, b]).filter((i) => i.isCup);
    expect(cups.map((c) => c.label)).toEqual(['1 MAGO Fusilli Cup Spicy Muhammara', '1 MAGO Fusilli Cup Al Pesto Genovese']);
  });
  it('is empty when everything is owned', () => {
    expect(buildList([{ ...b, have: [0, 1, 2, 3] }])).toEqual([]);
  });
});

describe('listAsText', () => {
  it('groups cups first', () => {
    const text = listAsText(buildList([b]));
    expect(text.startsWith('MAGO shopping list\n\nMAGO cups\n- 1 MAGO Fusilli Cup Al Pesto Genovese')).toBe(true);
    expect(text).toContain('From the shop\n- 1 cup cherry tomatoes');
  });
});

describe('sanitizeRecipes', () => {
  it('drops malformed entries, duplicates and bad indexes', () => {
    const out = sanitizeRecipes([a, { ...a }, null, { slug: 1 }, { slug: 'c', title: 'C', ingredients: ['x'], have: [0, 5, 'y'] }]);
    expect(out.map((r) => r.slug)).toEqual(['a', 'c']);
    expect(out[1].have).toEqual([0]);
  });
  it('returns an empty list for junk', () => {
    expect(sanitizeRecipes('nope')).toEqual([]);
  });
});
