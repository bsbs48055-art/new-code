/** Data-access layer for analytics snapshots pulled from platform APIs. */

import { db } from '@shared/db/db';
import type { AnalyticsSnapshot, PlatformId } from '@shared/types/index';

export const analyticsRepository = {
  async upsertMany(snapshots: AnalyticsSnapshot[]): Promise<void> {
    await db.analytics.bulkPut(snapshots);
  },

  async byPlatform(platform: PlatformId): Promise<AnalyticsSnapshot[]> {
    return db.analytics.where('platform').equals(platform).sortBy('capturedAt');
  },

  async all(): Promise<AnalyticsSnapshot[]> {
    return db.analytics.orderBy('capturedAt').toArray();
  },
};
