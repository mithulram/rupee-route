export interface HealthResponse {
  status: 'ok';
  service: string;
  sandboxMode: boolean;
  liveTransfersEnabled: boolean;
}

export interface ServiceStatusResponse {
  status: 'operational';
  environment: 'sandbox';
  corridors: string[];
  message: string;
  components: { name: string; status: string }[];
}

export interface UserProfile {
  id: string;
  email: string;
  countryCode: 'DE' | 'CH';
  preferredLanguage: 'en' | 'de';
  notificationEmail: boolean;
  kycStatus: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: UserProfile;
}

export interface ErrorResponse {
  message: string;
  code: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  countryCode: 'DE' | 'CH';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface QuoteResponse {
  id: string;
  sourceCurrency: 'EUR' | 'CHF';
  targetCurrency: 'INR';
  sourceAmountMinor: string;
  targetAmountMinor: string;
  midRate: string;
  customerRate: string;
  marginBps: number;
  marginPercent: string;
  marginDisclosure: string;
  couponCode: string | null;
  couponLabel: string | null;
  expiresAt: string;
  createdAt: string;
  deliveryEstimate: string;
}

export interface RecipientResponse {
  id: string;
  displayName: string;
  type: 'bank_account' | 'upi';
  accountHolder: string;
  ifsc: string | null;
  accountNumber: string | null;
  upiId: string | null;
  validated: boolean;
  createdAt: string;
}

export interface TransferSummary {
  id: string;
  state: string;
  quoteId: string;
  recipientId: string | null;
  correlationId: string;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  sourceCurrency?: string;
  sourceAmountMinor?: string;
  targetAmountMinor?: string;
  recipientName?: string | null;
}

export interface TransferDetail extends TransferSummary {
  quote: {
    id: string;
    sourceCurrency: 'EUR' | 'CHF';
    sourceAmountMinor: string;
    targetAmountMinor: string;
    customerRate: string;
    marginPercent: string;
    marginDisclosure: string;
    expiresAt: string;
  } | null;
  stateHistory: {
    fromState: string | null;
    toState: string;
    actorType: string;
    occurredAt: string;
    reason: string | null;
  }[];
  fundingReference?: string;
  fundingStatus?: string;
  message?: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  transferId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrivacyRequest {
  id: string;
  type: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
}

export interface SandboxCoupon {
  code: string;
  marginBpsReduction: number;
  label: string;
  expiresAt: string | null;
}
