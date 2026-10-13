import { expect, test } from '@playwright/test';

test('signed-out visitors are sent to sign in and kept on the way back', async ({ page }) => {
  await page.goto('/account/orders');
  await expect(page).toHaveURL(/\/account\/login\?next=%2Faccount%2Forders$/, { timeout: 30_000 });
});
