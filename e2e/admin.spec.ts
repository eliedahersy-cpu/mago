import { expect, test } from '@playwright/test';

test('admin pages send signed-out visitors to the admin sign-in', async ({ page }) => {
  const paths = ['/admin', '/admin/orders', '/admin/orders/1001', '/admin/orders/new', '/admin/products/new', '/admin/inventory', '/admin/customers', '/admin/discounts/new', '/admin/analytics', '/admin/settings'];
  for (const path of paths) {
    await page.goto(path);
    await expect(page).toHaveURL((url) => url.pathname === '/admin/login' && url.searchParams.get('next') === path, { timeout: 30_000 });
  }
});

test('the admin sign-in explains when an account is not staff', async ({ page }) => {
  await page.goto('/admin/login?error=staff');
  await expect(page.getByRole('heading', { level: 1, name: 'MAGO admin' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('does not have admin access');
  await expect(page.getByRole('main').getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'Create an account' })).toHaveCount(0);
});

test('the orders CSV export is not served to signed-out visitors', async ({ request }) => {
  const res = await request.get('/admin/orders/export', { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(res.headers()['location']).toContain('/admin/login');
});
