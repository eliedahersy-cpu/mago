import { expect, test } from '@playwright/test';

test('search finds pesto', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('searchbox').first().fill('Pesto');
  await page.getByRole('searchbox').first().press('Enter');
  await expect(page).toHaveURL(/\/search\?q=Pesto/, { timeout: 30_000 });
  await expect(page.getByTestId('product-card').filter({ hasText: 'Al Pesto Genovese' })).toBeVisible();
});

test('search handles punctuation', async ({ page }) => {
  const response = await page.goto('/search?q=pesto%2C%20(genovese)%25');
  expect(response?.status()).toBe(200);
  await expect(page.getByTestId('product-card').filter({ hasText: 'Al Pesto Genovese' })).toBeVisible();
});

test('search with no results', async ({ page }) => {
  await page.goto('/search?q=zzzz');
  await expect(page.getByText('No matches for "zzzz"')).toBeVisible();
});

test('info pages render', async ({ page }) => {
  const pages = [
    ['/faq', 'Frequently asked questions'],
    ['/shipping', 'Shipping & delivery'],
    ['/terms', 'Terms & conditions'],
  ] as const;
  for (const [path, title] of pages) {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  }
  const response = await page.goto('/not-a-real-page');
  expect(response?.status()).toBe(404);
});

test('our story renders', async ({ page }) => {
  await page.goto('/our-story');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/A modern take on a timeless heritage/i);
});
