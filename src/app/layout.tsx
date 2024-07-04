'use client'
import { ThemeProvider } from '@emotion/react';
import { Roboto } from 'next/font/google';
import type { ReactNode } from 'react';
import theme from './theme';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={roboto.className}>
      <body style={{
        margin: 100,
        fontFamily: 'Roboto, sans-serif',
        backgroundColor: theme.palette.background.default,
        color: "#fff"
      }}>
        <ThemeProvider theme={theme}>

          {children}

        </ThemeProvider>

      </body>
    </html>
  );
}