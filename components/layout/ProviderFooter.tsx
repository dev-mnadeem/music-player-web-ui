'use client';

import { useCatalogueProvider } from '@/hooks/useCatalogue';
import { useSpotifySession } from '@/hooks/useSpotifySession';
import { logout, startSpotifyLogin } from '@/lib/catalogue/spotify/login';
import { Button } from '../ui/Button';

/**
 * Names the catalogue in use, and offers sign-in only when the provider
 * actually has an account behind it. The demo catalogue has no concept of a
 * user, so it gets no login button to click on and be disappointed by.
 */
export function ProviderFooter() {
  const catalogue = useCatalogueProvider();
  const hasSession = useSpotifySession();

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1">
      <p className="text-2xs uppercase tracking-wider text-muted">Source: {catalogue.displayName}</p>
      {catalogue.id === 'spotify' ? (
        <Button
          size="sm"
          variant={hasSession ? 'ghost' : 'primary'}
          onClick={() => (hasSession ? logout() : void startSpotifyLogin())}
        >
          {hasSession ? 'Sign out' : 'Sign in'}
        </Button>
      ) : null}
    </div>
  );
}
