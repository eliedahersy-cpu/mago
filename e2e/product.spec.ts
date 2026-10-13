import { expect, test } from '@playwright/test';

test('shows product details', async ({ page }) => {
  await page.goto('/shop/fusilli-spicy-muhammara');
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toContainText('Fusilli Cup');
  await expect(h1).toContainText('Spicy Muhammara');
  await expect(page.getByText('$4.50').first()).toBeVisible();
  await expect(page.getByText('Best seller').first()).toBeVisible();
  await expect(page.getByText('No reviews yet').first()).toBeVisible();
  await page.getByRole('tab', { name: 'Nutritional facts' }).click();
  await expect(page.getByText('30 g per serving')).toBeVisible();
});

test('draft product returns 404', async ({ page }) => {
  const response = await page.goto('/shop/fusilli-400g');
  expect(response?.status()).toBe(404);
  await expect(page.getByText("We couldn't find that page")).toBeVisible();
});

test('adds to cart and persists', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/shop/fusilli-spicy-muhammara');
  const purchase = page.getByTestId('product-purchase');
  await purchase.getByRole('button', { name: 'Increase quantity' }).click();
  await purchase.getByRole('button', { name: 'Add to cart' }).click();
  const drawer = page.getByRole('dialog', { name: /Your cart/ });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('Spicy Muhammara')).toBeVisible();
  await expect(drawer.locator('output')).toHaveText('2');
  await expect(drawer.getByText('$9.00').first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /Open cart, 2 items/ })).toBeVisible();
  expect(errors.filter((e) => /hydrat/i.test(e))).toEqual([]);
});

test('on phones product details open as an accordion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/shop/fusilli-spicy-muhammara');
  const nutrition = page.getByRole('button', { name: 'Nutritional facts' });
  await expect(nutrition).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByText('30 g per serving')).toBeHidden();
  await nutrition.click();
  await expect(nutrition).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('30 g per serving')).toBeVisible();
});
