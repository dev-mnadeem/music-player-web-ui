import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import { PlayerBar } from '@/components/player/PlayerBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { LibraryProvider } from '@/contexts/LibraryContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { APP_NAME, APP_TAGLINE } from '@/lib/config';
import './globals.css';

const font = Figtree({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_TAGLINE
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${font.className} h-full`}>
        <LibraryProvider>
          <PlayerProvider>
            <div className="flex h-full flex-col">
              <div className="flex min-h-0 flex-1">
                <Sidebar />
                <main className="min-w-0 flex-1 overflow-y-auto p-2">
                  <div className="min-h-full rounded-xl bg-surface">{children}</div>
                </main>
              </div>
              <PlayerBar />
            </div>
          </PlayerProvider>
        </LibraryProvider>
      </body>
    </html>
  );
}
