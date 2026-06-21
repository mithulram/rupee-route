import { test, expect } from '@playwright/test';
import { apiIsE2EReady, clickConfirmAndWait, loginViaUi, registerKycEligibleUser } from './helpers';

test.describe('Full sandbox send flow', () => {
  test.beforeEach(async ({ request }) => {
    test.skip(
      !(await apiIsE2EReady(request)),
      'API must be running with SANDBOX_FORCE_KYC_APPROVED=true at PLAYWRIGHT_API_URL',
    );
  });

  test('amount → recipient → review → funding → tracking', async ({ page, request }) => {
    test.setTimeout(60_000);
    const user = await registerKycEligibleUser(request);
    await loginViaUi(page, user.email, user.password);

    await page.goto('/send');
    await page.getByLabel(/Amount|Betrag/i).fill('100');
    const quoteResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/quotes') &&
        response.request().method() === 'POST' &&
        response.ok(),
    );
    await page.getByRole('button', { name: /Continue|Weiter/i }).click();
    await quoteResponse;

    await expect(page.getByLabel(/Select recipient|Empfänger wählen/i)).toBeVisible({
      timeout: 15_000,
    });
    await page.getByLabel(/Select recipient|Empfänger wählen/i).selectOption(user.recipientId);
    const attachResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/recipient') &&
        response.request().method() === 'POST' &&
        response.ok(),
    );
    await page.getByRole('button', { name: /Continue|Weiter/i }).click();
    await attachResponse;

    await expect(
      page.getByRole('heading', { name: /Review transfer|Überweisung prüfen/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Quote expires|Quote läuft ab/i)).toBeVisible();
    const confirmBtn = page.getByRole('button', {
      name: /Confirm and get funding|Bestätigen und Finanzierung/i,
    });
    await confirmBtn.scrollIntoViewIfNeeded();
    await clickConfirmAndWait(page, confirmBtn);

    await expect(
      page.getByRole('heading', { name: /Funding instructions|Finanzierungsanweisung/i }),
    ).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /Track transfer|Überweisung verfolgen/i }).click();

    await expect(page).toHaveURL(/\/transfers\//);
    await expect(
      page.getByRole('heading', { name: /Transfer detail|Überweisungsdetail/i }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /Receipt|Beleg/i })).toBeVisible();
  });

  test('transfer history lists sandbox send', async ({ page, request }) => {
    test.setTimeout(60_000);
    const user = await registerKycEligibleUser(request);
    await loginViaUi(page, user.email, user.password);

    await page.goto('/send');
    await page.getByLabel(/Amount|Betrag/i).fill('50');
    await page.getByRole('button', { name: /Continue|Weiter/i }).click();
    await page.getByLabel(/Select recipient|Empfänger wählen/i).selectOption(user.recipientId);
    await page.getByRole('button', { name: /Continue|Weiter/i }).click();
    await expect(
      page.getByRole('heading', { name: /Review transfer|Überweisung prüfen/i }),
    ).toBeVisible({
      timeout: 15_000,
    });
    const confirmBtn = page.getByRole('button', {
      name: /Confirm and get funding|Bestätigen und Finanzierung/i,
    });
    await confirmBtn.scrollIntoViewIfNeeded();
    await clickConfirmAndWait(page, confirmBtn);
    await expect(
      page.getByRole('heading', { name: /Funding instructions|Finanzierungsanweisung/i }),
    ).toBeVisible({ timeout: 15_000 });

    await page.goto('/transfers');
    await expect(
      page.getByRole('heading', { name: /Transfer history|Überweisungsverlauf/i }),
    ).toBeVisible();
    await expect(page.locator('ul.list .list-row').first()).toBeVisible({ timeout: 20_000 });
  });
});

test.describe('Quote review transparency', () => {
  test('review step shows margin and delivery disclaimer', async ({ page, request }) => {
    test.skip(
      !(await apiIsE2EReady(request)),
      'API must be running with SANDBOX_FORCE_KYC_APPROVED=true',
    );
    test.setTimeout(60_000);

    const user = await registerKycEligibleUser(request);
    await loginViaUi(page, user.email, user.password);

    await page.goto('/send');
    await page.getByLabel(/Amount|Betrag/i).fill('100');
    await page.getByRole('button', { name: /Continue|Weiter/i }).click();
    await page.getByLabel(/Select recipient|Empfänger wählen/i).selectOption(user.recipientId);
    await page.getByRole('button', { name: /Continue|Weiter/i }).click();

    await expect(
      page.getByRole('heading', { name: /Review transfer|Überweisung prüfen/i }),
    ).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(/not guaranteed instant|nicht garantiert sofort/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/Not a free transfer|Keine kostenlose Überweisung/i).first(),
    ).toBeVisible();
  });
});
