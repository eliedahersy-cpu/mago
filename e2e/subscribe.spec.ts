import { expect, test, type Page } from '@playwright/test';

const main = (page: Page) => page.getByRole('main');

test('the subscribe page shows the plans from the database', async ({ page }) => {
  await page.goto('/subscribe');
  await expect(main(page).getByRole('heading', { level: 1, name: /subscribe\s*& save/i })).toBeVisible();
  const plans = main(page).getByRole('link', { name: 'Select' });
  await expect(plans).toHaveCount(3);
  await expect(main(page).getByText('Most popular').first()).toBeVisible();
});

test('a visitor builds a box, is asked to sign in at review, and the box survives a reload', async ({ page }) => {
  await page.goto('/subscribe');
  await main(page).getByRole('link', { name: 'Select' }).first().click();
  await expect(page).toHaveURL(/\/subscribe\/build\?plan=/, { timeout: 30_000 });

  // Step 1: the plan from the link is already chosen.
  await expect(main(page).getByRole('heading', { level: 1, name: /choose your plan/i })).toBeVisible();
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 2: five cups.
  await expect(main(page).getByRole('heading', { level: 1, name: /pick your 5 cups/i })).toBeVisible();
  const next = page.getByRole('button', { name: /next: delivery/i });
  await expect(next).toBeDisabled();
  const more = main(page).getByRole('button', { name: /^One more / });
  await more.nth(0).click();
  await more.nth(0).click();
  await more.nth(1).click();
  await more.nth(2).click();
  await more.nth(2).click();
  await expect(page.getByTestId('sub-cup-count')).toHaveText('5/5');
  await expect(more.nth(3)).toBeDisabled();
  await next.click();

  // Step 3: delivery.
  await main(page).getByLabel('Full name').fill('Test Subscriber');
  await main(page).getByLabel('Phone').fill('+961 70 000 000');
  await main(page).getByLabel('Governorate').selectOption('Beirut');
  await main(page).getByLabel('Area').fill('Hamra');
  await main(page).getByLabel('Street').fill('Bliss Street');
  await page.getByRole('button', { name: /next: review/i }).click();

  // Step 4: prices from the server, and a sign-in link that comes back here.
  await expect(main(page).getByRole('heading', { level: 1, name: /review your box/i })).toBeVisible();
  await expect(page.getByTestId('subscription-total')).toHaveText(/^\$\d+\.\d{2}$/, { timeout: 15_000 });
  const signIn = main(page).getByRole('link', { name: /sign in to subscribe/i });
  await expect(signIn).toHaveAttribute('href', '/account/login?next=%2Fsubscribe%2Fbuild');

  await page.reload();
  await expect(main(page).getByRole('heading', { level: 1, name: /review your box/i })).toBeVisible();
  await expect(main(page).getByText('Test Subscriber')).toBeVisible();
});

test('managing subscriptions needs an account', async ({ page }) => {
  await page.goto('/account/subscriptions');
  await expect(page).toHaveURL((url) => url.pathname === '/account/login' && url.searchParams.get('next') === '/account/subscriptions', { timeout: 30_000 });
});
