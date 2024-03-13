const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

/** `214000` -> `"3:34"`. Negative and non-finite input render as `"0:00"`. */
export function formatDuration(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return '0:00';
  }
  const totalSeconds = Math.floor(milliseconds / MS_PER_SECOND);
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Percentage of a track elapsed, clamped to 0-100 for direct use in CSS. */
export function progressPercent(positionMs: number, durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (positionMs / durationMs) * 100));
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
