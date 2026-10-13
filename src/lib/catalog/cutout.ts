/** Seeded cup packshots that also exist without their white studio background, in /products/cutouts. */
const CUTOUTS = new Set([
  'conchiglie-mac-and-cheese',
  'conchigliette-in-brodo',
  'fusilli-al-pesto-genovese',
  'fusilli-spicy-muhammara',
  'lasagna-melanzane-ricotta',
  'macaroon-bil-toum',
  'pastina-sweet-cinnamon',
  'rishta-lentil-pasta-soup',
  'tagliolini-al-limone',
  'tagliolini-al-tartufo-bianco',
  'tagliolini-creamy-mushroom',
  'tagliolini-tarator-pine-nuts',
]);

/**
 * The transparent version of a packshot when there is one, for cups shown on coloured or moving
 * backgrounds (where `mix-blend-multiply` cannot hide the white). Anything else comes back unchanged.
 */
export function cutoutImage(url: string): string {
  const match = /^\/products\/([a-z0-9-]+)\.webp$/.exec(url);
  return match && CUTOUTS.has(match[1]) ? `/products/cutouts/${match[1]}.webp` : url;
}
