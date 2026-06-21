import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as Linking from 'expo-linking';

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe('useDeepLink routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses transfer deep links', () => {
    vi.mocked(Linking.parse).mockReturnValue({
      hostname: 'transfer',
      path: 'abc123',
      queryParams: {},
      scheme: 'rupeeroute',
    } as ReturnType<typeof Linking.parse>);

    const parsed = Linking.parse('rupeeroute://transfer/abc123');
    expect(parsed.path).toBe('abc123');
    expect(parsed.hostname).toBe('transfer');
  });

  it('parses send resume links', () => {
    vi.mocked(Linking.parse).mockReturnValue({
      hostname: 'send',
      path: 'review',
      queryParams: {},
      scheme: 'rupeeroute',
    } as ReturnType<typeof Linking.parse>);

    const parsed = Linking.parse('rupeeroute://send/review');
    expect(parsed.hostname).toBe('send');
    expect(parsed.path).toBe('review');
  });
});
