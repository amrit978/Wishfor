import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PersistentNav } from '@/components/PersistentNav';
import { SanctuaryPageLoader } from '@/components/SanctuaryPageLoader';

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
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  for (var r of regs) { r.unregister(); }
                });
              }
              if ('caches' in window) {
                caches.keys().then(function(names) {
                  for (var n of names) { caches.delete(n); }
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-[#e5ab37] selection:text-[#13151f] min-h-screen bg-[#13151f] text-[#f2f2f5] overflow-x-hidden">
        <SanctuaryPageLoader />
        <Header />
        {children}
        <Footer />
        <PersistentNav />
      </body>
    </html>
  );
}
