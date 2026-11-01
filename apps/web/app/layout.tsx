import type { Metadata } from 'next';
import { Providers } from '../components/providers';
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
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
