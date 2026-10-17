/** Shopping list: ingredients from the chosen recipes, minus what the customer already has, merged. */

export interface ListRecipe {
  slug: string;
  title: string;
  ingredients: string[];
  /** Positions in `ingredients` the customer already has at home. */
  have: number[];
}

export interface ListItem {
  key: string;
  label: string;
  /** Titles of the recipes that need it. */
  recipes: string[];
  isCup: boolean;
}

interface Parsed {
  qty: number | null;
  unit: string;
  name: string;
  note: string;
  optional: boolean;
}

const UNITS = new Set(['cup', 'cups', 'tbsp', 'tsp', 'kg', 'g', 'ml', 'l', 'can', 'cans', 'clove', 'cloves', 'slice', 'slices']);
const NO_PLURAL = new Set(['tbsp', 'tsp', 'kg', 'g', 'ml', 'l']);
const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75 };

function toNumber(raw: string): number | null {
  const t = raw.trim();
  if (FRACTIONS[t] !== undefined) return FRACTIONS[t];
  const frac = /^(\d+)\/(\d+)$/.exec(t);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function parseIngredient(text: string): Parsed {
  let rest = text.trim();
  const optional = /^optional:\s*/i.test(rest);
  rest = rest.replace(/^optional:\s*/i, '');

  const comma = rest.indexOf(',');
  const note = comma >= 0 ? rest.slice(comma + 1).trim() : '';
  if (comma >= 0) rest = rest.slice(0, comma).trim();

  let qty: number | null = null;
  const lead = /^(\d+(?:[.,]\d+)?\s*[½¼¾]?|\d+\/\d+|[½¼¾])\s+(.*)$/.exec(rest);
  if (lead) {
    const q = toNumber(lead[1].replace(/\s+/g, ''));
    if (q !== null) {
      qty = q;
      rest = lead[2];
    }
  }
  let unit = '';
  const first = rest.split(/\s+/)[0]?.toLowerCase();
  if (qty !== null && first && UNITS.has(first)) {
    unit = first.replace(/s$/, '');
    rest = rest.slice(first.length).trim();
  }
  return { qty, unit, name: rest, note, optional };
}

function singular(name: string): string {
  return name.toLowerCase().replace(/ies\b/g, 'y').replace(/(?<=[a-z])s\b/g, '');
}

function formatQty(n: number): string {
  const whole = Math.floor(n);
  const frac = n - whole;
  const sym = frac === 0.5 ? '½' : frac === 0.25 ? '¼' : frac === 0.75 ? '¾' : '';
  if (sym) return whole ? `${whole}${sym}` : sym;
  return String(Math.round(n * 100) / 100);
}

/** What the customer still needs to buy: not-owned ingredients of every chosen recipe, same things merged. */
export function buildList(recipes: ListRecipe[]): ListItem[] {
  const groups = new Map<string, { parsed: Parsed; qty: number | null; recipes: string[]; optional: boolean }>();
  for (const r of recipes) {
    r.ingredients.forEach((text, i) => {
      if (r.have.includes(i)) return;
      const parsed = parseIngredient(text);
      const key = `${parsed.unit}|${singular(parsed.name)}`;
      const g = groups.get(key);
      if (g) {
        g.qty = g.qty !== null && parsed.qty !== null ? g.qty + parsed.qty : (g.qty ?? parsed.qty);
        if (!g.recipes.includes(r.title)) g.recipes.push(r.title);
        g.optional = g.optional && parsed.optional;
      } else {
        groups.set(key, { parsed, qty: parsed.qty, recipes: [r.title], optional: parsed.optional });
      }
    });
  }
  return [...groups.entries()].map(([key, g]) => {
    const { unit, name, note } = g.parsed;
    const unitText = unit ? ` ${unit}${g.qty !== null && g.qty > 1 && !NO_PLURAL.has(unit) ? 's' : ''}` : '';
    const amount = g.qty !== null ? `${formatQty(g.qty)}${unitText} ` : '';
    const isCup = /^MAGO\b/i.test(name);
    const detail = g.recipes.length === 1 && note ? `, ${note}` : '';
    return { key, label: `${g.optional ? 'Optional: ' : ''}${amount}${name}${detail}`, recipes: g.recipes, isCup };
  });
}

/** Plain text for sharing or copying. */
export function listAsText(items: ListItem[]): string {
  const cups = items.filter((i) => i.isCup);
  const rest = items.filter((i) => !i.isCup);
  const lines = ['MAGO shopping list', ''];
  if (cups.length) lines.push('MAGO cups', ...cups.map((i) => `- ${i.label}`), '');
  if (rest.length) lines.push('From the shop', ...rest.map((i) => `- ${i.label}`), '');
  return lines.join('\n').trimEnd();
}

/** Keeps only well-formed saved recipes (the data comes from the browser). */
export function sanitizeRecipes(input: unknown): ListRecipe[] {
  if (!Array.isArray(input)) return [];
  const out: ListRecipe[] = [];
  for (const r of input) {
    if (!r || typeof r !== 'object') continue;
    const { slug, title, ingredients, have } = r as Record<string, unknown>;
    if (typeof slug !== 'string' || typeof title !== 'string' || !Array.isArray(ingredients)) continue;
    const ing = ingredients.filter((x): x is string => typeof x === 'string');
    const h = Array.isArray(have) ? have.filter((x): x is number => Number.isInteger(x) && x >= 0 && x < ing.length) : [];
    if (!out.some((o) => o.slug === slug)) out.push({ slug, title, ingredients: ing, have: h });
  }
  return out;
}
