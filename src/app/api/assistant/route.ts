import Anthropic from '@anthropic-ai/sdk';
import { ASSISTANT_INSTRUCTIONS, catalogContext } from '@/lib/assistant/prompt';
import { type AssistantEvent, type AssistantProduct, markerSlugs, parseTurns } from '@/lib/assistant/shared';
import { isPurchasable } from '@/lib/catalog/stock';
import { getAllActiveProducts, getRecipeCards, getSettings } from '@/lib/data/cached';

export const maxDuration = 60;

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 40;
const hits = new Map<string, number[]>();

/** Best-effort per-visitor limit (per server instance) so one visitor can't run up the API bill. */
function allowed(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) return false;
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}

function json(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(503, 'MAGO AI is not switched on yet.');

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!allowed(ip)) return json(429, "You've been chatting a lot! Take a little pasta break and try again in a few minutes.");

  let turns;
  try {
    turns = parseTurns(await request.json());
  } catch {
    turns = null;
  }
  if (!turns) return json(400, 'That message could not be sent.');

  const [products, recipes, settings] = await Promise.all([getAllActiveProducts(), getRecipeCards(), getSettings()]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AssistantEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const stream = client.beta.messages.stream(
          {
            model: 'claude-opus-5-5',
            max_tokens: 2048,
            thinking: { type: 'adaptive' },
            output_config: { effort: 'low' },
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            system: [
              { type: 'text', text: ASSISTANT_INSTRUCTIONS },
              { type: 'text', text: catalogContext(products, recipes, settings), cache_control: { type: 'ephemeral' } },
            ],
            messages: turns.map((t) => ({ role: t.role, content: t.text })),
          },
          { signal: request.signal },
        );

        let full = '';
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            full += event.delta.text;
            send({ type: 'text', text: event.delta.text });
          }
        }
        const message = await stream.finalMessage();
        if (message.stop_reason === 'refusal' && !full.trim()) {
          send({ type: 'text', text: "Let's keep it about pasta! What are you craving today?" });
        }

        const cards: AssistantProduct[] = markerSlugs(full)
          .map((slug) => bySlug.get(slug))
          .filter((p) => p !== undefined)
          .slice(0, 3)
          .map((p) => ({
            productId: p.id,
            slug: p.slug,
            name: p.name,
            flavour: p.flavour,
            image: (p.images.find((i) => i.kind === 'packshot') ?? p.images[0])?.url ?? null,
            price: p.price,
            purchasable: isPurchasable(p),
          }));
        if (cards.length) send({ type: 'products', products: cards });
        send({ type: 'done' });
      } catch (error) {
        if (!request.signal.aborted) {
          console.error('MAGO AI request failed', error);
          send({ type: 'error', message: 'Oops, my pasta pot boiled over. Please try again in a moment.' });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
