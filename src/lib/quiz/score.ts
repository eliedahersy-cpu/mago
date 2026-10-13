import { isPurchasable } from '@/lib/catalog/stock';
import type { Product } from '@/lib/types';
import type { QuizAnswers, QuizQuestion } from './config';

/** Weighted sum of how well one cup fits the answers (spec §8). Higher is better. */
export function scoreCup(cup: Product, answers: QuizAnswers): number {
  let score = 0;
  for (const id of answers.flavours) if (cup.flavourProfiles.includes(id)) score += 3;

  const heat = answers.spice[0];
  if (heat !== undefined) score += 2 - Math.abs(cup.spiceLevel - Number(heat));

  for (const id of answers.texture) if (cup.textures.includes(id)) score += 2;
  for (const id of answers.occasion) if (cup.occasions.includes(id)) score += 1;

  for (const id of answers.priority) {
    if (id === 'protein' && (cup.proteinG ?? 0) >= 25) score += 1;
    if (id === 'bold') {
      if (cup.flavourProfiles.includes('spicy') || cup.spiceLevel >= 2) score += 1.5;
      else if (cup.style === 'fusion') score += 1;
    }
    if (id === 'comfort' && (cup.flavourProfiles.includes('comforting') || cup.flavourProfiles.includes('creamy'))) {
      score += 1.5;
    }
    // 'value' changes no cup: the results point to the Mix Box instead.
  }

  for (const id of answers.style) {
    if (id === 'both') score += cup.style === 'fusion' ? 2 : cup.style ? 1 : 0;
    else if (cup.style === id) score += 2;
  }
  return score;
}

/** Best fit first; ties keep the shop order. */
export function rankCups(cups: Product[], answers: QuizAnswers): Product[] {
  return cups
    .map((cup) => ({ cup, score: scoreCup(cup, answers) }))
    .sort((a, b) => b.score - a.score || a.cup.sortOrder - b.cup.sortOrder || a.cup.slug.localeCompare(b.cup.slug))
    .map((r) => r.cup);
}

export type PickKind = 'best' | 'also' | 'discovery';

/** Top match, the runner-up, and a discovery: the next best cup in a different style from the top match. */
export function quizPicks(ranked: Product[]): { kind: PickKind; product: Product }[] {
  const [best, also, ...rest] = ranked;
  if (!best) return [];
  const picks: { kind: PickKind; product: Product }[] = [{ kind: 'best', product: best }];
  if (also) picks.push({ kind: 'also', product: also });
  const discovery = rest.find((p) => p.style !== best.style) ?? rest[0];
  if (discovery) picks.push({ kind: 'discovery', product: discovery });
  return picks;
}

/** The suggested Mix Box: top-ranked cups that can be bought, at most 2 of any one. May fall short of `size`. */
export function suggestedMix(ranked: Product[], size: number): { product: Product; quantity: number }[] {
  const available = ranked.filter(isPurchasable);
  const mix = available.slice(0, size).map((product) => ({ product, quantity: 1 }));
  let total = mix.length;
  for (const entry of mix) {
    if (total >= size) break;
    entry.quantity = 2;
    total += 1;
  }
  return mix;
}

/** Picks or unpicks an option, never going over the step's limit; single-choice steps swap the pick. */
export function toggleAnswer(question: QuizQuestion, picked: string[], id: string): string[] {
  if (picked.includes(id)) return picked.filter((p) => p !== id);
  if (question.max === 1) return [id];
  if (picked.length >= question.max) return picked;
  return [...picked, id];
}

const PROFILES: Record<string, { title: string; body: string }> = {
  spicy: {
    title: 'Bold flavours are your thing.',
    body: 'You enjoy a good kick! We’ll look for cups with bold, aromatic flavours and the right level of heat to match your taste.',
  },
  creamy: {
    title: 'Creamy comfort is your thing.',
    body: 'You love rich, velvety sauces. We’ll look for indulgent cups that feel like a little treat.',
  },
  herby: {
    title: 'Fresh and green is your thing.',
    body: 'You like bright, herby flavours. We’ll look for fresh, aromatic cups that keep things light.',
  },
  comforting: {
    title: 'Classic comfort is your thing.',
    body: 'You love the classics. We’ll look for warm, familiar cups that taste like home.',
  },
  soupy: {
    title: 'Warm and soupy is your thing.',
    body: 'You enjoy a warming bowl. We’ll look for brothy, spoonable cups full of flavour.',
  },
  sweet: {
    title: 'Sweet surprises are your thing.',
    body: 'You like something different. We’ll look for cups with a sweet, unexpected twist.',
  },
};

/** A headline for the answers so far, from the first favourite flavour; null before any is picked. */
export function tasteProfile(answers: QuizAnswers): { title: string; body: string } | null {
  const first = answers.flavours[0];
  return first ? (PROFILES[first] ?? null) : null;
}
