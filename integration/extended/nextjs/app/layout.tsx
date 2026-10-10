import type { ReactNode } from 'react';

// Next.js 16.4+ no longer synthesizes a root layout during `next build`, so the
// fixture ships the minimal one the App Router requires.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
