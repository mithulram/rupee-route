export type RecipientType = 'bank_account' | 'upi';

export interface BankRecipientInput {
  type: 'bank_account';
  displayName: string;
  accountHolder: string;
  ifsc: string;
  accountNumber: string;
}

export interface UpiRecipientInput {
  type: 'upi';
  displayName: string;
  accountHolder: string;
  upiId: string;
}

export type RecipientInput = BankRecipientInput | UpiRecipientInput;

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const UPI_PATTERN = /^[\w.-]{2,}@[\w.-]{2,}$/i;
const ACCOUNT_NUMBER_PATTERN = /^\d{9,18}$/;

export function validateRecipientInput(input: RecipientInput): void {
  if (!input.displayName.trim() || !input.accountHolder.trim()) {
    throw new Error('Display name and account holder are required');
  }

  if (input.type === 'bank_account') {
    if (!IFSC_PATTERN.test(input.ifsc.toUpperCase())) {
      throw new Error('Invalid IFSC code');
    }
    if (!ACCOUNT_NUMBER_PATTERN.test(input.accountNumber)) {
      throw new Error('Invalid account number');
    }
    return;
  }

  if (!UPI_PATTERN.test(input.upiId)) {
    throw new Error('Invalid UPI ID');
  }
}

export function normalizeIfsc(ifsc: string): string {
  return ifsc.toUpperCase();
}
