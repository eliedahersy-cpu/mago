import { expect, test } from '@playwright/test';

test('storefront still works when localStorage is blocked', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Access denied', 'SecurityError');
      },
    });
  });
  await page.goto('/shop/fusilli-spicy-muhammara');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Spicy Muhammara');
  await page.getByTestId('product-purchase').getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByRole('dialog', { name: /Your cart \(1\)/ })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('corrupt saved cart resets to empty', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('mago-cart', '{not json'));
  await page.goto('/shop');
  await page.getByRole('button', { name: /Open cart/ }).click();
  await expect(page.getByText('Your cart is empty')).toBeVisible();
});

test('saved cart with a bad shape or old version resets to empty', async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem('mago-cart', JSON.stringify({ state: { lines: [{ id: 'p:x' }] }, version: 0 })),
  );
  await page.goto('/shop');
  await expect(page.getByRole('button', { name: 'Open cart, 0 items' })).toBeVisible();
});
