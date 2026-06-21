import { clearAdminSession, getAdminToken } from './auth-storage';
import type {
  AdminAuthResponse,
  AdminUser,
  AuditEvent,
  ComplianceReview,
  EndUser,
  FeatureFlag,
  PaginatedResponse,
  PrivacyRequest,
  ProviderStatus,
  ReconciliationException,
  ReconciliationRun,
  RefundProposal,
  TicketDetail,
  TicketSummary,
  TransferDetail,
  TransferSummary,
  WebhookFailure,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAdminToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (response.status === 401) {
    clearAdminSession();
  }

  if (!response.ok) {
    let message = `API error: ${String(response.status)}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return response.text() as Promise<T>;
}

function toQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function getHealth() {
  return adminFetch<{ status: string; sandboxMode: boolean; service: string }>('/health');
}

export async function adminLogin(email: string, password: string) {
  return adminFetch<AdminAuthResponse>('/api/v1/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getAdminMe() {
  return adminFetch<AdminUser>('/api/v1/admin/me');
}

export async function listTransfers(params?: { state?: string; userId?: string; q?: string }) {
  return adminFetch<PaginatedResponse<TransferSummary>>(
    `/api/v1/admin/transfers${toQuery(params ?? {})}`,
  );
}

export async function getTransfer(id: string) {
  return adminFetch<TransferDetail>(`/api/v1/admin/transfers/${id}`);
}

export async function getUser(id: string) {
  return adminFetch<EndUser>(`/api/v1/admin/users/${id}`);
}

export async function listAuditEvents(params?: {
  resourceType?: string;
  resourceId?: string;
  from?: string;
  to?: string;
}) {
  return adminFetch<PaginatedResponse<AuditEvent>>(
    `/api/v1/admin/audit-events${toQuery(params ?? {})}`,
  );
}

export async function exportAuditEvents(params?: {
  resourceType?: string;
  resourceId?: string;
  from?: string;
  to?: string;
}): Promise<string> {
  const headers = new Headers({ Accept: 'text/csv' });
  const token = getAdminToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(
    `${API_URL}/api/v1/admin/audit-events/export${toQuery(params ?? {})}`,
    { headers, cache: 'no-store' },
  );

  if (!response.ok) {
    throw new ApiError(response.status, 'Export failed');
  }

  return response.text();
}

export async function listTickets(params?: { status?: string; transferId?: string }) {
  return adminFetch<PaginatedResponse<TicketSummary>>(
    `/api/v1/admin/tickets${toQuery(params ?? {})}`,
  );
}

export async function getTicket(id: string) {
  return adminFetch<TicketDetail>(`/api/v1/admin/tickets/${id}`);
}

export async function createTicket(body: {
  subject: string;
  description: string;
  transferId?: string;
  priority?: string;
}) {
  return adminFetch<TicketDetail>('/api/v1/admin/tickets', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateTicket(
  id: string,
  body: { status?: string; priority?: string; assigneeEmail?: string },
) {
  return adminFetch<TicketDetail>(`/api/v1/admin/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function listComplianceReviews() {
  return adminFetch<PaginatedResponse<ComplianceReview>>('/api/v1/admin/compliance/reviews');
}

export async function decideComplianceReview(id: string, decision: 'approve' | 'decline') {
  return adminFetch<ComplianceReview>(`/api/v1/admin/compliance/reviews/${id}/decide`, {
    method: 'POST',
    body: JSON.stringify({ decision }),
  });
}

export async function listReconciliationRuns() {
  return adminFetch<PaginatedResponse<ReconciliationRun>>('/api/v1/admin/reconciliation/runs');
}

export async function triggerReconciliationRun() {
  return adminFetch<ReconciliationRun>('/api/v1/admin/reconciliation/runs', {
    method: 'POST',
  });
}

export async function listReconciliationExceptions() {
  return adminFetch<PaginatedResponse<ReconciliationException>>(
    '/api/v1/admin/reconciliation/exceptions',
  );
}

export async function listWebhookFailures() {
  return adminFetch<PaginatedResponse<WebhookFailure>>('/api/v1/admin/webhook-failures');
}

export async function retryWebhookFailure(id: string) {
  return adminFetch<WebhookFailure>(`/api/v1/admin/webhook-failures/${id}/retry`, {
    method: 'POST',
  });
}

export async function listRefundProposals() {
  return adminFetch<PaginatedResponse<RefundProposal>>('/api/v1/admin/refund-proposals');
}

export async function createRefundProposal(body: {
  transferId: string;
  amount: string;
  reason: string;
}) {
  return adminFetch<RefundProposal>('/api/v1/admin/refund-proposals', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function approveRefundProposal(id: string) {
  return adminFetch<RefundProposal>(`/api/v1/admin/refund-proposals/${id}/approve`, {
    method: 'POST',
  });
}

export async function listProviderStatus() {
  return adminFetch<{ providers: ProviderStatus[] }>('/api/v1/admin/providers/status');
}

export async function listFeatureFlags() {
  return adminFetch<{ flags: FeatureFlag[] }>('/api/v1/admin/feature-flags');
}

export async function updateFeatureFlag(key: string, enabled: boolean) {
  return adminFetch<FeatureFlag>('/api/v1/admin/feature-flags', {
    method: 'PATCH',
    body: JSON.stringify({ key, enabled }),
  });
}

export async function listPrivacyRequests() {
  return adminFetch<PaginatedResponse<PrivacyRequest>>('/api/v1/admin/privacy-requests');
}

export async function createPrivacyRequest(body: { userId: string; type: 'export' | 'delete' }) {
  return adminFetch<PrivacyRequest>('/api/v1/admin/privacy-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
