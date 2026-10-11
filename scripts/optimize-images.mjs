// Converts the original Drive artwork in design-assets/ (git-ignored) into the
// web-ready files committed under public/ and src/app/. Re-run after adding or
// replacing artwork: `npm run images` (skips outputs newer than their source).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const SRC = path.join(root, 'design-assets/images');

const cups = {
  'fusilli-spicy-muhammara': 'cup-fusilli-spicy-muhammara',
  'fusilli-al-pesto-genovese': 'cup-fusilli-pesto-genovese',
  'rishta-lentil-pasta-soup': 'cup-rishta-lentil-soup',
  'pastina-sweet-cinnamon': 'cup-pastina-sweet-cinnamon',
  'tagliolini-al-tartufo-bianco': 'cup-tagliolini-tartufo-bianco',
  'conchiglie-mac-and-cheese': 'cup-conchiglie-mac-cheese',
  'tagliolini-creamy-mushroom': 'cup-tagliolini-mushroom',
  'tagliolini-al-limone': 'cup-tagliolini-al-limone',
  'tagliolini-tarator-pine-nuts': 'cup-tagliolini-mockup',
  'macaroon-bil-toum': 'cup-macaroon-bil-toum',
  'conchigliette-in-brodo': 'cup-conchigliette-golden-broth',
  'conchigliette-in-brodo-2': 'cup-conchigliette',
  'lasagna-melanzane-ricotta': 'cup-lasagna',
  'fusilli-400g': 'box-fusilli-400g',
  'tagliolini-400g': 'box-tagliolini-400g',
  'conchiglie-400g': 'box-conchiglie-400g',
  'lasagna-400g': 'box-lasagna-400g',
  // Back panels of the retail boxes (the Drive file named lifestyle-lasagna is the lasagna box back).
  'fusilli-400g-back': 'box-fusilli-back',
  'tagliolini-400g-back': 'box-tagliolini-back',
  'conchiglie-400g-back': 'box-conchiglie-back',
  'lasagna-400g-back': 'lifestyle-lasagna',
};

const lifestyle = [
  'movie-night', 'kids-game-night', 'kitchen-portrait', 'post-workout',
  'rainy-day-soup', 'lemon-office', 'pantry-shelf',
];

/** @type {{ src: string, out: string, width: number, crop?: { left: number, top: number, width: number, height: number }, format?: 'webp' | 'png', trim?: boolean, recolorDark?: [number, number, number] }[]} */
export const manifest = [
  { src: 'logo.png', out: 'public/brand/logo.webp', width: 512, trim: true },
  // Footer variant: forest-coloured lettering recoloured to cream, sun and transparency kept.
  { src: 'logo.png', out: 'public/brand/logo-light.webp', width: 512, trim: true, recolorDark: [0xfb, 0xf3, 0xe4] },
  { src: 'logo.png', out: 'src/app/icon.png', width: 512, format: 'png' },
  { src: 'logo.png', out: 'src/app/apple-icon.png', width: 180, format: 'png' },
  { src: 'hero-landscape-1.png', out: 'public/images/hero-desktop.webp', width: 1799 },
  { src: 'hero-portrait-1.png', out: 'public/images/hero-mobile.webp', width: 941 },
  { src: 'cup-collection.png', out: 'public/images/cup-collection.webp', width: 1400 },
  ...lifestyle.map((name) => ({ src: `lifestyle-${name}.png`, out: `public/images/lifestyle-${name}.webp`, width: 1400 })),
  ...Object.entries(cups).map(([slug, file]) => ({ src: `${file}.png`, out: `public/products/${slug}.webp`, width: 900 })),
  { src: 'mix-box-five-cup.png', out: 'public/products/mago-mix-box.webp', width: 900, crop: { left: 0, top: 0, width: 0.5, height: 0.69 } },
  { src: 'mix-box-five-cup.png', out: 'public/products/mago-mix-box-open.webp', width: 900, crop: { left: 0.505, top: 0, width: 0.495, height: 0.69 } },
];

async function build(entry) {
  const src = path.join(SRC, entry.src);
  const out = path.join(root, entry.out);
  if (!fs.existsSync(src)) throw new Error(`Missing source ${entry.src} (expected in design-assets/images)`);
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs && fs.statSync(out).mtimeMs > fs.statSync(import.meta.filename).mtimeMs) {
    return 'skip';
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  let img = sharp(src);
  if (entry.trim) img = sharp(await img.trim().toBuffer());
  if (entry.recolorDark) img = await recolorDark(img, entry.recolorDark);
  if (entry.crop) {
    const { width = 0, height = 0 } = await img.metadata();
    img = img.extract({
      left: Math.round(entry.crop.left * width),
      top: Math.round(entry.crop.top * height),
      width: Math.round(entry.crop.width * width),
      height: Math.round(entry.crop.height * height),
    });
  }
  img = img.resize({ width: entry.width, withoutEnlargement: true });
  img = entry.format === 'png' ? img.png({ compressionLevel: 9 }) : img.webp({ quality: 82 });
  await img.toFile(out);
  return 'built';
}

/** Replace near-black/forest pixels (all channels < 110) with `rgb`, preserving alpha. */
async function recolorDark(img, [r, g, b]) {
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0 && data[i] < 110 && data[i + 1] < 110 && data[i + 2] < 110) {
      data[i] = r; data[i + 1] = g; data[i + 2] = b;
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
}

const results = { built: 0, skip: 0 };
for (const entry of manifest) results[await build(entry)] += 1;
console.log(`images: ${results.built} built, ${results.skip} up to date (${manifest.length} total)`);
