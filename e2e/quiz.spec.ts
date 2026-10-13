import { expect, test, type Page } from '@playwright/test';

const main = (page: Page) => page.getByRole('main');
const option = (page: Page, name: string) => main(page).getByRole('button', { name, exact: true });
const next = (page: Page) => main(page).getByRole('button', { name: 'Next', exact: true });

async function answerAll(page: Page) {
  await page.goto('/find-your-match');
  await main(page).getByRole('button', { name: 'Start the quiz' }).click();
  await option(page, 'Spicy & Bold').click();
  await next(page).click();
  for (const label of ['Medium Kick', 'Twirly & Saucy', 'Quick Lunch', 'Best Value']) {
    await option(page, label).click();
    await next(page).click();
  }
  await option(page, 'Lebanese Classics').click();
  await main(page).getByRole('button', { name: 'See my match' }).click();
}

test('starts from the intro and keeps to three favourite flavours', async ({ page }) => {
  await page.goto('/find-your-match');
  await expect(main(page).getByRole('heading', { level: 1, name: /find your\s*mago match/i })).toBeVisible();
  await expect(main(page).getByRole('heading', { name: 'A perfect match, just for you.' })).toBeVisible();
  await main(page).getByRole('button', { name: 'Start the quiz' }).click();

  await expect(main(page).getByRole('heading', { name: '1. What flavours do you love most?' })).toBeVisible();
  await expect(next(page)).toBeDisabled();
  for (const label of ['Spicy & Bold', 'Creamy & Rich', 'Fresh & Herby']) await option(page, label).click();
  await expect(option(page, 'Fresh & Herby')).toHaveAttribute('aria-pressed', 'true');
  await expect(option(page, 'Sweet & Unique')).toBeDisabled();
  await option(page, 'Creamy & Rich').click();
  await expect(option(page, 'Sweet & Unique')).toBeEnabled();
  await expect(main(page).getByRole('heading', { name: 'Bold flavours are your thing.' })).toBeVisible();
  await expect(main(page).getByTestId('match-card')).toHaveCount(3);

  await next(page).click();
  await expect(main(page).getByRole('heading', { name: '2. How much spice do you enjoy?' })).toBeVisible();
  await main(page).getByRole('button', { name: 'Back to the previous question' }).click();
  await expect(option(page, 'Spicy & Bold')).toHaveAttribute('aria-pressed', 'true');
});

test('ends with three matches and adds the 5-cup mix to the cart as one Mix Box', async ({ page }) => {
  await answerAll(page);
  await expect(main(page).getByRole('heading', { name: 'Perfect flavours for you.' })).toBeVisible();
  const cards = main(page).getByTestId('match-card');
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toContainText('Best match');
  await expect(main(page).getByText('Best value: all 5 cups come together in one Mix Box.')).toBeVisible();

  await main(page).getByRole('button', { name: 'Add all to cart' }).click();
  const box = page.getByTestId('cart-box');
  await expect(box).toHaveCount(1);
  await expect(box).toContainText('5 cups');
  await expect(main(page).getByText('Your 5-cup Mix Box is in your cart.')).toBeVisible();

  await page.keyboard.press('Escape');
  await main(page).getByRole('button', { name: 'Retake quiz' }).click();
  await expect(main(page).getByRole('heading', { name: '1. What flavours do you love most?' })).toBeVisible();
  await expect(option(page, 'Spicy & Bold')).toHaveAttribute('aria-pressed', 'false');
});
