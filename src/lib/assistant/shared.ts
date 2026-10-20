/** Pieces of MAGO AI shared by the API route and the chat widget (no server-only imports). */

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export const MAX_TURNS = 24;
export const MAX_TURN_CHARS = 800;

/** Cards the assistant shows next to a reply, resolved from the live catalog. */
export interface AssistantProduct {
  productId: string;
  slug: string;
  name: string;
  flavour: string | null;
  image: string | null;
  price: number;
  purchasable: boolean;
}

/** Stream events the route sends, one JSON object per line. */
export type AssistantEvent =
  | { type: 'text'; text: string }
  | { type: 'products'; products: AssistantProduct[] }
  | { type: 'done' }
  | { type: 'error'; message: string };

/** The model marks product cards with `[[show:slug-a,slug-b]]`. */
const MARKER = /\[\[show:([^\]]*)\]\]/g;

/** Slugs named in every complete marker, in order, without repeats. */
export function markerSlugs(text: string): string[] {
  const seen = new Set<string>();
  for (const m of text.matchAll(MARKER)) {
    for (const raw of m[1].split(',')) {
      const slug = raw.trim().toLowerCase();
      if (/^[a-z0-9-]+$/.test(slug)) seen.add(slug);
    }
  }
  return [...seen];
}

/** The reply as people read it: markers removed, including one still arriving at the end of a stream. */
export function visibleText(text: string): string {
  return text
    .replace(MARKER, '')
    .replace(/\[(\[[^\]]*\]?)?$/, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** The reply as it is spoken: no markers, markdown symbols or emoji. */
export function speakableText(text: string): string {
  return visibleText(text)
    .replace(/[*_#`>]/g, '')
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** A clean, bounded history, or null when the request is not one the assistant should answer. */
export function parseTurns(body: unknown): ChatTurn[] | null {
  if (!body || typeof body !== 'object') return null;
  const list = (body as { messages?: unknown }).messages;
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_TURNS) return null;
  const turns: ChatTurn[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') return null;
    const { role, text } = item as { role?: unknown; text?: unknown };
    if ((role !== 'user' && role !== 'assistant') || typeof text !== 'string') return null;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_TURN_CHARS * (role === 'assistant' ? 4 : 1)) return null;
    turns.push({ role, text: trimmed });
  }
  if (turns[0].role !== 'user' || turns[turns.length - 1].role !== 'user') return null;
  for (let i = 1; i < turns.length; i++) if (turns[i].role === turns[i - 1].role) return null;
  return turns;
}
