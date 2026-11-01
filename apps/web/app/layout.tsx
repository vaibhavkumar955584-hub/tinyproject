import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { Providers } from '../components/providers';
import { ThemeProvider } from '../components/theme';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://tenderguard.ai'),
  title: 'TenderGuard AI — Know Which Tenders Will Reject You Before Paying EMD',
  description: 'Evidence-backed procurement decision support for Indian MSMEs across CPPP and GeM portals.',
  icons: {
    icon: '/brand/tenderguard-mark.png',
    apple: '/brand/tenderguard-mark.png',
  },
  openGraph: {
    title: 'TenderGuard AI — Know Which Tenders Will Reject You',
    description: 'Evidence-backed procurement decision support for Indian MSMEs across CPPP and GeM.',
    url: 'https://tenderguard.ai',
    siteName: 'TenderGuard AI',
    images: [{ url: '/brand/tenderguard-wordmark.png', width: 1200, height: 630 }],
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
