import { describe, expect, it } from 'vitest';
import { getLocale, setLocale, t } from './i18n';

describe('i18n', () => {
  it('defaults to English', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(t('sendMoney')).toBe('Send money');
  });

  it('switches to German', () => {
    setLocale('de');
    expect(t('sendMoney')).toBe('Geld senden');
    expect(t('coupons')).toBe('Gutscheine');
  });
});
