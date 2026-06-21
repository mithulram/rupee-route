import type { BaseEnv } from '../env/index.js';

export interface FeatureFlags {
  /** When false (default), all transfers use sandbox providers only. */
  liveTransfersEnabled: boolean;
  transferCreationEnabled: boolean;
  fundingMethodEnabled: boolean;
  payoutMethodEnabled: boolean;
  providerSandboxEnabled: boolean;
  couponsEnabled: boolean;
}

export const DEFAULT_KILL_SWITCH_FLAGS: Record<
  keyof Omit<FeatureFlags, 'liveTransfersEnabled'>,
  { description: string; defaultEnabled: boolean }
> = {
  transferCreationEnabled: {
    description: 'Allow new transfer drafts',
    defaultEnabled: true,
  },
  fundingMethodEnabled: {
    description: 'Enable funding initiation',
    defaultEnabled: true,
  },
  payoutMethodEnabled: {
    description: 'Enable payout processing',
    defaultEnabled: true,
  },
  providerSandboxEnabled: {
    description: 'Use sandbox providers',
    defaultEnabled: true,
  },
  couponsEnabled: {
    description: 'Enable coupon application',
    defaultEnabled: true,
  },
};

export function resolveFeatureFlags(env: Pick<BaseEnv, 'LIVE_TRANSFERS_ENABLED'>): FeatureFlags {
  return {
    liveTransfersEnabled: env.LIVE_TRANSFERS_ENABLED,
    transferCreationEnabled: true,
    fundingMethodEnabled: true,
    payoutMethodEnabled: true,
    providerSandboxEnabled: true,
    couponsEnabled: true,
  };
}

export function mergeDbFeatureFlags(
  base: FeatureFlags,
  dbFlags: Record<string, boolean>,
): FeatureFlags {
  return {
    ...base,
    transferCreationEnabled: dbFlags.transfer_creation ?? base.transferCreationEnabled,
    fundingMethodEnabled: dbFlags.funding_method ?? base.fundingMethodEnabled,
    payoutMethodEnabled: dbFlags.payout_method ?? base.payoutMethodEnabled,
    providerSandboxEnabled: dbFlags.provider_sandbox ?? base.providerSandboxEnabled,
    couponsEnabled: dbFlags.coupons ?? base.couponsEnabled,
  };
}

export function assertSandboxMode(flags: FeatureFlags): void {
  if (flags.liveTransfersEnabled) {
    throw new Error(
      'LIVE_TRANSFERS_ENABLED=true is not supported in this sandbox build. Set LIVE_TRANSFERS_ENABLED=false.',
    );
  }
}

export function assertTransferCreationEnabled(flags: FeatureFlags): void {
  if (!flags.transferCreationEnabled) {
    throw new Error('Transfer creation is temporarily disabled');
  }
}
