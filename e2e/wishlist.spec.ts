import { expect, test } from '@playwright/test';

test('a guest can save cups to a wishlist that survives a reload', async ({ page }) => {
  await page.goto('/shop');
  const heart = page.getByRole('button', { name: 'Save Fusilli Cup Spicy Muhammara to your wishlist' });
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
  await heart.click();
  await expect(page.getByRole('button', { name: 'Remove Fusilli Cup Spicy Muhammara from your wishlist' })).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/shop/fusilli-spicy-muhammara');
  await expect(page.getByTestId('product-purchase').getByRole('button', { name: /from your wishlist/ })).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  const saved = page.getByTestId('product-purchase').getByRole('button', { name: /wishlist/ });
  await expect(saved).toHaveAttribute('aria-pressed', 'true');
  await saved.click();
  await expect(saved).toHaveAttribute('aria-pressed', 'false');
});
