import { z } from 'zod';
import { all, checkbox, type FormResult, num, optionalText, parseWith, text } from './form-data';

export const FLAVOUR_PROFILES = ['spicy', 'creamy', 'herby', 'comforting', 'soupy', 'sweet'] as const;
export const TEXTURES = ['twirly', 'brothy', 'creamy', 'soft'] as const;
export const OCCASIONS = ['quick-lunch', 'on-the-go', 'at-home', 'post-workout'] as const;
export const STYLES = ['lebanese', 'italian', 'fusion'] as const;
export const PRODUCT_TYPES = ['cup', 'bundle', 'extra', 'retail', 'merch'] as const;
export const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lowercase ASCII words joined by single dashes. */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** One item per non-empty line. */
export function parseLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** "Label: value" lines (lines without a colon are skipped). */
export function parsePairs(value: string): { label: string; value: string }[] {
  return parseLines(value).flatMap((line) => {
    const at = line.indexOf(':');
    if (at <= 0) return [];
    return [{ label: line.slice(0, at).trim(), value: line.slice(at + 1).trim() }];
  });
}

/** "Title: body" lines; a line without a colon is a title alone. */
export function parseSteps(value: string): { title: string; body: string }[] {
  return parseLines(value).map((line) => {
    const at = line.indexOf(':');
    return at > 0 ? { title: line.slice(0, at).trim(), body: line.slice(at + 1).trim() } : { title: line, body: '' };
  });
}

const money = (label: string) => z.number({ error: `Enter the ${label}.` }).finite(`Enter the ${label}.`).min(0, `The ${label} cannot be negative.`);
const count = (label: string) => z.number({ error: `Enter the ${label}.` }).int(`The ${label} must be a whole number.`);
const optionalInt = (label: string) => z.number().int(`${label} must be a whole number.`).min(0, `${label} cannot be negative.`).nullable();

const productSchema = z
  .object({
    name: z.string().min(1, 'Enter a name.').max(120),
    flavour: z.string().max(120).nullable(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes.').max(120),
    type: z.enum(PRODUCT_TYPES),
    status: z.enum(PRODUCT_STATUSES),
    sauce: z.string().max(200).nullable(),
    tagline: z.string().max(200).nullable(),
    shortDescription: z.string().max(400).nullable(),
    description: z.string().max(4000).nullable(),
    story: z.string().max(4000).nullable(),
    price: money('price'),
    compareAtPrice: money('compare-at price').nullable(),
    sku: z.string().max(64).nullable(),
    stock: count('stock'),
    trackInventory: z.boolean(),
    allowBackorder: z.boolean(),
    lowStockThreshold: count('low-stock level').min(0, 'The low-stock level cannot be negative.'),
    proteinG: optionalInt('Protein'),
    prepMinutes: optionalInt('Preparation time'),
    isBestSeller: z.boolean(),
    isFeatured: z.boolean(),
    sortOrder: count('sort order'),
    badges: z.array(z.string().max(40)),
    ingredients: z.array(z.object({ name: z.string().max(80) })),
    nutrition: z.array(z.object({ label: z.string().max(80), value: z.string().max(80) })),
    preparation: z.array(z.object({ title: z.string().max(120), body: z.string().max(400) })),
    flavourProfiles: z.array(z.enum(FLAVOUR_PROFILES)),
    spiceLevel: z.number().int().min(0).max(4),
    textures: z.array(z.enum(TEXTURES)),
    occasions: z.array(z.enum(OCCASIONS)),
    style: z.enum(STYLES).nullable(),
    bundleSize: z.number().int().min(1, 'A bundle holds at least 1 item.').max(24).nullable(),
    seoTitle: z.string().max(120).nullable(),
    seoDescription: z.string().max(300).nullable(),
    collectionIds: z.array(z.string()),
  })
  .refine((p) => p.compareAtPrice === null || p.compareAtPrice > p.price, {
    path: ['compareAtPrice'],
    message: 'Compare-at price must be higher than the price.',
  });

export type ProductInput = z.infer<typeof productSchema>;

const pick = <T extends string>(list: readonly T[], values: string[]) => values.filter((v): v is T => (list as readonly string[]).includes(v));

/** Reads and validates the product editor form. */
export function parseProductForm(fd: FormData): FormResult<ProductInput> {
  const name = text(fd, 'name');
  const flavour = optionalText(fd, 'flavour');
  const style = text(fd, 'style');
  return parseWith(productSchema, {
    name,
    flavour,
    // No name: only the name is reported, not a slug made from nothing.
    slug: text(fd, 'slug') || (name ? slugify([name, flavour].filter(Boolean).join(' ')) : 'untitled'),
    type: text(fd, 'type'),
    status: text(fd, 'status'),
    sauce: optionalText(fd, 'sauce'),
    tagline: optionalText(fd, 'tagline'),
    shortDescription: optionalText(fd, 'shortDescription'),
    description: optionalText(fd, 'description'),
    story: optionalText(fd, 'story'),
    price: num(fd, 'price') ?? Number.NaN,
    compareAtPrice: num(fd, 'compareAtPrice'),
    sku: optionalText(fd, 'sku'),
    stock: num(fd, 'stock') ?? 0,
    trackInventory: checkbox(fd, 'trackInventory'),
    allowBackorder: checkbox(fd, 'allowBackorder'),
    lowStockThreshold: num(fd, 'lowStockThreshold') ?? 10,
    proteinG: num(fd, 'proteinG'),
    prepMinutes: num(fd, 'prepMinutes'),
    isBestSeller: checkbox(fd, 'isBestSeller'),
    isFeatured: checkbox(fd, 'isFeatured'),
    sortOrder: num(fd, 'sortOrder') ?? 0,
    badges: parseLines(text(fd, 'badges')),
    ingredients: parseLines(text(fd, 'ingredients')).map((n) => ({ name: n })),
    nutrition: parsePairs(text(fd, 'nutrition')),
    preparation: parseSteps(text(fd, 'preparation')),
    flavourProfiles: pick(FLAVOUR_PROFILES, all(fd, 'flavourProfiles')),
    spiceLevel: num(fd, 'spiceLevel') ?? 0,
    textures: pick(TEXTURES, all(fd, 'textures')),
    occasions: pick(OCCASIONS, all(fd, 'occasions')),
    style: (STYLES as readonly string[]).includes(style) ? style : null,
    bundleSize: num(fd, 'bundleSize'),
    seoTitle: optionalText(fd, 'seoTitle'),
    seoDescription: optionalText(fd, 'seoDescription'),
    collectionIds: all(fd, 'collectionIds').filter((id) => UUID.test(id)),
  });
}

/** The row shape written to public.products. */
export function toProductRow(p: ProductInput) {
  return {
    name: p.name,
    flavour: p.flavour,
    slug: p.slug,
    type: p.type,
    status: p.status,
    sauce: p.sauce,
    tagline: p.tagline,
    short_description: p.shortDescription,
    description: p.description,
    story: p.story,
    price: p.price,
    compare_at_price: p.compareAtPrice,
    sku: p.sku,
    track_inventory: p.trackInventory,
    allow_backorder: p.allowBackorder,
    low_stock_threshold: p.lowStockThreshold,
    protein_g: p.proteinG,
    prep_minutes: p.prepMinutes,
    is_best_seller: p.isBestSeller,
    is_featured: p.isFeatured,
    sort_order: p.sortOrder,
    badges: p.badges,
    ingredients: p.ingredients,
    nutrition: p.nutrition,
    preparation: p.preparation,
    flavour_profiles: p.flavourProfiles,
    spice_level: p.spiceLevel,
    textures: p.textures,
    occasions: p.occasions,
    style: p.style,
    bundle_size: p.bundleSize,
    seo_title: p.seoTitle,
    seo_description: p.seoDescription,
  };
}
