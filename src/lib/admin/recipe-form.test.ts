import { parseRecipeForm, recipeDefaults } from '@/lib/admin/recipe-form';

function form(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const item of Array.isArray(v) ? v : [v]) fd.append(k, item);
  return fd;
}

const base = {
  title: 'Rishta Soup with Lemon & Herbs',
  minutes: '12',
  difficulty: 'Easy',
  servings: '1–2',
  cupsUsed: '1',
  status: 'published',
  sortOrder: '5',
};

test('a recipe gets its slug from the title, lines become ingredients and steps, vegetarian becomes a tag', () => {
  const r = parseRecipeForm(
    form({
      ...base,
      isVegetarian: 'on',
      tags: ['soups', 'nonsense'],
      ingredients: '1 MAGO Rishta Cup\n\nJuice of half a lemon',
      steps: 'Prepare your cup: Add hot water.\nServe',
      heroImage: '/images/lifestyle-rainy-day-soup.webp',
      productId: '00000000-0000-4000-8000-000000000001',
    }),
  );
  expect(r).toMatchObject({
    ok: true,
    data: {
      slug: 'rishta-soup-with-lemon-herbs',
      minutes: 12,
      tags: ['soups', 'vegetarian'],
      ingredients: ['1 MAGO Rishta Cup', 'Juice of half a lemon'],
      steps: [{ title: 'Prepare your cup', body: 'Add hot water.' }, { title: 'Serve', body: '' }],
      heroImage: '/images/lifestyle-rainy-day-soup.webp',
      productId: '00000000-0000-4000-8000-000000000001',
      isVegetarian: true,
    },
  });
});

test('refuses a missing title, zero minutes, odd image links and no steps when published', () => {
  const r = parseRecipeForm(form({ ...base, title: '', minutes: '0', heroImage: 'javascript:alert(1)', steps: '' }));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(Object.keys(r.fieldErrors).sort()).toEqual(['heroImage', 'minutes', 'steps', 'title']);
  const draft = parseRecipeForm(form({ ...base, status: 'draft', steps: '' }));
  expect(draft.ok).toBe(true);
});

test('editor defaults turn the stored lists back into lines', () => {
  const d = recipeDefaults({
    id: 'r1', slug: 's', title: 'T', subtitle: null, hero_image: null, minutes: 10, difficulty: 'Easy', servings: '1–2', cups_used: 1,
    is_vegetarian: false, tags: ['quick-meals'], product_id: null, intro: null, ingredients: ['A', 'B'],
    steps: [{ title: 'One', body: 'Do it' }, { title: 'Two', body: '' }], tip: null, status: 'draft', sort_order: 0,
  });
  expect(d.ingredients).toBe('A\nB');
  expect(d.steps).toBe('One: Do it\nTwo');
  expect(d.tags).toEqual(['quick-meals']);
});
