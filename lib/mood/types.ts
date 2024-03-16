import type { Track } from '@/lib/catalogue/types';

export interface MoodRequest {
  /** Free text from the user, e.g. "something quiet for reading at night". */
  prompt: string;
  /** How many tracks the caller wants back. */
  size: number;
}

export interface MoodPlanEntry {
  track: Track;
  /** Why this track is in the list, in one phrase. */
  reason: string;
  score: number;
}

export interface MoodPlan {
  title: string;
  /** One sentence explaining how the prompt was read. */
  rationale: string;
  entries: MoodPlanEntry[];
  /** Which planner produced this, so the UI can be honest about it. */
  plannerId: string;
}

/**
 * The seam for mood planning.
 *
 * One implementation ships: a deterministic local planner. A hosted language
 * model would be a second implementation of exactly this interface — the app
 * only ever sees `plan()`, so no UI code changes when one is added.
 */
export interface MoodPlanner {
  readonly id: string;
  readonly displayName: string;
  /** True when the planner works with no network and no API key. */
  readonly isOffline: boolean;
  plan(request: MoodRequest, tracks: readonly Track[]): Promise<MoodPlan>;
}
