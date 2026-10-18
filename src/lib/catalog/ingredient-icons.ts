/** Ingredients that have a photo in /images/ingredients (cut from the approved product-page designs). */
const PHOTOS = new Set([
  'basil',
  'black-pepper',
  'butter',
  'carrots',
  'celery',
  'chickpeas',
  'garlic',
  'lemon',
  'mediterranean-spices',
  'olive-oil',
  'parmesan',
  'parsley',
  'pine-nuts',
  'roasted-red-peppers',
  'tomatoes',
  'walnuts',
]);

const ALIASES: Record<string, string> = {
  'parmesan-cheese': 'parmesan',
  lemons: 'lemon',
  'red-peppers': 'roasted-red-peppers',
  walnut: 'walnuts',
  tomato: 'tomatoes',
  carrot: 'carrots',
};

/** The photo for an ingredient name such as "Roasted Red Peppers", or null when there is none. */
export function ingredientPhoto(name: string): string | null {
  const key = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z]+/g, '-')
    .replace(/^-|-$/g, '');
  const file = ALIASES[key] ?? key;
  return PHOTOS.has(file) ? `/images/ingredients/${file}.webp` : null;
}
