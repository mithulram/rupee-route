import { test, expect } from '@playwright/test';

test.describe('German layout', () => {
  test('landing shows German copy after locale switch', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'DE', pressed: false }).click();

    await expect(
      page.getByRole('heading', { level: 1, name: /EUR oder CHF nach Indien senden/i }),
    ).toBeVisible();
    await expect(page.getByText(/Sandbox-Umgebung/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Registrieren/i })).toBeVisible();
  });

  test('German landing fits without horizontal overflow on mobile', async ({ page }, testInfo) => {
    test.skip(
      !testInfo.project.name.includes('mobile'),
      'Overflow check runs on mobile viewports only',
    );
    await page.addInitScript(() => localStorage.setItem('rr_lang', 'de'));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
    await expect(page.getByRole('heading', { name: /EUR oder CHF/i })).toBeVisible();
  });
});
