import { z } from 'zod';
import { all, checkbox, type FormResult, num, optionalText, parseWith, text } from './form-data';
import { parseLines, parseSteps, slugify } from './product-form';

/** The recipe page categories (the filters on /recipes). */
export const RECIPE_TAGS = ['quick-meals', 'extra-protein', 'mediterranean-twists', 'comfort-food', 'soups', 'vegetarian'] as const;
export const RECIPE_TAG_LABEL: Record<(typeof RECIPE_TAGS)[number], string> = {
  'quick-meals': 'Quick meals',
  'extra-protein': 'Extra protein',
  'mediterranean-twists': 'Mediterranean twists',
  'comfort-food': 'Comfort food',
  soups: 'Soups',
  vegetarian: 'Vegetarian',
};
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A site path (/images/…) or an https link (uploaded photos). */
const imageLink = z
  .string()
  .max(500)
  .refine((v) => {
    if (/^\/[A-Za-z0-9/_.-]+$/.test(v) && !v.includes('..')) return true;
    try {
      return new URL(v).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Use an uploaded photo, a site path like /images/…, or an https link.')
  .nullable();

const recipeSchema = z
  .object({
    title: z.string().min(1, 'Enter a title.').max(120),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes.').max(120),
    subtitle: z.string().max(160).nullable(),
    heroImage: imageLink,
    minutes: z.number({ error: 'Enter the minutes.' }).int('Use whole minutes.').min(1, 'At least 1 minute.').max(240, 'At most 240 minutes.'),
    difficulty: z.enum(DIFFICULTIES),
    servings: z.string().min(1, 'Enter the servings.').max(20),
    cupsUsed: z.number().int().min(1).max(10),
    isVegetarian: z.boolean(),
    tags: z.array(z.enum(RECIPE_TAGS)),
    productId: z.string().regex(UUID).nullable(),
    intro: z.string().max(1000).nullable(),
    ingredients: z.array(z.string().max(200)).max(40),
    steps: z.array(z.object({ title: z.string().max(120), body: z.string().max(800) })).max(20),
    tip: z.string().max(500).nullable(),
    status: z.enum(['draft', 'published']),
    sortOrder: z.number().int(),
  })
  .superRefine((r, ctx) => {
    if (r.status === 'published' && r.steps.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['steps'], message: 'Add at least one step before publishing.' });
    }
  });

export type RecipeInput = z.infer<typeof recipeSchema>;

export function parseRecipeForm(fd: FormData): FormResult<RecipeInput> {
  const title = text(fd, 'title');
  const isVegetarian = checkbox(fd, 'isVegetarian');
  const picked = all(fd, 'tags').filter((t): t is (typeof RECIPE_TAGS)[number] => (RECIPE_TAGS as readonly string[]).includes(t) && t !== 'vegetarian');
  const productId = text(fd, 'productId');
  return parseWith(recipeSchema, {
    title,
    // No title: only the title is reported, not a slug made from nothing.
    slug: text(fd, 'slug') || (title ? slugify(title) : 'untitled'),
    subtitle: optionalText(fd, 'subtitle'),
    heroImage: optionalText(fd, 'heroImage'),
    minutes: num(fd, 'minutes') ?? Number.NaN,
    difficulty: text(fd, 'difficulty') || 'Easy',
    servings: text(fd, 'servings') || '1–2',
    cupsUsed: num(fd, 'cupsUsed') ?? 1,
    isVegetarian,
    // "Vegetarian" is also a filter on /recipes, so it follows the checkbox.
    tags: isVegetarian ? [...picked, 'vegetarian'] : picked,
    productId: productId || null,
    intro: optionalText(fd, 'intro'),
    ingredients: parseLines(text(fd, 'ingredients')),
    steps: parseSteps(text(fd, 'steps')),
    tip: optionalText(fd, 'tip'),
    status: text(fd, 'status') === 'published' ? 'published' : 'draft',
    sortOrder: num(fd, 'sortOrder') ?? 0,
  });
}

export function toRecipeRow(r: RecipeInput) {
  return {
    title: r.title,
    slug: r.slug,
    subtitle: r.subtitle,
    hero_image: r.heroImage,
    minutes: r.minutes,
    difficulty: r.difficulty,
    servings: r.servings,
    cups_used: r.cupsUsed,
    is_vegetarian: r.isVegetarian,
    tags: r.tags,
    product_id: r.productId,
    intro: r.intro,
    ingredients: r.ingredients,
    steps: r.steps,
    tip: r.tip,
    status: r.status,
    sort_order: r.sortOrder,
  };
}

export interface RecipeDefaults {
  id: string | null;
  title: string;
  slug: string;
  subtitle: string;
  heroImage: string;
  minutes: string;
  difficulty: string;
  servings: string;
  cupsUsed: string;
  isVegetarian: boolean;
  tags: string[];
  productId: string;
  intro: string;
  ingredients: string;
  steps: string;
  tip: string;
  status: string;
  sortOrder: string;
}

export const NEW_RECIPE: RecipeDefaults = {
  id: null,
  title: '',
  slug: '',
  subtitle: '',
  heroImage: '',
  minutes: '10',
  difficulty: 'Easy',
  servings: '1–2',
  cupsUsed: '1',
  isVegetarian: false,
  tags: [],
  productId: '',
  intro: '',
  ingredients: '',
  steps: '',
  tip: '',
  status: 'draft',
  sortOrder: '0',
};

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));

export function recipeDefaults(row: Row): RecipeDefaults {
  const steps = Array.isArray(row.steps) ? (row.steps as Row[]) : [];
  return {
    id: s(row.id),
    title: s(row.title),
    slug: s(row.slug),
    subtitle: s(row.subtitle),
    heroImage: s(row.hero_image),
    minutes: s(row.minutes),
    difficulty: s(row.difficulty) || 'Easy',
    servings: s(row.servings),
    cupsUsed: s(row.cups_used),
    isVegetarian: Boolean(row.is_vegetarian),
    tags: Array.isArray(row.tags) ? (row.tags as unknown[]).map(String).filter((t) => t !== 'vegetarian') : [],
    productId: s(row.product_id),
    intro: s(row.intro),
    ingredients: (Array.isArray(row.ingredients) ? (row.ingredients as unknown[]) : []).map(String).join('\n'),
    steps: steps.map((st) => (st.body ? `${s(st.title)}: ${s(st.body)}` : s(st.title))).join('\n'),
    tip: s(row.tip),
    status: s(row.status) || 'draft',
    sortOrder: s(row.sort_order),
  };
}
