import { expect, test } from '@playwright/test';

test('the sitemap lists public pages only', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).toContain('/shop/fusilli-spicy-muhammara</loc>');
  expect(xml).toContain('/recipes/');
  expect(xml).toContain('/stores/spinneys-hamra</loc>');
  expect(xml).not.toContain('/admin');
  expect(xml).not.toContain('/account');
  expect(xml).not.toContain('/shop/fusilli-400g<'); // a draft product
  expect(xml).not.toContain('/shop/mago-mix-box<'); // bundles live at /mix-box
});

test('robots keeps crawlers out of private pages and points to the sitemap', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text();
  for (const path of ['/admin', '/account', '/checkout', '/cart', '/order/']) expect(txt).toContain(`Disallow: ${path}`);
  expect(txt).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
});

test('product, recipe, store and home pages carry structured data and a social image', async ({ page }) => {
  const ld = async () => (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t));

  await page.goto('/shop/fusilli-spicy-muhammara');
  const product = (await ld()).find((d) => d['@type'] === 'Product');
  expect(product).toMatchObject({ name: 'Fusilli Cup Spicy Muhammara', offers: { priceCurrency: 'USD', price: '4.50' } });
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', /fusilli-spicy-muhammara/);

  await page.goto('/recipes/rishta-soup-lemon-herbs');
  const recipe = (await ld()).find((d) => d['@type'] === 'Recipe');
  expect(recipe?.recipeIngredient?.length).toBeGreaterThan(0);

  await page.goto('/stores/spinneys-hamra');
  expect((await ld()).find((d) => d['@type'] === 'Store')).toMatchObject({ geo: { '@type': 'GeoCoordinates' } });

  await page.goto('/');
  const home = (await ld()).flat();
  expect(home.map((d) => d['@type'])).toEqual(expect.arrayContaining(['WebSite', 'Organization']));
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', /opengraph-image/);
});

test('an unknown recipe is a real 404', async ({ page }) => {
  const res = await page.goto('/recipes/not-a-real-recipe');
  expect(res?.status()).toBe(404);
});
