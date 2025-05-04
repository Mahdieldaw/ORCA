// src/app/layout.tsx

import React from 'react';
import { Providers } from './providers';
import '@/app/globals.css';

export const metadata = {
  title: 'ORCA - Workflow Management',
  description: 'Advanced workflow management and visualization platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}