import { expect, test } from '@playwright/test';

test('signed-out visitors are sent to sign in and kept on the way back', async ({ page }) => {
  await page.goto('/account/orders');
  await expect(page).toHaveURL(/\/account\/login\?next=%2Faccount%2Forders$/, { timeout: 30_000 });
});

test('sign-in offers a password and an emailed link, and explains mistakes', async ({ page }) => {
  await page.goto('/account/login');
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Email me a sign-in link' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Forgot your password?' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  await expect(page.getByText('Please enter your password.')).toBeVisible();
});

test('an expired emailed link is explained on the sign-in page', async ({ page }) => {
  await page.goto('/account/login?error=link');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('That link has expired');
});

test('registration checks the password length before creating anything', async ({ page }) => {
  await page.goto('/account/register');
  await page.getByRole('main').getByLabel('Full name').fill('E2E Tester');
  await page.getByRole('main').getByLabel('Email').fill('e2e-register@example.com');
  await page.getByRole('main').getByLabel('Password').fill('short');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Use at least 8 characters.')).toBeVisible();
});

test('password reset asks for a valid email', async ({ page }) => {
  await page.goto('/account/forgot-password');
  await page.getByRole('main').getByLabel('Email').fill('nope');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
});
