'use client';

import { useEffect } from 'react';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-8 py-20">
      <EmptyState
        icon={HiOutlineExclamationTriangle}
        title="This page could not render"
        body={error.message || 'An unexpected error occurred.'}
        action={<Button onClick={reset}>Try again</Button>}
      />
    </div>
  );
}
