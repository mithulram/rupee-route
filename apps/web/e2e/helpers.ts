import type { APIRequestContext } from '@playwright/test';

export const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3001';

const CONFIRMABLE_TRANSFER_STATES = new Set(['recipient_validated', 'compliance_review']);

export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@sandbox.rupeeroute.test`;
}

export async function apiIsReachable(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get(`${API_URL}/health`);
    return response.ok();
  } catch {
    return false;
  }
}

/** True when API is up and sandbox KYC is forced approved (required for confirm/send E2E). */
export async function apiIsE2EReady(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get(`${API_URL}/health`);
    if (!response.ok()) return false;
    const body = (await response.json()) as { sandboxForceKycApproved?: boolean };
    return body.sandboxForceKycApproved === true;
  } catch {
    return false;
  }
}

function idempotencyKey(): string {
  return crypto.randomUUID();
}

/** Register a sandbox user ready for send flow (KYC approved or deterministic retry). */
export async function registerKycEligibleUser(request: APIRequestContext): Promise<{
  email: string;
  password: string;
  token: string;
  recipientId: string;
  transferId: string;
}> {
  const password = 'sandbox-pass-123';

  for (let attempt = 0; attempt < 10; attempt++) {
    const email = uniqueEmail(`flow-${attempt}`);
    const register = await request.post(`${API_URL}/api/v1/auth/register`, {
      data: { email, password, countryCode: 'DE' },
    });
    if (!register.ok()) continue;

    const login = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email, password },
    });
    if (!login.ok()) continue;

    const loginBody = (await login.json()) as { accessToken: string };
    const headers = {
      Authorization: `Bearer ${loginBody.accessToken}`,
      'Idempotency-Key': idempotencyKey(),
    };

    const recipientRes = await request.post(`${API_URL}/api/v1/recipients`, {
      headers,
      data: {
        type: 'bank_account',
        displayName: 'E2E Family',
        accountHolder: 'Test Recipient',
        ifsc: 'HDFC0001234',
        accountNumber: '123456789012',
      },
    });
    if (!recipientRes.ok()) continue;
    const recipient = (await recipientRes.json()) as { id: string };

    const quoteRes = await request.post(`${API_URL}/api/v1/quotes`, {
      headers: { ...headers, 'Idempotency-Key': idempotencyKey() },
      data: { sourceCurrency: 'EUR', sourceAmountMinor: '10000' },
    });
    if (!quoteRes.ok()) continue;
    const quote = (await quoteRes.json()) as { id: string };

    const transferRes = await request.post(`${API_URL}/api/v1/transfers`, {
      headers: { ...headers, 'Idempotency-Key': idempotencyKey() },
      data: { quoteId: quote.id },
    });
    if (!transferRes.ok()) continue;
    const transfer = (await transferRes.json()) as { id: string };

    const attachRes = await request.post(`${API_URL}/api/v1/transfers/${transfer.id}/recipient`, {
      headers: { ...headers, 'Idempotency-Key': idempotencyKey() },
      data: { recipientId: recipient.id },
    });
    if (!attachRes.ok()) continue;

    const attached = (await attachRes.json()) as { state: string };
    if (!CONFIRMABLE_TRANSFER_STATES.has(attached.state)) continue;

    return {
      email,
      password,
      token: loginBody.accessToken,
      recipientId: recipient.id,
      transferId: transfer.id,
    };
  }

  throw new Error(
    'Could not register sandbox user with confirmable transfer — restart API with SANDBOX_FORCE_KYC_APPROVED=true',
  );
}

export async function loginViaUi(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/Email|E-Mail/i).fill(email);
  await page.getByLabel(/Password|Passwort/i).fill(password);
  await page.getByRole('button', { name: /Sign in|Anmelden/i }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });
}

/** Wait for POST /confirm and assert success (fails fast on 4xx instead of hanging). */
export async function clickConfirmAndWait(
  page: import('@playwright/test').Page,
  confirmBtn: import('@playwright/test').Locator,
): Promise<void> {
  const confirmResponse = page.waitForResponse(
    (response) => response.url().includes('/confirm') && response.request().method() === 'POST',
    { timeout: 20_000 },
  );
  await confirmBtn.click();
  const response = await confirmResponse;
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Confirm failed (${response.status()}): ${body}`);
  }
}
