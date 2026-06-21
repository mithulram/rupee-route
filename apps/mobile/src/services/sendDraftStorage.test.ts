import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSendDraft,
  getSendResumePath,
  loadSendDraft,
  saveSendDraft,
} from './sendDraftStorage';

describe('sendDraftStorage', () => {
  beforeEach(() => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
    vi.mocked(AsyncStorage.removeItem).mockResolvedValue(undefined);
  });

  it('persists and reloads draft after restart', async () => {
    await saveSendDraft({
      step: 'review',
      sourceCurrency: 'EUR',
      sourceAmountMinor: '10000',
      quoteId: 'q_1',
      transferId: 'tr_1',
    });

    const saved = vi.mocked(AsyncStorage.setItem).mock.calls[0]?.[1];
    expect(saved).toBeTruthy();
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(saved as string);

    const draft = await loadSendDraft();
    expect(draft?.step).toBe('review');
    if (draft) {
      expect(getSendResumePath(draft)).toBe('/send/review');
    }
  });

  it('clears draft on discard', async () => {
    await clearSendDraft();
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });
});
