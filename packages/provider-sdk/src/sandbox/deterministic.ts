import { applyRate, computeCustomerRate, getMidRate } from '@rupeeroute/domain';
import type {
  FundingProvider,
  FxQuoteProvider,
  FxQuoteRequest,
  KycProvider,
  NotificationProvider,
  PayoutProvider,
  SandboxProviderBundle,
  SandboxScenario,
  ScreeningProvider,
} from '../types.js';

const DEFAULT_MARGIN_BPS = 75;

function hashSeed(input: string, seed: string): number {
  let hash = 0;
  const combined = `${seed}:${input}`;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function scenarioForTransfer(
  transferId: string,
  seed: string,
  override?: SandboxScenario,
): SandboxScenario {
  if (override) return override;
  const bucket = hashSeed(transferId, seed) % 5;
  const scenarios: SandboxScenario[] = [
    'happy_path',
    'happy_path',
    'funding_failed',
    'compliance_hold',
    'payout_failed',
  ];
  return scenarios[bucket] ?? 'happy_path';
}

export function createDeterministicSandboxProviders(
  seed = 'rupeeroute-sandbox',
  scenarioOverride?: SandboxScenario,
): SandboxProviderBundle & { getScenario: (transferId: string) => SandboxScenario } {
  const getScenario = (transferId: string) =>
    scenarioForTransfer(transferId, seed, scenarioOverride);

  const fxQuote: FxQuoteProvider = {
    getQuote(request: FxQuoteRequest) {
      const midRate = getMidRate(request.sourceCurrency, request.targetCurrency);
      const customerRate = computeCustomerRate(midRate, DEFAULT_MARGIN_BPS);
      const targetAmountMinor = applyRate(request.sourceAmountMinor, customerRate);
      return Promise.resolve({
        midRate,
        customerRate,
        marginBps: DEFAULT_MARGIN_BPS,
        targetAmountMinor,
      });
    },
  };

  const kyc: KycProvider = {
    checkStatus(userId) {
      if (process.env.SANDBOX_FORCE_KYC_APPROVED === 'true') {
        return Promise.resolve({ status: 'approved' as const });
      }
      const bucket = hashSeed(userId, seed) % 3;
      const statuses = ['approved', 'pending', 'rejected'] as const;
      return Promise.resolve({ status: statuses[bucket] ?? 'pending' });
    },
    submitVerification(userId, _context) {
      return kyc.checkStatus(userId, _context);
    },
  };

  const screening: ScreeningProvider = {
    screenTransfer(transferId) {
      const scenario = getScenario(transferId);
      if (scenario === 'compliance_hold') return Promise.resolve({ status: 'held' as const });
      return Promise.resolve({ status: 'cleared' as const });
    },
  };

  const funding: FundingProvider = {
    initiateFunding(transferId, amount, context) {
      void amount;
      const scenario = getScenario(transferId);
      if (scenario === 'funding_failed') {
        return Promise.resolve({
          reference: `fund_fail_${context.idempotencyKey}`,
          status: 'failed' as const,
        });
      }
      return Promise.resolve({
        reference: `fund_${context.idempotencyKey}`,
        status: 'pending' as const,
      });
    },
  };

  const payout: PayoutProvider = {
    initiatePayout(recipientId, amount, context) {
      void amount;
      const transferId = context.idempotencyKey.replace(/^payout_/, '');
      const scenario = getScenario(transferId);
      if (scenario === 'payout_failed') {
        return Promise.resolve({ reference: `po_fail_${recipientId}`, status: 'failed' as const });
      }
      return Promise.resolve({
        reference: `po_${recipientId}_${context.idempotencyKey}`,
        status: 'processing' as const,
      });
    },
  };

  const notifications: NotificationProvider = {
    notify(_userId, _event, _payload, _context) {
      return Promise.resolve({ delivered: true });
    },
  };

  return { fxQuote, kyc, screening, funding, payout, notifications, getScenario };
}

export function createSandboxProviders(
  seed = 'rupeeroute-sandbox',
  scenarioOverride?: SandboxScenario,
): SandboxProviderBundle {
  const bundle = createDeterministicSandboxProviders(seed, scenarioOverride);
  return bundle;
}
