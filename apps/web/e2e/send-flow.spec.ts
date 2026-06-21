import { test, expect } from '@playwright/test';
import { API_URL, apiIsReachable, uniqueEmail } from './helpers';

test.describe('Send flow start', () => {
  test.beforeEach(async ({ page, request }) => {
    test.skip(!(await apiIsReachable(request)), 'API must be running at PLAYWRIGHT_API_URL');

    const email = uniqueEmail('send');
    const password = 'sandbox-pass-123';

    await request.post(`${API_URL}/api/v1/auth/register`, {
      data: { email, password, countryCode: 'DE' },
    });

    await page.goto('/login');
    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Password/i).fill(password);
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('opens send flow amount step with stepper', async ({ page }) => {
    await page.goto('/send');

    await expect(page.getByRole('heading', { level: 1, name: /Send money/i })).toBeVisible();
    await expect(page.getByRole('list', { name: /Send steps/i })).toBeVisible();
    await expect(page.getByLabel(/Currency/i)).toBeVisible();
    await expect(page.getByLabel(/Amount/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();
  });

  test('starts quote creation from amount step', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/send');
    await page.getByLabel(/Amount/i).fill('100');
    await page.getByRole('button', { name: /Continue/i }).click();

    await expect(page.getByRole('listitem').filter({ hasText: /Recipient/i })).toHaveAttribute(
      'aria-current',
      'step',
    );
    await expect(page.getByText(/You send/i)).toBeVisible();
    await expect(page.getByLabel(/Select recipient/i)).toBeVisible();
  });
});
