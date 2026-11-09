import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { PersistentNav } from '@/components/PersistentNav';

export const metadata: Metadata = {
  title: 'WishFor — Anonymous Peer Community',
  description:
    'An anonymous peer community where people share whatever weighs on them and kind strangers reply under rotating masks. Zero identity exposure.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#13151f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-[#e5ab37] selection:text-[#13151f] min-h-screen bg-[#13151f] text-[#f2f2f5] overflow-x-hidden">
        <Header />
        {children}
        <PersistentNav />
      </body>
    </html>
  );
}
