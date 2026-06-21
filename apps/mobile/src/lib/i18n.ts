export type Locale = 'en' | 'de';

const messages = {
  en: {
    homeTitle: 'Hello',
    sendMoney: 'Send money',
    activity: 'Activity',
    recipients: 'Recipients',
    help: 'Help',
    settings: 'Settings',
    coupons: 'Coupons',
    sandboxBanner: 'Sandbox mode — no real money moves.',
    resumeTransfer: 'Resume your transfer',
    continueSend: 'Continue send',
    recentActivity: 'Recent activity',
    noTransfers: 'No transfers yet. Start your first sandbox send.',
    viewAllActivity: 'View all activity',
    couponTitle: 'Coupons & promotions',
    couponEmpty: 'No active coupons in sandbox.',
    couponHint: 'Promotional codes appear here when available.',
    language: 'Language',
    biometrics: 'Biometric unlock',
    signOut: 'Sign out',
    offline: 'You are offline. Some actions are unavailable.',
  },
  de: {
    homeTitle: 'Hallo',
    sendMoney: 'Geld senden',
    activity: 'Aktivität',
    recipients: 'Empfänger',
    help: 'Hilfe',
    settings: 'Einstellungen',
    coupons: 'Gutscheine',
    sandboxBanner: 'Sandbox-Modus — kein echtes Geld.',
    resumeTransfer: 'Überweisung fortsetzen',
    continueSend: 'Senden fortsetzen',
    recentActivity: 'Letzte Aktivität',
    noTransfers: 'Noch keine Überweisungen. Starten Sie Ihre erste Sandbox-Überweisung.',
    viewAllActivity: 'Alle Aktivitäten anzeigen',
    couponTitle: 'Gutscheine & Aktionen',
    couponEmpty: 'Keine aktiven Gutscheine in der Sandbox.',
    couponHint: 'Aktionscodes erscheinen hier, sobald sie verfügbar sind.',
    language: 'Sprache',
    biometrics: 'Biometrie entsperren',
    signOut: 'Abmelden',
    offline: 'Sie sind offline. Einige Aktionen sind nicht verfügbar.',
  },
} as const;

export type MessageKey = keyof (typeof messages)['en'];

let currentLocale: Locale = 'en';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: MessageKey): string {
  return messages[currentLocale][key] ?? messages.en[key];
}
