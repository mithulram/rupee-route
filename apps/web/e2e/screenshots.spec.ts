import path from 'node:path';
import { test } from '@playwright/test';
import { apiIsReachable, loginViaUi, registerKycEligibleUser, uniqueEmail } from './helpers';

const screenshotDir = path.resolve(__dirname, '../../../docs/screenshots');

test.describe('Screenshots @screenshot', () => {
  test.beforeEach(async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop Chromium only');
    test.skip(!(await apiIsReachable(request)), 'API must be running');
  });

  test('capture key web screens', async ({ page, request }) => {
    test.setTimeout(90_000);

    await page.goto('/');
    await page.screenshot({ path: path.join(screenshotDir, 'web-landing.png'), fullPage: true });

    const user = await registerKycEligibleUser(request);
    await loginViaUi(page, user.email, user.password);

    await page.goto('/dashboard');
    await page.screenshot({ path: path.join(screenshotDir, 'web-dashboard.png'), fullPage: true });

    await page.goto('/send');
    await page.getByRole('heading', { name: /Send money|Geld senden/i }).waitFor();
    await page.screenshot({
      path: path.join(screenshotDir, 'web-send-amount.png'),
      fullPage: true,
    });

    await page.getByLabel(/Amount|Betrag/i).fill('100');
    await page.getByRole('button', { name: /Continue|Weiter/i }).click();
    await page.getByLabel(/Select recipient|Empfänger wählen/i).selectOption(user.recipientId);
    await page.screenshot({
      path: path.join(screenshotDir, 'web-send-recipient.png'),
      fullPage: true,
    });
  });
});
