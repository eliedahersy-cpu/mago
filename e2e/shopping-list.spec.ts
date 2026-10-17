import { expect, test, type Page } from '@playwright/test';

const list = (page: Page) => page.getByRole('main').locator('section').filter({ hasText: /^(MAGO cups|From the shop)/ });

test('recipes add up on one shopping list, minus what you already have', async ({ page }) => {
  await page.goto('/recipes/spicy-muhammara-fusilli-roasted-veggies');
  await page.getByRole('checkbox', { name: /1 tbsp olive oil/ }).check({ force: true });
  await page.getByRole('button', { name: /Add to shopping list/ }).click();
  await expect(page.getByRole('status').filter({ hasText: 'On your shopping list' })).toBeVisible();

  await page.goto('/recipes/pesto-fusilli-grilled-chicken');
  await page.getByRole('button', { name: /Add to shopping list/ }).click();

  await page.getByRole('link', { name: /Shopping list/ }).first().click();
  await expect(page.getByRole('heading', { name: 'My shopping list' })).toBeVisible();
  await expect(list(page).getByText('1 MAGO Fusilli Cup Spicy Muhammara').first()).toBeVisible();
  await expect(list(page).getByText('1 MAGO Fusilli Cup Al Pesto Genovese').first()).toBeVisible();
  // Olive oil is owned for the first recipe, still needed for the second.
  await expect(list(page).getByText('1 tsp olive oil')).toBeVisible();
  await expect(list(page).getByText('1 tbsp olive oil')).toHaveCount(0);

  await page.reload();
  await expect(list(page).getByText('1 MAGO Fusilli Cup Al Pesto Genovese').first()).toBeVisible();

  await page.getByRole('button', { name: 'Clear the whole list' }).click();
  await expect(page.getByText('Your list is empty')).toBeVisible();
});
