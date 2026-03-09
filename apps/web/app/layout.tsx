import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';

import './globals.css';
import { QueryProvider } from '@/lib/providers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'PolyPlot — The Forecasting Arena',
    template: '%s — PolyPlot',
  },
  description:
    'Where forecasters compete to discover signals about the future. Track your Edge Score, analyze your performance, and climb the leaderboard.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://polyplot.io'),
  openGraph: {
    type: 'website',
    siteName: 'PolyPlot',
    title: 'PolyPlot — The Forecasting Arena',
    description: 'Where forecasters compete to discover signals about the future.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PolyPlot — The Forecasting Arena',
    description: 'Where forecasters compete to discover signals about the future.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} bg-background text-foreground font-sans antialiased`}>
        <QueryProvider>
          {children}
          <Toaster theme="dark" richColors />
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
