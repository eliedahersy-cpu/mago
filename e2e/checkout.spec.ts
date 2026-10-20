import { expect, test, type Page } from '@playwright/test';

// These tests place real orders in the Supabase project. They use e2e-…@example.com
// addresses; run supabase/cleanup/e2e-orders.sql afterwards to remove them and restore stock.

const testEmail = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.com`;
// A different phone each time too: place_order allows 5 orders per phone in 10 minutes.
const testPhone = () => `+961 70 ${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`;

async function fillCheckout(page: Page) {
  const form = page.locator('#checkout-form');
  await form.getByLabel('Full name').fill('E2E Tester');
  await form.getByLabel('Email').fill(testEmail());
  await form.getByLabel('Phone').fill(testPhone());
  await form.getByLabel('Governorate').selectOption('Beirut');
  await form.getByLabel('Area').fill('Hamra');
  await form.getByLabel('Street').fill('Bliss Street');
}

test('guest checkout with one cup reaches the confirmation', async ({ page }) => {
  await page.goto('/shop/fusilli-spicy-muhammara');
  await page.getByTestId('product-purchase').getByRole('button', { name: 'Add to cart' }).click();
  await page.getByRole('dialog', { name: /Your cart/ }).getByRole('link', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(/\/checkout$/, { timeout: 30_000 });

  await expect(page.getByTestId('checkout-total')).toHaveText('$6.69');
  await fillCheckout(page);
  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page).toHaveURL(/\/order\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Thank you');
  await expect(page.getByText(/#MAGO-\d+/)).toBeVisible();
  await expect(page.getByTestId('order-lines').getByText('Fusilli Cup')).toBeVisible();
  await expect(page.getByTestId('order-total')).toHaveText('$6.69');

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
  await expect(page.getByTestId('checkout-total')).toHaveText('$19.60');
  await expect(page.locator('#checkout-form').getByLabel('Gift note')).toHaveValue('Happy birthday!');

  await fillCheckout(page);
  await page.getByRole('button', { name: 'Place order' }).click();
  await expect(page).toHaveURL(/\/order\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByTestId('order-lines').getByText('The MAGO Mix Box')).toBeVisible();
  await expect(page.getByRole('main').getByText('Happy birthday!')).toBeVisible();
  await expect(page.getByTestId('order-total')).toHaveText('$19.60');
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
  await expect(page.getByTestId('checkout-total')).toHaveText('$6.69');
});

test('an unknown order link is a 404', async ({ page }) => {
  const response = await page.goto('/order/00000000-0000-4000-8000-000000000000');
  expect(response?.status()).toBe(404);
});

test('a lost response after the order is placed can be retried without a second order', async ({ page }) => {
  await page.goto('/shop/fusilli-spicy-muhammara');
  await page.getByTestId('product-purchase').getByRole('button', { name: 'Add to cart' }).click();
  await page.goto('/checkout');
  await expect(page.getByTestId('checkout-total')).toHaveText('$6.69');
  await fillCheckout(page);

  // Let the first place-order request reach the server, then drop its response.
  let firstToken: string | null = null;
  await page.route('**/checkout', async (route) => {
    const request = route.request();
    if (firstToken === null && request.method() === 'POST' && (request.postData() ?? '').includes('idempotencyKey')) {
      const response = await route.fetch();
      firstToken = (await response.text()).match(/"token":"([0-9a-f-]{36})"/)?.[1] ?? 'missing';
      await route.abort('internetdisconnected');
      return;
    }
    await route.continue();
  });

  await page.getByRole('button', { name: 'Place order' }).click();
  await expect(page.getByText(/couldn.t confirm your order/i)).toBeVisible();
  await expect(page.locator('#checkout-form').getByLabel('Full name')).toHaveValue('E2E Tester');
  expect(firstToken).toMatch(/^[0-9a-f-]{36}$/);

  await page.getByRole('button', { name: 'Place order' }).click();
  await expect(page).toHaveURL(new RegExp(`/order/${firstToken}$`), { timeout: 30_000 });
});
