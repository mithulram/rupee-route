import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('shows hero, calculator, and auth entry points', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 1, name: /Send EUR or CHF to India/i }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Rate calculator/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /Getting started/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Register/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Sign in/i }).first()).toBeVisible();
  });

  test('navigates to register from landing', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('link', { name: /^Register$/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading', { level: 1, name: /Create account/i })).toBeVisible();
  });
});
