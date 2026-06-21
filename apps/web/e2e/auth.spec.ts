import { test, expect } from '@playwright/test';
import { API_URL, apiIsReachable, uniqueEmail } from './helpers';

test.describe('Register and login', () => {
  test.beforeEach(async ({ request }) => {
    test.skip(!(await apiIsReachable(request)), 'API must be running at PLAYWRIGHT_API_URL');
  });

  test('registers a sandbox user and lands on dashboard', async ({ page }) => {
    const email = uniqueEmail('register');
    const password = 'sandbox-pass-123';

    await page.goto('/register');
    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Password/i).fill(password);
    await page.getByLabel(/Country of residence/i).selectOption('DE');
    await page.getByRole('button', { name: /Register/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { level: 1, name: /Dashboard/i })).toBeVisible();
  });

  test('logs in with existing credentials', async ({ page, request }) => {
    const email = uniqueEmail('login');
    const password = 'sandbox-pass-123';

    const registerResponse = await request.post(`${API_URL}/api/v1/auth/register`, {
      data: { email, password, countryCode: 'DE' },
    });
    test.skip(!registerResponse.ok(), 'Could not seed user via API');

    await page.goto('/login');
    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Password/i).fill(password);
    await page.getByRole('button', { name: /Sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('link', { name: /Send money/i }).first()).toBeVisible();
  });
});
