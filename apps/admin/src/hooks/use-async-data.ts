'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../lib/api';

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  reload: () => void;
}

export function useAsyncData<T>(loader: () => Promise<T>, depKey = ''): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => {
    setTick((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void loader()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Something went wrong.');
          }
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loader, tick, depKey]);

  return { data, error, isLoading, reload };
}
