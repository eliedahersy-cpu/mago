import { expect, test } from '@playwright/test';

test('cart page shows server totals, re-prices on change and rejects a bad code', async ({ page }) => {
  await page.goto('/shop/fusilli-spicy-muhammara');
  const purchase = page.getByTestId('product-purchase');
  for (let i = 0; i < 4; i++) await purchase.getByRole('button', { name: 'Increase quantity' }).click();
  await purchase.getByRole('button', { name: 'Add to cart' }).click();
  await page.getByRole('dialog', { name: /Your cart/ }).getByRole('link', { name: 'View cart' }).click();
  await expect(page).toHaveURL(/\/cart$/, { timeout: 30_000 });

  const summary = page.getByTestId('cart-summary');
  await expect(summary.getByText(/Mix & Match/)).toBeVisible();
  await expect(page.getByTestId('cart-total')).toHaveText('$19.60');

  await page.getByLabel('Discount code').fill('NOPE');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByText('That code is not valid.')).toBeVisible();

  // Four cups lose the Mix & Match discount: 4 × $3.69 + $3.00 delivery.
  await page.getByRole('main').getByRole('button', { name: 'Decrease quantity' }).click();
  await expect(page.getByTestId('cart-total')).toHaveText('$17.76');
  await expect(summary.getByText(/Mix & Match/)).toHaveCount(0);

  await page.getByRole('main').getByRole('link', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(/\/checkout$/, { timeout: 30_000 });
  await expect(page.getByTestId('checkout-total')).toHaveText('$17.76');
});

test('an empty cart page points back to the shop', async ({ page }) => {
  await page.goto('/cart');
  await expect(page.getByRole('main').getByText('Your cart is empty')).toBeVisible();
});

test('a failed price check says so in plain words and can be retried', async ({ page }) => {
  await page.goto('/shop/fusilli-spicy-muhammara');
  await page.getByTestId('product-purchase').getByRole('button', { name: 'Add to cart' }).click();

  let failing = true;
  await page.route('**/cart', async (route) => {
    if (failing && route.request().method() === 'POST') return route.abort('internetdisconnected');
    return route.continue();
  });
  await page.goto('/cart');
  await expect(page.getByText('We could not price your cart. Please try again.')).toBeVisible();

  failing = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByTestId('cart-total')).toHaveText('$6.69');
});
