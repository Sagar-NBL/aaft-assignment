import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/providers/Providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'AAFT Mini LMS',
  description: 'Premium learning management for creative education',
  manifest: '/manifest.json',
  icons: {
    icon: '/aaft-logo.png',
  },
  openGraph: {
    title: 'AAFT Mini LMS',
    description: 'Premium learning management system designed for the next generation of creative educators and students',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: 'AAFT Mini LMS',
    images: [
      {
        url: '/aaft-logo.png',
        width: 120,
        height: 30,
        alt: 'AAFT Mini LMS Logo',
      },
    ],
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
