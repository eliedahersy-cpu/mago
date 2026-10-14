import { expect, test, type Page } from '@playwright/test';

// The browser's own install prompt (beforeinstallprompt) never fires in an automated browser, so
// these tests send a stand-in event with the same shape.
async function offerInstall(page: Page, outcome: 'accepted' | 'dismissed') {
  await page.evaluate((o) => {
    const event = new Event('beforeinstallprompt') as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    (window as unknown as { __prompted: number }).__prompted = 0;
    event.prompt = async () => {
      (window as unknown as { __prompted: number }).__prompted += 1;
    };
    event.userChoice = Promise.resolve({ outcome: o });
    window.dispatchEvent(event);
  }, outcome);
}

const fab = (page: Page) => page.getByRole('complementary', { name: 'Download the MAGO app' });

test('the site is installable: manifest, icons and service worker', async ({ request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest).toMatchObject({ short_name: 'MAGO', display: 'standalone', start_url: '/', theme_color: '#023025' });
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  for (const icon of manifest.icons) expect((await request.get(icon.src)).status()).toBe(200);
  expect((await request.get('/sw.js')).status()).toBe(200);
});

test('without an install prompt the footer button explains how to install', async ({ page }) => {
  await page.goto('/');
  await expect(fab(page)).toHaveCount(0);
  const footerButton = page.getByRole('contentinfo').getByRole('button', { name: 'Download app' });
  await footerButton.click();
  await expect(page.getByRole('contentinfo').getByRole('status')).toContainText('Install app');
});

test('the floating button installs the app, then both buttons disappear for good', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('contentinfo').getByRole('button', { name: 'Download app' })).toBeVisible();
  await offerInstall(page, 'accepted');
  await expect(fab(page)).toBeVisible();
  await fab(page).getByRole('button', { name: /download app/i }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __prompted: number }).__prompted)).toBe(1);
  await expect(fab(page)).toHaveCount(0);
  await expect(page.getByRole('contentinfo').getByRole('button', { name: 'Download app' })).toHaveCount(0);

  await page.reload();
  await offerInstall(page, 'accepted');
  await expect(fab(page)).toHaveCount(0);
  await expect(page.getByRole('contentinfo').getByRole('button', { name: 'Download app' })).toHaveCount(0);
});

test('the floating button stays off checkout pages and can be hidden', async ({ page }) => {
  await page.goto('/cart');
  await offerInstall(page, 'dismissed');
  await expect(fab(page)).toHaveCount(0);

  await page.goto('/shop');
  await offerInstall(page, 'dismissed');
  await expect(fab(page)).toBeVisible();
  await fab(page).getByRole('button', { name: 'Hide' }).click();
  await expect(fab(page)).toHaveCount(0);
});

test.describe('on an iPhone', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });

  test('the floating button shows the Add to Home Screen steps', async ({ page }) => {
    await page.goto('/');
    await expect(fab(page)).toBeVisible();
    await fab(page).getByRole('button', { name: /download app/i }).click();
    await expect(fab(page).getByRole('status')).toContainText('Add to Home Screen');
  });
});
