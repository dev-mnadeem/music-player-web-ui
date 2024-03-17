export function TrackCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-surface p-3">
      <div className="mb-3 aspect-square w-full rounded-lg bg-raised" />
      <div className="mb-2 h-3 w-3/4 rounded bg-raised" />
      <div className="h-3 w-1/2 rounded bg-raised" />
    </div>
  );
}

export function TrackRowSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-lg p-2">
      <div className="h-11 w-11 shrink-0 rounded bg-raised" />
      <div className="min-w-0 flex-1">
        <div className="mb-2 h-3 w-2/3 rounded bg-raised" />
        <div className="h-3 w-1/3 rounded bg-raised" />
      </div>
    </div>
  );
}

export function SkeletonShelf({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-shelf gap-4">
      {Array.from({ length: count }, (_, index) => (
        <TrackCardSkeleton key={`card-skeleton-${index}`} />
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: count }, (_, index) => (
        <TrackRowSkeleton key={`row-skeleton-${index}`} />
      ))}
    </div>
  );
}
