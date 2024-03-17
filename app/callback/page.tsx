'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HiOutlineLockClosed } from 'react-icons/hi2';
import { EmptyState } from '@/components/ui/EmptyState';
import { exchangeCodeForTokens } from '@/lib/catalogue/spotify/client';
import { readCodeVerifier } from '@/lib/catalogue/spotify/tokens';

/**
 * The Spotify OAuth landing page.
 *
 * Only reachable when the Spotify adapter is selected and a real application
 * has been registered with this URL as its redirect. With the demo catalogue —
 * the default — nothing ever navigates here.
 */
function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handled = useRef(false);
  const code = searchParams.get('code');
  const providerError = searchParams.get('error');

  // What went wrong with the redirect itself is knowable during render, so it
  // is derived here rather than pushed into state from an effect.
  const upfrontProblem = providerError
    ? `Spotify refused the sign-in: ${providerError}`
    : !code
      ? 'This page was opened without an authorisation code, so there is nothing to exchange.'
      : null;

  const [exchangeError, setExchangeError] = useState<string | null>(null);

  useEffect(() => {
    if (handled.current || upfrontProblem || !code) {
      return;
    }
    handled.current = true;

    // localStorage cannot be read during render without risking a hydration
    // mismatch, so this check has to live in the effect.
    const verifier = readCodeVerifier();
    if (!verifier) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExchangeError('No PKCE verifier is stored in this browser, so the code cannot be redeemed.');
      return;
    }

    exchangeCodeForTokens(code, verifier)
      .then(() => router.replace('/'))
      .catch((cause: unknown) => {
        setExchangeError(cause instanceof Error ? cause.message : 'The token exchange failed.');
      });
  }, [code, router, upfrontProblem]);

  const failure = upfrontProblem ?? exchangeError;
  const status = failure ? 'failed' : 'working';
  const detail = failure ?? 'Exchanging the authorisation code for a token…';

  return (
    <div className="px-8 py-16">
      <EmptyState
        icon={HiOutlineLockClosed}
        title={status === 'working' ? 'Signing you in' : 'Sign-in did not complete'}
        body={detail}
      />
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="px-8 py-16 text-sm text-muted">Loading…</div>}>
      <CallbackHandler />
    </Suspense>
  );
}
