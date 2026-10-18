import { describe, expect, it } from 'vitest';
import { ingredientPhoto } from './ingredient-icons';

describe('ingredientPhoto', () => {
  it('finds photos by ingredient name, ignoring case and spacing', () => {
    expect(ingredientPhoto('Roasted Red Peppers')).toBe('/images/ingredients/roasted-red-peppers.webp');
    expect(ingredientPhoto('  olive OIL ')).toBe('/images/ingredients/olive-oil.webp');
  });
  it('follows aliases', () => {
    expect(ingredientPhoto('Parmesan Cheese')).toBe('/images/ingredients/parmesan.webp');
    expect(ingredientPhoto('Lemons')).toBe('/images/ingredients/lemon.webp');
  });
  it('returns null when there is no photo', () => {
    expect(ingredientPhoto('Lentils')).toBeNull();
    expect(ingredientPhoto('')).toBeNull();
  });
});
