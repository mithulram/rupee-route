import { test, expect } from '@playwright/test';
import { API_URL, apiIsReachable, loginViaUi, uniqueEmail } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page, request }) => {
    test.skip(!(await apiIsReachable(request)), 'API must be running at PLAYWRIGHT_API_URL');

    const email = uniqueEmail('dashboard');
    const password = 'sandbox-pass-123';

    await request.post(`${API_URL}/api/v1/auth/register`, {
      data: { email, password, countryCode: 'DE' },
    });

    await loginViaUi(page, email, password);
  });

  test('shows dashboard sections for authenticated user', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /Dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Send money/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Recent transfers/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Saved recipients/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Rate alerts/i })).toBeVisible();
  });

  test('navigates to send flow from dashboard CTA', async ({ page }) => {
    await page
      .getByRole('link', { name: /Send money/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/send$/);
    await expect(page.getByRole('heading', { level: 1, name: /Send money/i })).toBeVisible();
  });
});
