import { expect, test, type Page } from '@playwright/test';

// These tests place real orders in the Supabase project. They use e2e-…@example.com
// addresses; run supabase/cleanup/e2e-orders.sql afterwards to remove them and restore stock.

const testEmail = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.com`;

async function fillCheckout(page: Page) {
  const form = page.locator('#checkout-form');
  await form.getByLabel('Full name').fill('E2E Tester');
  await form.getByLabel('Email').fill(testEmail());
  await form.getByLabel('Phone').fill('+961 70 000 000');
  await form.getByLabel('Governorate').selectOption('Beirut');
  await form.getByLabel('Area').fill('Hamra');
  await form.getByLabel('Street').fill('Bliss Street');
}

test('guest checkout with one cup reaches the confirmation', async ({ page }) => {
  await page.goto('/shop/fusilli-spicy-muhammara');
  await page.getByTestId('product-purchase').getByRole('button', { name: 'Add to cart' }).click();
  await page.getByRole('dialog', { name: /Your cart/ }).getByRole('link', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(/\/checkout$/, { timeout: 30_000 });

  await expect(page.getByTestId('checkout-total')).toHaveText('$7.50');
  await fillCheckout(page);
  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page).toHaveURL(/\/order\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Thank you');
  await expect(page.getByText(/#MAGO-\d+/)).toBeVisible();
  await expect(page.getByTestId('order-lines').getByText('Fusilli Cup')).toBeVisible();
  await expect(page.getByTestId('order-total')).toHaveText('$7.50');

  // The cart is empty after ordering.
  await expect(page.getByRole('button', { name: 'Open cart, 0 items' })).toBeVisible();
});

test('a Mix Box goes through checkout with its discount and gift note', async ({ page }) => {
  await page.goto('/mix-box');
  const add = page.getByRole('button', { name: /^Add .+ to your box$/ });
  for (let i = 0; i < 5; i++) {
    await add.first().click();
    await expect(page.getByTestId('box-count')).toHaveText(`${i + 1}/5`);
  }
  await page.getByRole('link', { name: 'Review my box' }).click();
  await expect(page).toHaveURL(/\/mix-box\/review$/, { timeout: 30_000 });
  await page.getByLabel('Gift note').fill('Happy birthday!');
  await page.getByRole('button', { name: 'Proceed to checkout' }).click();
  await expect(page).toHaveURL(/\/checkout$/, { timeout: 30_000 });

  const summary = page.getByTestId('checkout-summary');
  await expect(summary.getByText('The MAGO Mix Box')).toBeVisible();
  await expect(summary.getByText(/Mix & Match/)).toBeVisible();
  await expect(page.getByTestId('checkout-total')).toHaveText('$23.25');
  await expect(page.locator('#checkout-form').getByLabel('Gift note')).toHaveValue('Happy birthday!');

  await fillCheckout(page);
  await page.getByRole('button', { name: 'Place order' }).click();
  await expect(page).toHaveURL(/\/order\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByTestId('order-lines').getByText('The MAGO Mix Box')).toBeVisible();
  await expect(page.getByRole('main').getByText('Happy birthday!')).toBeVisible();
  await expect(page.getByTestId('order-total')).toHaveText('$23.25');
});

test('checkout explains an empty cart and a bad code', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page.getByRole('main').getByText('Your cart is empty')).toBeVisible();

  await page.goto('/shop/fusilli-spicy-muhammara');
  await page.getByTestId('product-purchase').getByRole('button', { name: 'Add to cart' }).click();
  await page.goto('/checkout');
  await page.getByLabel('Discount code').fill('NOPE');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByText('That code is not valid.')).toBeVisible();
  await expect(page.getByTestId('checkout-total')).toHaveText('$7.50');
});

test('an unknown order link is a 404', async ({ page }) => {
  const response = await page.goto('/order/00000000-0000-4000-8000-000000000000');
  expect(response?.status()).toBe(404);
});
