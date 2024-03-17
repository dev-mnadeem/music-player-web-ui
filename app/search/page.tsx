'use client';

import { useState } from 'react';
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { PageHeader } from '@/components/layout/PageHeader';
import { TrackCard } from '@/components/track/TrackCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonShelf } from '@/components/ui/Skeletons';
import { useAsync, useCatalogueProvider } from '@/hooks/useCatalogue';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { emptyPage } from '@/lib/catalogue/types';
import type { Track } from '@/lib/catalogue/types';
import { pluralise } from '@/lib/format';

const PAGE_SIZE = 24;
const DEBOUNCE_MS = 250;

export default function SearchPage() {
  const catalogue = useCatalogueProvider();
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);

  const results = useAsync(`search:${catalogue.id}:${limit}:${debouncedQuery.trim()}`, () =>
    debouncedQuery.trim()
      ? catalogue.search(debouncedQuery, { limit })
      : Promise.resolve(emptyPage<Track>(limit))
  );

  const page = results.data;
  const hasQuery = debouncedQuery.trim().length > 0;

  return (
    <>
      <PageHeader
        title="Search"
        lede="Matches on title, artist, album, descriptor or release year. Ranking weights an exact title match above everything else."
      >
        <div className="relative max-w-xl">
          <HiOutlineMagnifyingGlass
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            autoFocus
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder="Try: nocturnal, Kestrel Dial, Longwater, 2024"
            aria-label="Search the catalogue"
            className="h-12 w-full rounded-full border border-line bg-bg pl-11 pr-4 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </PageHeader>

      <div className="px-8 pb-10">
        {!hasQuery ? (
          <EmptyState
            icon={HiOutlineMagnifyingGlass}
            title="Start typing"
            body="Nothing is queried until you do. Descriptors like 'hypnotic' or 'acoustic' match the tags every track carries."
          />
        ) : results.isLoading && !page ? (
          <SkeletonShelf count={12} />
        ) : results.error ? (
          <EmptyState icon={HiOutlineMagnifyingGlass} title="Search failed" body={results.error} />
        ) : page && page.items.length === 0 ? (
          <EmptyState
            icon={HiOutlineMagnifyingGlass}
            title={`No match for "${debouncedQuery}"`}
            body="Try an artist name, an album, a year, or one of the descriptors such as mellow, driving or focus."
          />
        ) : page ? (
          <>
            <p className="mb-4 text-sm text-muted">
              {pluralise(page.total, 'result')} for &ldquo;{debouncedQuery}&rdquo;
            </p>
            <div className="grid grid-cols-shelf gap-4">
              {page.items.map((track) => (
                <TrackCard key={track.id} track={track} context={page.items} />
              ))}
            </div>
            {page.hasMore ? (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={() => setLimit((current) => current + PAGE_SIZE)}>
                  Show more
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}
