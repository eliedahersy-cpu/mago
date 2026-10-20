import { expect, test } from '@playwright/test';

test('MAGO AI greets, streams a reply with a product card and adds it to the cart', async ({ page }) => {
  let sent: unknown = null;
  await page.route('**/api/assistant', async (route) => {
    sent = route.request().postDataJSON();
    const events = [
      { type: 'text', text: "Okay, I think I've found your MAGO match! " },
      { type: 'text', text: "It's the Spicy Muhammara, bold and nutty.\n[[show:fusilli-spicy-muhammara]]" },
      {
        type: 'products',
        products: [
          {
            productId: 'test-id',
            slug: 'fusilli-spicy-muhammara',
            name: 'Fusilli',
            flavour: 'Spicy Muhammara',
            image: null,
            price: 3.69,
            purchasable: true,
          },
        ],
      },
      { type: 'done' },
    ];
    await route.fulfill({ status: 200, contentType: 'application/x-ndjson', body: events.map((e) => JSON.stringify(e)).join('\n') + '\n' });
  });

  await page.goto('/our-story');
  await page.getByRole('button', { name: 'Ask MAGO' }).click();
  const chat = page.getByRole('dialog', { name: 'MAGO AI assistant' });
  await expect(chat.getByText(/Hey, pasta lover!/)).toBeVisible();

  await chat.getByRole('button', { name: 'Find My MAGO Match' }).click();
  await expect(chat.getByText("It's the Spicy Muhammara, bold and nutty.", { exact: false })).toBeVisible();
  await expect(chat.getByText('[[show:')).toHaveCount(0);
  expect(sent).toEqual({ messages: [{ role: 'user', text: 'Find My MAGO Match' }] });

  await chat.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByRole('dialog', { name: /Your cart/ }).getByText('Spicy Muhammara')).toBeVisible();
});

test('MAGO AI explains when it is not switched on', async ({ page }) => {
  await page.route('**/api/assistant', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'MAGO AI is not switched on yet.' }) }),
  );
  await page.goto('/our-story');
  await page.getByRole('button', { name: 'Ask MAGO' }).click();
  const chat = page.getByRole('dialog', { name: 'MAGO AI assistant' });
  await chat.getByLabel('Message MAGO AI').fill('Is the muhammara spicy?');
  await chat.getByRole('button', { name: 'Send' }).click();
  await expect(chat.getByText('MAGO AI is not switched on yet.')).toBeVisible();
});
