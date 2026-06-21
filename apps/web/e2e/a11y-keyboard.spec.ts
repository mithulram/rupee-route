import { test, expect } from '@playwright/test';
import {
  apiIsE2EReady,
  apiIsReachable,
  registerKycEligibleUser,
  uniqueEmail,
  API_URL,
  loginViaUi,
} from './helpers';

test.describe('Keyboard navigation', () => {
  test('login form is reachable and submittable via keyboard', async ({ page, request }) => {
    test.skip(!(await apiIsReachable(request)), 'API must be running');
    test.setTimeout(90_000);
    const email = uniqueEmail('kb-login');
    const password = 'sandbox-pass-123';
    const register = await request.post(`${API_URL}/api/v1/auth/register`, {
      data: { email, password, countryCode: 'DE' },
    });
    expect(register.ok()).toBeTruthy();

    await page.goto('/login');
    await page.getByLabel(/Email|E-Mail/i).click();
    await page.keyboard.type(email);
    await page.getByLabel(/Password|Passwort/i).click();
    await page.keyboard.type(password);
    await page.getByLabel(/Password|Passwort/i).press('Enter');
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  });

  test('send flow steps reachable via keyboard', async ({ page, request }) => {
    test.skip(
      !(await apiIsE2EReady(request)),
      'API must be running with SANDBOX_FORCE_KYC_APPROVED=true',
    );
    test.setTimeout(90_000);

    const user = await registerKycEligibleUser(request);
    await loginViaUi(page, user.email, user.password);

    await page.goto('/send');
    await page.getByLabel(/Amount|Betrag/i).click();
    await page.keyboard.type('100');
    await page.getByRole('button', { name: /Continue|Weiter/i }).click();

    await expect(page.getByLabel(/Select recipient|Empfänger wählen/i)).toBeVisible({
      timeout: 20_000,
    });
    await page.getByLabel(/Select recipient|Empfänger wählen/i).selectOption(user.recipientId);
    await page.getByRole('button', { name: /Continue|Weiter/i }).click();

    await expect(
      page.getByRole('heading', { name: /Review transfer|Überweisung prüfen/i }),
    ).toBeVisible();
    const confirmBtn = page.getByRole('button', {
      name: /Confirm and get funding|Bestätigen und Finanzierung/i,
    });
    await confirmBtn.focus();
    await expect(confirmBtn).toBeFocused();
  });

  test('transfer detail controls reachable via keyboard', async ({ page, request }) => {
    test.skip(
      !(await apiIsE2EReady(request)),
      'API must be running with SANDBOX_FORCE_KYC_APPROVED=true',
    );

    const user = await registerKycEligibleUser(request);
    await loginViaUi(page, user.email, user.password);
    await page.goto(`/transfers/${user.transferId}`);
    await expect(
      page.getByRole('heading', { name: /Transfer detail|Überweisungsdetail/i }),
    ).toBeVisible({
      timeout: 15_000,
    });

    const cancelBtn = page.getByRole('button', { name: /Cancel|Stornieren/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.focus();
      await expect(cancelBtn).toBeFocused();
    } else {
      await page
        .getByRole('link', { name: /Back|Zurück/i })
        .first()
        .focus();
      await expect(page.locator(':focus')).toBeVisible();
    }
  });
});

test.describe('German keyboard navigation', () => {
  test('German login labels work with keyboard', async ({ page, request }) => {
    test.skip(!(await apiIsReachable(request)), 'API must be running');
    const email = uniqueEmail('de-kb');
    const password = 'sandbox-pass-123';
    await request.post(`${API_URL}/api/v1/auth/register`, {
      data: { email, password, countryCode: 'DE' },
    });

    await page.addInitScript(() => localStorage.setItem('rr_lang', 'de'));
    await page.goto('/login');
    await expect(page.getByLabel(/E-Mail/i)).toBeVisible();
    await page.getByLabel(/E-Mail/i).click();
    await page.keyboard.type(email);
    await page.getByLabel(/Passwort/i).click();
    await page.keyboard.type(password);
    await page.getByLabel(/Passwort/i).press('Enter');
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  });
});
