import { expect, test } from '@playwright/test';

const cards = '[data-testid="product-card"]';

test('lists the 12 active cups and hides drafts', async ({ page }) => {
  await page.goto('/shop');
  await expect(page.locator(cards)).toHaveCount(12);
  await expect(page.getByText('400g')).toHaveCount(0);
});

test('filters by collection', async ({ page }) => {
  await page.goto('/shop');
  await page.getByRole('link', { name: 'Fusilli', exact: true }).click();
  await expect(page).toHaveURL(/collection=fusilli/, { timeout: 30_000 });
  await expect(page.locator(cards)).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Fusilli', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('shop ignores unknown collection', async ({ page }) => {
  await page.goto('/shop?collection=nope');
  await expect(page.locator(cards)).toHaveCount(12);
  await expect(page.getByRole('link', { name: 'All', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('sort control updates the URL', async ({ page }) => {
  await page.goto('/shop');
  await page.getByLabel('Sort by').selectOption({ label: 'Top rated' });
  await expect(page).toHaveURL(/sort=rating/, { timeout: 30_000 });
  await expect(page.locator(cards)).toHaveCount(12);
});
