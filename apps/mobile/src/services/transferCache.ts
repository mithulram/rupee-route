import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TransferSummary } from '@rupeeroute/api-contracts';
import { STORAGE_KEYS } from '../lib/constants';

export type TransferHistoryCache = {
  transfers: TransferSummary[];
  cachedAt: string;
};

export async function readTransferHistoryCache(): Promise<TransferHistoryCache | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.transferHistory);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TransferHistoryCache;
  } catch {
    return null;
  }
}

export async function writeTransferHistoryCache(transfers: TransferSummary[]): Promise<void> {
  const payload: TransferHistoryCache = {
    transfers,
    cachedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEYS.transferHistory, JSON.stringify(payload));
}

export async function clearTransferHistoryCache(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.transferHistory,
    STORAGE_KEYS.transferHistoryCachedAt,
  ]);
}
