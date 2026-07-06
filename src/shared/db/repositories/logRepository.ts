/** Data-access layer for the Activity Log, plus the logger sink that feeds it. */

import { db } from '@shared/db/db';
import type { ActivityLogEntry } from '@shared/types/index';
import { generateId } from '@shared/utils/id';
import { addLogSink } from '@shared/utils/logger';

const MAX_LOG_ENTRIES = 2000;

export const logRepository = {
  async append(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): Promise<ActivityLogEntry> {
    const full: ActivityLogEntry = { ...entry, id: generateId('log'), timestamp: Date.now() };
    await db.logs.put(full);
    const count = await db.logs.count();
    if (count > MAX_LOG_ENTRIES) {
      const excess = count - MAX_LOG_ENTRIES;
      const oldest = await db.logs.orderBy('timestamp').limit(excess).primaryKeys();
      await db.logs.bulkDelete(oldest);
    }
    return full;
  },

  async recent(limit = 200): Promise<ActivityLogEntry[]> {
    return db.logs.orderBy('timestamp').reverse().limit(limit).toArray();
  },

  async clear(): Promise<void> {
    await db.logs.clear();
  },
};

let sinkRegistered = false;

/** Wires the shared `logger` utility to also persist warn/error entries to IndexedDB. */
export function registerActivityLogSink(): void {
  if (sinkRegistered) return;
  sinkRegistered = true;
  addLogSink((level, message) => {
    if (level === 'debug') return;
    const mappedLevel = level === 'warn' ? 'warning' : level === 'error' ? 'error' : 'info';
    void logRepository.append({ level: mappedLevel, message });
  });
}
