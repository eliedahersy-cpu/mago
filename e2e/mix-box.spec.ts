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

test('reviews the box, blocks an incomplete box and adds it to the cart', async ({ page }) => {
  await fillBox(page);
  await page.getByRole('link', { name: 'Review my box' }).click();
  await expect(page).toHaveURL(/\/mix-box\/review$/, { timeout: 30_000 });

  const rows = page.getByTestId('box-row');
  await expect(rows).toHaveCount(4);
  await expect(page.getByTestId('summary-count')).toHaveText('5 cups selected');
  await expect(page.getByTestId('summary-total')).toHaveText('$23.25');
  await expect(page.getByRole('heading', { name: 'Why this mix works' })).toBeVisible();

  const proceed = page.getByRole('button', { name: 'Proceed to checkout' });
  await rows.first().getByRole('button', { name: 'Decrease quantity' }).click();
  await expect(page.getByText('Add 1 more cup to complete your box.')).toBeVisible();
  await expect(proceed).toBeDisabled();
  await rows.first().getByRole('button', { name: 'Increase quantity' }).click();
  await expect(proceed).toBeEnabled();

  await page.getByLabel('This is a gift').check();
  await page.getByLabel('Gift note').fill('Happy birthday!');
  await page.getByRole('button', { name: 'Add to cart & keep shopping' }).click();
  await expect(page).toHaveURL(/\/shop$/, { timeout: 30_000 });

  await page.getByRole('button', { name: 'Open cart, 1 item' }).click();
  const drawer = page.getByRole('dialog', { name: /Your cart/ });
  await expect(drawer.getByText('The MAGO Mix Box')).toBeVisible();
  const boxRow = drawer.getByTestId('cart-box');
  await expect(boxRow.getByRole('listitem')).toHaveCount(4);
  await expect(boxRow).toContainText('2 ×');
  await expect(drawer.getByTestId('cart-subtotal')).toHaveText('$22.50');
  await expect(drawer.getByText('Gift note added')).toBeVisible();
});
