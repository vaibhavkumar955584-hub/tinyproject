import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TenderGuard AI',
  description: 'Evidence-backed procurement decision support for Indian MSMEs.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
