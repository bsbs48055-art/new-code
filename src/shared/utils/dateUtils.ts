/**
 * Date/time helpers for the scheduler. Uses the native `Intl` and `Date`
 * APIs exclusively so we avoid pulling in a heavy date library just for
 * timezone-aware formatting and recurrence math.
 */

import type { RecurrenceRule } from '@shared/types/index';

/** Returns the IANA timezone name of the current environment (e.g. "America/New_York"). */
export function getLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Formats a timestamp for display, honoring the given (or local) IANA timezone. */
export function formatInTimeZone(timestamp: number, timeZone: string = getLocalTimeZone()): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(timestamp));
}

/** Converts a `datetime-local` input value + IANA timezone into a UTC epoch millisecond timestamp. */
export function zonedLocalInputToEpoch(localValue: string, timeZone: string): number {
  // `datetime-local` gives us "YYYY-MM-DDTHH:mm" with no timezone info. We
  // interpret those wall-clock digits as being in `timeZone` by computing the
  // offset that timezone had at that wall-clock moment and applying it.
  const naive = new Date(`${localValue}:00Z`).getTime();
  const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, naive);
  return naive - offsetMinutes * 60_000;
}

/** Computes the UTC offset (in minutes) of `timeZone` at a given instant. */
function getTimeZoneOffsetMinutes(timeZone: string, atUtcMillis: number): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(new Date(atUtcMillis));
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return (asUtc - atUtcMillis) / 60_000;
}

/** Computes the next occurrence timestamp for a recurrence rule, or null if it has ended. */
export function computeNextOccurrence(fromTimestamp: number, rule: RecurrenceRule): number | null {
  if (rule.frequency === 'none') return null;
  const next = new Date(fromTimestamp);
  switch (rule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + rule.interval);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7 * rule.interval);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + rule.interval);
      break;
  }
  const nextMs = next.getTime();
  if (rule.endDate && nextMs > rule.endDate) return null;
  return nextMs;
}

/** Human-friendly "time remaining" string, used for upload ETA display. */
export function formatDurationShort(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = Math.round(seconds % 60);
  if (minutes < 60) return `${minutes}m ${remSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}
