import { moodPlannerId } from '@/lib/config';
import { LocalMoodPlanner } from './local-planner';
import type { MoodPlanner } from './types';

const PLANNERS: Record<string, () => MoodPlanner> = {
  local: () => new LocalMoodPlanner()
};

/**
 * Returns the configured planner, falling back to the local one.
 *
 * Only `local` is registered today. Adding a hosted model means adding one
 * entry here and one class implementing `MoodPlanner` — nothing in `app/`
 * or `components/` knows the difference.
 */
export function getMoodPlanner(id: string = moodPlannerId): MoodPlanner {
  return (PLANNERS[id] ?? PLANNERS.local)();
}

export function registeredPlannerIds(): string[] {
  return Object.keys(PLANNERS);
}
