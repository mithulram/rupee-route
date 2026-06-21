export const SECURE_KEYS = {
  accessToken: 'rr_access_token',
  userProfile: 'rr_user_profile',
} as const;

export const STORAGE_KEYS = {
  transferHistory: 'rr_transfer_history_cache',
  transferHistoryCachedAt: 'rr_transfer_history_cached_at',
  sendDraft: 'rr_send_draft',
  pushToken: 'rr_push_token_placeholder',
} as const;

export const SEND_DRAFT_VERSION = 1;
