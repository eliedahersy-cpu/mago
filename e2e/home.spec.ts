import { expect, test } from '@playwright/test';

test('hero links to shop', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Good food, brighter days.' })).toBeAttached();
  await page.getByRole('link', { name: 'Explore our cups', exact: true }).click();
  await expect(page).toHaveURL(/\/shop$/);
});

test('shows the cup collection in featured order', async ({ page }) => {
  await page.goto('/');
  const cards = page.getByTestId('showcase-card');
  await expect(cards).toHaveCount(5);
  await expect(cards.first()).toContainText('Pastina Cup');
});

test('lists recipes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Rishta Soup with Lemon & Herbs')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View all recipes' })).toHaveAttribute('href', '/recipes');
});

test('newsletter validates email', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your email').fill('nope');
  await page.getByRole('button', { name: 'Subscribe' }).click();
  await expect(page.getByText('Enter a valid email')).toBeVisible();
});
