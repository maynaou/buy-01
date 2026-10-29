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

test('a seller can create a product, a client can order it, and the seller can deliver the order', async ({ page }) => {
  const username = `seller${Date.now()}`;
  const email = `${username}@example.test`;
  const password = 'password123';
  const productName = `E2E Training Ball ${Date.now()}`;

  await page.goto('/register');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByLabel('Account type').selectOption('SELLER');

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

  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'New product' }).click();
  await page.getByLabel('Name').fill(productName);
  await page.getByLabel('Description').fill('A durable ball for training sessions.');
  await page.getByLabel('Category').selectOption('TRAINING');
  await page.getByLabel('Price').fill('29.99');
  await page.getByLabel('Quantity').fill('12');

  const productResponse = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/products/product'
  );
  await page.getByRole('button', { name: 'Create product' }).click();
  const createdProduct = await productResponse;
  expect(createdProduct.status()).toBe(201);
  expect((await createdProduct.json()).name).toBe(productName);
  await expect(page.locator('.row__name', { hasText: productName })).toBeVisible();

  await page.getByRole('button', { name: 'Logout' }).click();
  await page.goto('/register');

  const clientUsername = `buyer${Date.now()}`;
  const clientEmail = `${clientUsername}@example.test`;
  await page.getByLabel('Username').fill(clientUsername);
  await page.getByLabel('Email').fill(clientEmail);
  await page.getByLabel('Password').fill(password);
  await page.getByLabel('Account type').selectOption('CLIENT');

  const clientRegistrationResponse = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/auth/register'
  );
  await page.getByRole('button', { name: 'Register' }).click();
  expect((await clientRegistrationResponse).status()).toBe(201);
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Username or Email').fill(clientUsername);
  await page.getByLabel('Password').fill(password);

  const clientLoginResponse = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/auth/login'
  );
  await page.getByRole('button', { name: 'Login' }).click();
  expect((await clientLoginResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/$/);

  const productCard = page.locator('.product-card').filter({ hasText: productName });
  await expect(productCard).toBeVisible();
  const addToCartResponse = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/orders/cart'
  );
  await productCard.getByRole('button', { name: /Add to Cart/ }).click();
  expect((await addToCartResponse).status()).toBe(200);

  await page.getByRole('link', { name: 'Cart' }).click();
  await expect(page.locator('.cart-item__name', { hasText: productName })).toBeVisible();
  await page.getByRole('link', { name: /Proceed to Checkout/ }).click();

  await page.getByLabel('Full Name').fill('E2E Buyer');
  await page.getByLabel('Delivery Address').fill('123 Test Street, Test City');
  await page.getByLabel('Phone Number').fill('+1 555 010 1234');

  const checkoutResponse = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/orders/checkout'
  );
  await page.getByRole('button', { name: 'Place Order' }).click();
  const orderResponse = await checkoutResponse;
  expect(orderResponse.status()).toBe(201);
  const orders = await orderResponse.json();
  expect(orders).toHaveLength(1);
  expect(orders[0].items).toEqual(
    expect.arrayContaining([expect.objectContaining({ productName })])
  );
  expect(orders[0].status).toBe('PENDING');

  await expect(page.getByRole('heading', { name: 'Order Placed!' })).toBeVisible();
  await expect(page.locator('.confirm-order__item-name', { hasText: productName })).toBeVisible();

  await page.getByRole('button', { name: 'Logout' }).click();
  await page.goto('/login');
  await page.getByLabel('Username or Email').fill(username);
  await page.getByLabel('Password').fill(password);

  const sellerLoginResponse = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/auth/login'
  );
  await page.getByRole('button', { name: 'Login' }).click();
  expect((await sellerLoginResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/dashboard');
  const sellerOrdersResponse = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/orders/seller'
  );
  await page.getByRole('button', { name: 'Orders' }).click();
  const orderCard = page.locator('.order-card').filter({ hasText: productName });
  await expect(orderCard).toBeVisible();
  expect((await sellerOrdersResponse).status()).toBe(200);
  await expect(orderCard.locator('.order-card__status')).toHaveText('Pending');

  const confirmResponse = page.waitForResponse((response) =>
    response.request().method() === 'PATCH' &&
    new URL(response.url()).pathname === `/api/orders/${orders[0].id}/status`
  );
  await orderCard.getByRole('button', { name: 'Confirm order' }).click();
  const confirmedOrder = await confirmResponse;
  expect(confirmedOrder.status()).toBe(200);
  expect((await confirmedOrder.json()).status).toBe('CONFIRMED');
  await expect(orderCard.locator('.order-card__status')).toHaveText('Confirmed');

  const shipResponse = page.waitForResponse((response) =>
    response.request().method() === 'PATCH' &&
    new URL(response.url()).pathname === `/api/orders/${orders[0].id}/status`
  );
  await orderCard.getByRole('button', { name: 'Mark as shipped' }).click();
  const shippedOrder = await shipResponse;
  expect(shippedOrder.status()).toBe(200);
  expect((await shippedOrder.json()).status).toBe('SHIPPED');
  await expect(orderCard.locator('.order-card__status')).toHaveText('Shipped');

  const deliverResponse = page.waitForResponse((response) =>
    response.request().method() === 'PATCH' &&
    new URL(response.url()).pathname === `/api/orders/${orders[0].id}/status`
  );
  await orderCard.getByRole('button', { name: 'Mark as delivered and paid' }).click();
  const deliveredOrder = await deliverResponse;
  expect(deliveredOrder.status()).toBe(200);
  expect((await deliveredOrder.json()).status).toBe('DELIVERED');
  await expect(orderCard.locator('.order-card__status')).toHaveText('Delivered');
  await expect(orderCard.getByRole('button', { name: 'Mark as delivered and paid' })).toHaveCount(0);
});
