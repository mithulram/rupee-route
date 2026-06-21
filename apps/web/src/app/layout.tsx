import type { Metadata } from 'next';
import '@rupeeroute/design-system/tokens.css';
import './globals.css';
import { Providers } from '../components/Providers';
import { SandboxBanner } from '../components/SandboxBanner';
import { HtmlLang } from '../components/HtmlLang';

export const metadata: Metadata = {
  title: 'RupeeRoute — Sandbox Remittance',
  description: 'Send EUR/CHF to INR recipients in India (sandbox demo)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <HtmlLang />
          <SandboxBanner />
          <main id="main-content">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
