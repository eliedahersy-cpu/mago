import { expect, test } from '@playwright/test';

test('the store locator lists stores, filters by area and opens a store', async ({ page }) => {
  await page.goto('/stores');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1, name: /find mago\s*near you/i })).toBeVisible();
  const cards = main.getByRole('article');
  await expect(cards).toHaveCount(5);
  await expect(main.getByRole('region', { name: 'Map of MAGO stores' })).toBeAttached();

  await main.getByPlaceholder('Enter your city or area').fill('hamra');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Spinneys Hamra');
  await expect(cards.first().getByRole('link', { name: 'Directions' })).toHaveAttribute('href', /google\.com\/maps\/dir/);

  await cards.first().getByRole('link', { name: 'Spinneys Hamra' }).click();
  await expect(page).toHaveURL(/\/stores\/spinneys-hamra$/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'Spinneys Hamra' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'More nearby' })).toBeVisible();
});

test('an unknown store is a 404', async ({ page }) => {
  const res = await page.goto('/stores/nowhere-at-all');
  expect(res?.status()).toBe(404);
});
