import { test, expect } from '@playwright/test';
import {
  API_URL,
  apiIsE2EReady,
  apiIsReachable,
  loginViaUi,
  registerKycEligibleUser,
} from './helpers';
import { expectNoAxeViolations } from './a11y-helpers';

test.describe('Accessibility — axe WCAG 2.2 AA', () => {
  test('landing page has no axe violations', async ({ page }) => {
    await page.goto('/');
    await expectNoAxeViolations(page);
  });

  test('login page has no axe violations', async ({ page }) => {
    await page.goto('/login');
    await expectNoAxeViolations(page);
  });

  test('register page has no axe violations', async ({ page }) => {
    await page.goto('/register');
    await expectNoAxeViolations(page);
  });

  test('authenticated send flow has no axe violations', async ({ page, request }) => {
    test.skip(
      !(await apiIsE2EReady(request)),
      'API must be running with SANDBOX_FORCE_KYC_APPROVED=true',
    );

    const user = await registerKycEligibleUser(request);
    await loginViaUi(page, user.email, user.password);
    await page.goto('/send');
    await expectNoAxeViolations(page);
  });

  test('transfer detail has no axe violations', async ({ page, request }) => {
    test.skip(
      !(await apiIsE2EReady(request)),
      'API must be running with SANDBOX_FORCE_KYC_APPROVED=true',
    );
    test.setTimeout(90_000);

    const user = await registerKycEligibleUser(request);
    await loginViaUi(page, user.email, user.password);
    await page.goto(`/transfers/${user.transferId}`);
    await expect(
      page.getByRole('heading', { name: /Transfer detail|Überweisungsdetail/i }),
    ).toBeVisible({
      timeout: 30_000,
    });

    await expectNoAxeViolations(page);
  });
});

test.describe('Accessibility — German locale', () => {
  test('German landing has no axe violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'DE', pressed: false }).click();
    await expect(page.getByRole('heading', { name: /EUR oder CHF/i })).toBeVisible({
      timeout: 15_000,
    });
    await expectNoAxeViolations(page);
  });

  test('German login has no axe violations', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('rr_lang', 'de'));
    await page.goto('/login');
    await expect(page.getByLabel(/E-Mail/i)).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
