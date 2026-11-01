import type { Metadata } from 'next';
import { Providers } from '../components/providers';
import { ThemeProvider } from '../components/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'TenderGuard AI',
  description: 'Evidence-backed procurement decision support for Indian MSMEs.',
  icons: {
    icon: '/brand/tenderguard-mark.png',
    apple: '/brand/tenderguard-mark.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
