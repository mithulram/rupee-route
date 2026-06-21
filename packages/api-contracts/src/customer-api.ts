import type {
  AuthResponse,
  LoginRequest,
  PrivacyRequest,
  QuoteResponse,
  RecipientResponse,
  RegisterRequest,
  SandboxCoupon,
  SupportTicket,
  TransferDetail,
  TransferSummary,
  UserProfile,
} from './types.js';

export type {
  AuthResponse,
  LoginRequest,
  PrivacyRequest,
  QuoteResponse,
  RecipientResponse,
  RegisterRequest,
  SandboxCoupon,
  SupportTicket,
  TransferDetail,
  TransferSummary,
  UserProfile,
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type TokenProvider = () => string | null;
export type TokenClearHandler = () => void;

let tokenProvider: TokenProvider = () => null;
let onUnauthorized: TokenClearHandler = () => undefined;

export function configureCustomerApi(options: {
  getToken: TokenProvider;
  onUnauthorized?: TokenClearHandler;
}) {
  tokenProvider = options.getToken;
  onUnauthorized = options.onUnauthorized ?? (() => undefined);
}

export function newIdempotencyKey(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `${String(Date.now())}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function customerFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = tokenProvider();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  } as RequestInit);

  if (response.status === 401) onUnauthorized();

  if (!response.ok) {
    let message = `API error: ${String(response.status)}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const customerApi = {
  register: (body: RegisterRequest) =>
    customerFetch<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: LoginRequest) =>
    customerFetch<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getMe: () => customerFetch<UserProfile>('/api/v1/me'),
  updateMe: (body: Partial<Pick<UserProfile, 'preferredLanguage' | 'notificationEmail'>>) =>
    customerFetch<UserProfile>('/api/v1/me', { method: 'PATCH', body: JSON.stringify(body) }),
  createQuote: (
    body: { sourceCurrency: 'EUR' | 'CHF'; sourceAmountMinor: string; couponCode?: string },
    key: string,
  ) =>
    customerFetch<QuoteResponse>('/api/v1/quotes', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify(body),
    }),
  listCoupons: () => customerFetch<{ coupons: SandboxCoupon[] }>('/api/v1/quotes/coupons'),
  listRecipients: () => customerFetch<RecipientResponse[]>('/api/v1/recipients'),
  createRecipient: (body: Record<string, string>) =>
    customerFetch<RecipientResponse>('/api/v1/recipients', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listTransfers: () => customerFetch<TransferSummary[]>('/api/v1/transfers'),
  createTransfer: (quoteId: string, key: string) =>
    customerFetch<TransferDetail>('/api/v1/transfers', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify({ quoteId }),
    }),
  attachRecipient: (transferId: string, recipientId: string, key: string) =>
    customerFetch<TransferDetail>(`/api/v1/transfers/${transferId}/recipient`, {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify({ recipientId }),
    }),
  confirmTransfer: (transferId: string, key: string) =>
    customerFetch<TransferDetail>(`/api/v1/transfers/${transferId}/confirm`, {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
    }),
  cancelTransfer: (transferId: string, key: string) =>
    customerFetch<TransferDetail>(`/api/v1/transfers/${transferId}/cancel`, {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
    }),
  getTransfer: (transferId: string) =>
    customerFetch<TransferDetail>(`/api/v1/transfers/${transferId}`),
  listSupportTickets: () => customerFetch<SupportTicket[]>('/api/v1/support/tickets'),
  createSupportTicket: (body: { subject: string; description: string; transferId?: string }) =>
    customerFetch<SupportTicket>('/api/v1/support/tickets', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listPrivacyRequests: () => customerFetch<PrivacyRequest[]>('/api/v1/privacy-requests'),
  createPrivacyRequest: (type: 'export' | 'delete') =>
    customerFetch<PrivacyRequest>('/api/v1/privacy-requests', {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
  getServiceStatus: () =>
    customerFetch<{ status: string; message: string }>('/health/service-status'),
};
