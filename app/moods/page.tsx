'use client';

import { useCallback, useState } from 'react';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { IoPlay } from 'react-icons/io5';
import { PageHeader } from '@/components/layout/PageHeader';
import { TrackRow } from '@/components/track/TrackRow';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePlayer } from '@/contexts/PlayerContext';
import { useCatalogueProvider } from '@/hooks/useCatalogue';
import { CatalogueError } from '@/lib/catalogue/provider';
import { getMoodPlanner } from '@/lib/mood/registry';
import type { MoodPlan } from '@/lib/mood/types';

const PLAN_SIZE = 12;

const SUGGESTIONS = [
  'something quiet for reading at night',
  'driving music for a long motorway run',
  'repetitive electronic for coding',
  'warm acoustic for a rainy morning'
];

export default function MoodsPage() {
  const catalogue = useCatalogueProvider();
  const planner = getMoodPlanner();
  const { playQueue } = usePlayer();

  const [prompt, setPrompt] = useState('');
  const [plan, setPlan] = useState<MoodPlan | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const build = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        return;
      }
      setIsPlanning(true);
      setError(null);
      try {
        const tracks = await catalogue.allTracks();
        setPlan(await planner.plan({ prompt: text, size: PLAN_SIZE }, tracks));
      } catch (cause) {
        setPlan(null);
        setError(
          cause instanceof CatalogueError && cause.code === 'unsupported'
            ? 'The selected catalogue cannot list every track, which is what the planner needs. Switch back to the demo catalogue to use this page.'
            : 'Could not build a mix from that description.'
        );
      } finally {
        setIsPlanning(false);
      }
    },
    [catalogue, planner]
  );

  return (
    <>
      <PageHeader
        eyebrow={`${planner.displayName}${planner.isOffline ? ' · runs offline' : ''}`}
        title="Mood mixes"
        lede="Describe what you want to hear. The planner reads your words into descriptors and tempo and energy targets, scores every track in the catalogue against them, then caps the result at two tracks per artist. Same words, same mix, every time."
      >
        <form
          className="flex max-w-2xl flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void build(prompt);
          }}
        >
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="something quiet for reading at night"
            aria-label="Describe the mood you want"
            className="h-12 flex-1 rounded-full border border-line bg-bg px-5 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <Button type="submit" className="h-12 shrink-0" disabled={isPlanning || !prompt.trim()}>
            <HiOutlineSparkles size={18} />
            {isPlanning ? 'Building…' : 'Build the mix'}
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setPrompt(suggestion);
                void build(suggestion);
              }}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-accent hover:text-fg"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="px-8 pb-10">
        {error ? (
          <EmptyState icon={HiOutlineSparkles} title="No mix" body={error} />
        ) : !plan ? (
          <EmptyState
            icon={HiOutlineSparkles}
            title="No mix yet"
            body="Describe a mood above, or pick one of the examples. Nothing leaves your machine: the planner is a scoring function over the catalogue, not a network call."
          />
        ) : (
          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{plan.title}</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted">{plan.rationale}</p>
              </div>
              <Button
                onClick={() =>
                  playQueue(
                    plan.entries.map((entry) => entry.track),
                    0
                  )
                }
                disabled={plan.entries.length === 0}
              >
                <IoPlay size={16} />
                Play all
              </Button>
            </div>

            <ol className="flex flex-col gap-0.5">
              {plan.entries.map((entry) => (
                <li key={entry.track.id}>
                  <TrackRow
                    track={entry.track}
                    note={`${entry.track.artist} · ${entry.reason}`}
                    context={plan.entries.map((item) => item.track)}
                  />
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </>
  );
}
