import type { Metadata } from 'next';
import '@rupeeroute/design-system/tokens.css';
import './globals.css';
import { AuthProvider } from '../context/auth-context';

export const metadata: Metadata = {
  title: 'RupeeRoute Admin — Operations Console',
  description: 'Internal sandbox operations console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div role="status" className="sandbox-banner">
          Internal sandbox console — not for production operations
        </div>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
