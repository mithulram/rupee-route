import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEND_DRAFT_VERSION, STORAGE_KEYS } from '../lib/constants';

export type SendDraftStep = 'amount' | 'quote' | 'recipient' | 'review';

export type SendDraft = {
  version: number;
  step: SendDraftStep;
  sourceCurrency: 'EUR' | 'CHF';
  sourceAmountMinor: string;
  couponCode?: string;
  quoteId?: string;
  transferId?: string;
  recipientId?: string;
  updatedAt: string;
};

export async function loadSendDraft(): Promise<SendDraft | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.sendDraft);
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as SendDraft;
    if (draft.version !== SEND_DRAFT_VERSION) return null;
    return draft;
  } catch {
    return null;
  }
}

export async function saveSendDraft(
  draft: Omit<SendDraft, 'version' | 'updatedAt'>,
): Promise<void> {
  const payload: SendDraft = {
    ...draft,
    version: SEND_DRAFT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEYS.sendDraft, JSON.stringify(payload));
}

export async function clearSendDraft(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.sendDraft);
}

export function getSendResumePath(draft: SendDraft): string {
  switch (draft.step) {
    case 'amount':
      return '/send/amount';
    case 'quote':
      return '/send/quote';
    case 'recipient':
      return '/send/recipient';
    case 'review':
      return '/send/review';
    default:
      return '/send/amount';
  }
}
