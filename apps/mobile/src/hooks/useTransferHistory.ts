import { useCallback, useEffect, useState } from 'react';
import { customerApi, type TransferSummary } from '@rupeeroute/api-contracts';
import { readTransferHistoryCache, writeTransferHistoryCache } from '../services/transferCache';

export function useTransferHistory() {
  const [transfers, setTransfers] = useState<TransferSummary[]>([]);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fresh = await customerApi.listTransfers();
      setTransfers(fresh);
      setIsOffline(false);
      await writeTransferHistoryCache(fresh);
      setCachedAt(new Date().toISOString());
    } catch {
      const cache = await readTransferHistoryCache();
      if (cache) {
        setTransfers(cache.transfers);
        setCachedAt(cache.cachedAt);
        setIsOffline(true);
      } else {
        setError('Unable to load transfers. Connect to the sandbox API.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { transfers, cachedAt, isOffline, isLoading, error, refresh: load };
}
