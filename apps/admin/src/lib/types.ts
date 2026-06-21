export type AdminRole = 'support' | 'compliance' | 'finance' | 'administrator' | 'auditor';

export interface AdminUser {
  id: string;
  email: string;
  roles: AdminRole[];
}

export interface AdminAuthResponse {
  accessToken: string;
  admin: AdminUser;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface TransferSummary {
  id: string;
  userId: string;
  state: string;
  sourceCurrency: string;
  destinationCurrency: string;
  sourceAmount: string;
  destinationAmount: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferQuote {
  id: string;
  rate: string;
  feeAmount: string;
  expiresAt: string;
}

export interface TransferRecipient {
  id: string;
  displayName: string;
  type: string;
  accountMask: string;
}

export interface StateHistoryEntry {
  id: string;
  fromState: string | null;
  toState: string;
  reason: string | null;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  type: string;
  amount: string;
  currency: string;
  direction: 'debit' | 'credit';
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  provider: string;
  eventType: string;
  status: string;
  receivedAt: string;
  payloadSummary?: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  actorId: string | null;
  actorEmail: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface TransferDetail {
  transfer: TransferSummary & { reference?: string; idempotencyKey?: string };
  quote: TransferQuote | null;
  recipient: TransferRecipient | null;
  stateHistory: StateHistoryEntry[];
  ledgerEntries: LedgerEntry[];
  webhookEvents: WebhookEvent[];
  auditEvents: AuditEvent[];
  tickets?: TicketSummary[];
}

export interface EndUser {
  id: string;
  email: string;
  countryCode: string;
  kycStatus: string;
  createdAt: string;
  transferCount?: number;
}

export interface TicketSummary {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  transferId: string | null;
  assigneeEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetail extends TicketSummary {
  description: string;
  comments: { id: string; authorEmail: string; body: string; createdAt: string }[];
}

export interface ComplianceReview {
  id: string;
  userId: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'declined';
  riskScore: number;
  flags: string[];
  submittedAt: string;
}

export interface ReconciliationRun {
  id: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  exceptionCount: number;
}

export interface ReconciliationException {
  id: string;
  runId: string;
  transferId: string;
  type: string;
  amountDelta: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface WebhookFailure {
  id: string;
  provider: string;
  eventType: string;
  transferId: string | null;
  failureReason: string;
  retryCount: number;
  lastAttemptAt: string;
}

export interface RefundProposal {
  id: string;
  transferId: string;
  amount: string;
  currency: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  proposedBy: string;
  createdAt: string;
}

export interface ProviderStatus {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheckedAt: string;
  message: string | null;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  updatedAt: string;
}

export interface PrivacyRequest {
  id: string;
  userId: string;
  userEmail: string;
  type: 'export' | 'delete';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestedAt: string;
}
