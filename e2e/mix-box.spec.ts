import { expect, test, type Page } from '@playwright/test';

const addButtons = (page: Page) => page.getByRole('button', { name: /^Add .+ to your box$/ });

async function fillBox(page: Page) {
  await page.goto('/mix-box');
  const count = page.getByTestId('box-count');
  await expect(count).toHaveText('0/5');
  for (let i = 0; i < 4; i++) {
    await addButtons(page).first().click();
    await expect(count).toHaveText(`${i + 1}/5`);
  }
  await page.locator('[data-testid^="cup-card-"]').first().getByRole('button', { name: 'Increase quantity' }).click();
  await expect(count).toHaveText('5/5');
}

test('builds a full box and reaches review', async ({ page }) => {
  await fillBox(page);
  await expect(addButtons(page)).toHaveCount(0);
  const full = page.getByRole('button', { name: 'Box full' });
  await expect(full.first()).toBeDisabled();
  await page.getByRole('link', { name: 'Review my box' }).click();
  await expect(page).toHaveURL(/\/mix-box\/review$/, { timeout: 30_000 });
});

test('the box survives a reload and can be cleared', async ({ page }) => {
  await page.goto('/mix-box');
  await addButtons(page).first().click();
  await expect(page.getByTestId('box-count')).toHaveText('1/5');
  await page.reload();
  await expect(page.getByTestId('box-count')).toHaveText('1/5');
  await expect(page.getByRole('button', { name: 'Review my box' })).toBeDisabled();
  await page.getByRole('button', { name: 'Clear box' }).click();
  await expect(page.getByTestId('box-count')).toHaveText('0/5');
});
