export interface ReconciliationLedgerEntry {
  transferId: string;
  amountMinor: bigint;
  currency: string;
  entryType: string;
}

export interface ReconciliationProviderEntry {
  transferId: string;
  amountMinor: bigint;
  currency: string;
  settlementStatus: string;
}

export type ReconciliationMismatchType =
  | 'amount_delta'
  | 'missing_ledger'
  | 'missing_provider'
  | 'currency_mismatch';

export interface ReconciliationMismatch {
  transferId: string;
  type: ReconciliationMismatchType;
  ledgerAmountMinor?: bigint;
  providerAmountMinor?: bigint;
  amountDeltaMinor?: bigint;
  currency?: string;
}

export function detectReconciliationMismatches(
  ledgerEntries: ReconciliationLedgerEntry[],
  providerEntries: ReconciliationProviderEntry[],
): ReconciliationMismatch[] {
  const mismatches: ReconciliationMismatch[] = [];
  const ledgerByTransfer = groupByTransferId(ledgerEntries);
  const providerByTransfer = groupByTransferId(providerEntries);
  const transferIds = new Set([...ledgerByTransfer.keys(), ...providerByTransfer.keys()]);

  for (const transferId of transferIds) {
    const ledger = ledgerByTransfer.get(transferId);
    const provider = providerByTransfer.get(transferId);

    if (!ledger) {
      mismatches.push({
        transferId,
        type: 'missing_ledger',
        providerAmountMinor: provider?.amountMinor,
        currency: provider?.currency,
      });
      continue;
    }

    if (!provider) {
      mismatches.push({
        transferId,
        type: 'missing_provider',
        ledgerAmountMinor: ledger.amountMinor,
        currency: ledger.currency,
      });
      continue;
    }

    if (ledger.currency !== provider.currency) {
      mismatches.push({
        transferId,
        type: 'currency_mismatch',
        ledgerAmountMinor: ledger.amountMinor,
        providerAmountMinor: provider.amountMinor,
        currency: ledger.currency,
      });
      continue;
    }

    if (ledger.amountMinor !== provider.amountMinor) {
      const delta =
        ledger.amountMinor > provider.amountMinor
          ? ledger.amountMinor - provider.amountMinor
          : provider.amountMinor - ledger.amountMinor;

      mismatches.push({
        transferId,
        type: 'amount_delta',
        ledgerAmountMinor: ledger.amountMinor,
        providerAmountMinor: provider.amountMinor,
        amountDeltaMinor: delta,
        currency: ledger.currency,
      });
    }
  }

  return mismatches;
}

function groupByTransferId<T extends { transferId: string }>(entries: T[]): Map<string, T> {
  const grouped = new Map<string, T>();

  for (const entry of entries) {
    grouped.set(entry.transferId, entry);
  }

  return grouped;
}
