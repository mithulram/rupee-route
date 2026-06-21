import { useCallback, useEffect, useState } from 'react';
import {
  clearSendDraft,
  getSendResumePath,
  loadSendDraft,
  saveSendDraft,
  type SendDraft,
  type SendDraftStep,
} from '../services/sendDraftStorage';

export function useSendDraft() {
  const [draft, setDraft] = useState<SendDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const stored = await loadSendDraft();
      setDraft(stored);
      setIsLoading(false);
    })();
  }, []);

  const persist = useCallback(async (partial: Omit<SendDraft, 'version' | 'updatedAt'>) => {
    await saveSendDraft(partial);
    const stored = await loadSendDraft();
    setDraft(stored);
  }, []);

  const reset = useCallback(async () => {
    await clearSendDraft();
    setDraft(null);
  }, []);

  const resumePath = draft ? getSendResumePath(draft) : null;

  return {
    draft,
    isLoading,
    persist,
    reset,
    resumePath,
    setStep: (step: SendDraftStep) => {
      if (!draft) return;
      void persist({ ...draft, step });
    },
  };
}
