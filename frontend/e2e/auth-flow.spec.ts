import { expect, test } from '@playwright/test';

test('a client can register, log in, and see their backend profile', async ({ page }) => {
  const username = `e2e${Date.now()}`;
  const email = `${username}@example.test`;
  const password = 'password123';

  await page.goto('/register');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByLabel('Account type').selectOption('CLIENT');

  const registrationResponse = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/auth/register'
  );
  await page.getByRole('button', { name: 'Register' }).click();
  expect((await registrationResponse).status()).toBe(201);
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Username or Email').fill(username);
  await page.getByLabel('Password').fill(password);

  const loginResponse = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/auth/login'
  );
  await page.getByRole('button', { name: 'Login' }).click();
  expect((await loginResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/profile');
  await expect.poll(async () => {
    const profileName = page.locator('.profile__username');
    if (await profileName.isVisible()) {
      return (await profileName.textContent())?.trim() ?? '';
    }

    const retryButton = page.getByRole('button', { name: 'Retry' });
    if (await retryButton.isVisible()) {
      await retryButton.click();
    }

    return '';
  }, {
    message: 'the profile created asynchronously from the registration event should appear',
    timeout: 30_000,
    intervals: [250, 500, 1_000],
  }).toBe(username);

  await expect(page.locator('.profile__role')).toHaveText('CLIENT');
  await expect(page.getByLabel('Email')).toHaveValue(email);
});
