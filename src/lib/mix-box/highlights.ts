export type HighlightKey = 'bold' | 'fresh' | 'comforting' | 'sweet' | 'indulgent';

export interface MixHighlight {
  key: HighlightKey;
  title: string;
  text: string;
  image: string | null;
}

interface HighlightCup {
  name: string;
  flavour: string | null;
  image: string | null;
  flavourProfiles: string[];
}

/** A cup's mood is the first of its flavour profiles found in this list. */
const PROFILE_PRIORITY: [profile: string, key: HighlightKey][] = [
  ['spicy', 'bold'],
  ['sweet', 'sweet'],
  ['soupy', 'comforting'],
  ['herby', 'fresh'],
  ['creamy', 'indulgent'],
  ['comforting', 'comforting'],
];

const COPY: Record<HighlightKey, { title: string; one: string; many: string }> = {
  bold: { title: 'Bold & Spicy', one: 'brings vibrant, smoky flavours.', many: 'bring vibrant, smoky flavours.' },
  fresh: { title: 'Fresh & Herby', one: 'adds a fresh, aromatic touch.', many: 'add a fresh, aromatic touch.' },
  comforting: { title: 'Comforting', one: 'is warm, wholesome and satisfying.', many: 'are warm, wholesome and satisfying.' },
  sweet: { title: 'Sweet', one: 'is a cosy, feel-good treat.', many: 'are a cosy, feel-good treat.' },
  indulgent: { title: 'Indulgent', one: 'brings a luxurious, gourmet finish.', many: 'bring a luxurious, gourmet finish.' },
};

const ORDER: HighlightKey[] = ['bold', 'fresh', 'comforting', 'sweet', 'indulgent'];

const label = (cup: HighlightCup) => [cup.name, cup.flavour].filter(Boolean).join(' ');

/** "Why this mix works": the box's cups grouped by mood, one line per mood present. */
export function mixHighlights(cups: HighlightCup[]): MixHighlight[] {
  const groups = new Map<HighlightKey, HighlightCup[]>();
  const seen = new Set<string>();
  for (const cup of cups) {
    if (seen.has(label(cup))) continue;
    seen.add(label(cup));
    const key = PROFILE_PRIORITY.find(([profile]) => cup.flavourProfiles.includes(profile))?.[1];
    if (key) groups.set(key, [...(groups.get(key) ?? []), cup]);
  }
  return ORDER.flatMap((key) => {
    const members = groups.get(key);
    if (!members) return [];
    const copy = COPY[key];
    const verb = members.length === 1 ? copy.one : copy.many;
    return [{ key, title: copy.title, text: `${members.map(label).join(' and ')} ${verb}`, image: members[0].image }];
  });
}
