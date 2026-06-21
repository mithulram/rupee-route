export const LEDGER_ACCOUNTS = {
  CUSTOMER_FUNDING: 'SANDBOX_CUSTOMER_FUNDING',
  FX_CLEARING_EUR: 'SANDBOX_FX_CLEARING_EUR',
  FX_CLEARING_CHF: 'SANDBOX_FX_CLEARING_CHF',
  FX_OUT_EUR: 'SANDBOX_FX_OUT_EUR',
  FX_OUT_CHF: 'SANDBOX_FX_OUT_CHF',
  FX_IN_INR: 'SANDBOX_FX_IN_INR',
  INR_PAYOUT: 'SANDBOX_INR_PAYOUT_CLEARING',
  FX_MARGIN: 'FX_MARGIN_REVENUE',
  PROVIDER: 'SANDBOX_PROVIDER_SETTLEMENT',
} as const;

export type LedgerDirection = 'debit' | 'credit';

export interface LedgerLine {
  accountCode: string;
  direction: LedgerDirection;
  amountMinor: bigint;
  currency: string;
  description: string;
}

export interface JournalEntry {
  journalId: string;
  transferId: string;
  idempotencyKey: string;
  lines: LedgerLine[];
}

export function validateJournal(entry: JournalEntry): void {
  if (entry.lines.length < 2) {
    throw new Error('Journal must have at least two lines');
  }

  const byCurrency = new Map<string, { debit: bigint; credit: bigint }>();

  for (const line of entry.lines) {
    if (line.amountMinor <= 0n) {
      throw new Error('Ledger line amount must be positive');
    }
    const bucket = byCurrency.get(line.currency) ?? { debit: 0n, credit: 0n };
    if (line.direction === 'debit') bucket.debit += line.amountMinor;
    else bucket.credit += line.amountMinor;
    byCurrency.set(line.currency, bucket);
  }

  for (const [currency, { debit, credit }] of byCurrency) {
    if (debit !== credit) {
      throw new Error(
        `Journal unbalanced for ${currency}: debit ${debit.toString()} != credit ${credit.toString()}`,
      );
    }
  }
}

export function buildFundingJournal(params: {
  journalId: string;
  transferId: string;
  idempotencyKey: string;
  sourceAmountMinor: bigint;
  sourceCurrency: string;
}): JournalEntry {
  const clearingAccount =
    params.sourceCurrency === 'CHF'
      ? LEDGER_ACCOUNTS.FX_CLEARING_CHF
      : LEDGER_ACCOUNTS.FX_CLEARING_EUR;

  const entry: JournalEntry = {
    journalId: params.journalId,
    transferId: params.transferId,
    idempotencyKey: params.idempotencyKey,
    lines: [
      {
        accountCode: LEDGER_ACCOUNTS.CUSTOMER_FUNDING,
        direction: 'debit',
        amountMinor: params.sourceAmountMinor,
        currency: params.sourceCurrency,
        description: 'Customer funding received',
      },
      {
        accountCode: clearingAccount,
        direction: 'credit',
        amountMinor: params.sourceAmountMinor,
        currency: params.sourceCurrency,
        description: 'Funded to FX clearing',
      },
    ],
  };
  validateJournal(entry);
  return entry;
}

export function buildFxBookedJournal(params: {
  journalId: string;
  transferId: string;
  idempotencyKey: string;
  sourceAmountMinor: bigint;
  sourceCurrency: string;
  targetAmountMinor: bigint;
  marginMinor: bigint;
}): JournalEntry {
  const clearingAccount =
    params.sourceCurrency === 'CHF'
      ? LEDGER_ACCOUNTS.FX_CLEARING_CHF
      : LEDGER_ACCOUNTS.FX_CLEARING_EUR;
  const outAccount =
    params.sourceCurrency === 'CHF' ? LEDGER_ACCOUNTS.FX_OUT_CHF : LEDGER_ACCOUNTS.FX_OUT_EUR;
  const netSource = params.sourceAmountMinor - params.marginMinor;

  const entry: JournalEntry = {
    journalId: params.journalId,
    transferId: params.transferId,
    idempotencyKey: params.idempotencyKey,
    lines: [
      {
        accountCode: clearingAccount,
        direction: 'debit',
        amountMinor: params.sourceAmountMinor,
        currency: params.sourceCurrency,
        description: 'FX conversion source leg',
      },
      {
        accountCode: LEDGER_ACCOUNTS.FX_MARGIN,
        direction: 'credit',
        amountMinor: params.marginMinor,
        currency: params.sourceCurrency,
        description: 'FX margin revenue',
      },
      {
        accountCode: outAccount,
        direction: 'credit',
        amountMinor: netSource,
        currency: params.sourceCurrency,
        description: 'FX converted source',
      },
      {
        accountCode: LEDGER_ACCOUNTS.FX_IN_INR,
        direction: 'debit',
        amountMinor: params.targetAmountMinor,
        currency: 'INR',
        description: 'FX converted INR',
      },
      {
        accountCode: LEDGER_ACCOUNTS.INR_PAYOUT,
        direction: 'credit',
        amountMinor: params.targetAmountMinor,
        currency: 'INR',
        description: 'INR awaiting payout',
      },
    ],
  };

  validateJournal(entry);
  return entry;
}

export function buildPayoutJournal(params: {
  journalId: string;
  transferId: string;
  idempotencyKey: string;
  targetAmountMinor: bigint;
}): JournalEntry {
  const entry: JournalEntry = {
    journalId: params.journalId,
    transferId: params.transferId,
    idempotencyKey: params.idempotencyKey,
    lines: [
      {
        accountCode: LEDGER_ACCOUNTS.INR_PAYOUT,
        direction: 'debit',
        amountMinor: params.targetAmountMinor,
        currency: 'INR',
        description: 'Payout to beneficiary',
      },
      {
        accountCode: LEDGER_ACCOUNTS.PROVIDER,
        direction: 'credit',
        amountMinor: params.targetAmountMinor,
        currency: 'INR',
        description: 'Provider settlement',
      },
    ],
  };
  validateJournal(entry);
  return entry;
}

export function buildRefundJournal(params: {
  journalId: string;
  transferId: string;
  idempotencyKey: string;
  sourceAmountMinor: bigint;
  sourceCurrency: string;
}): JournalEntry {
  const clearingAccount =
    params.sourceCurrency === 'CHF'
      ? LEDGER_ACCOUNTS.FX_CLEARING_CHF
      : LEDGER_ACCOUNTS.FX_CLEARING_EUR;

  const entry: JournalEntry = {
    journalId: params.journalId,
    transferId: params.transferId,
    idempotencyKey: params.idempotencyKey,
    lines: [
      {
        accountCode: clearingAccount,
        direction: 'debit',
        amountMinor: params.sourceAmountMinor,
        currency: params.sourceCurrency,
        description: 'Refund source',
      },
      {
        accountCode: LEDGER_ACCOUNTS.CUSTOMER_FUNDING,
        direction: 'credit',
        amountMinor: params.sourceAmountMinor,
        currency: params.sourceCurrency,
        description: 'Refund to customer funding',
      },
    ],
  };
  validateJournal(entry);
  return entry;
}
