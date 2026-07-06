/** Registers the recurring `chrome.alarms` that keep the queue and scheduler moving. */

import { ALARM_QUEUE_TICK, QUEUE_TICK_PERIOD_MINUTES } from '@shared/constants';
import { uploadQueue } from '@background/uploadEngine/UploadQueue';
import { schedulerService } from '@background/scheduler/SchedulerService';
import { cleanupOrphanBlobs } from '@background/uploadEngine/blobCleanup';
import { logger } from '@shared/utils/logger';

let ticksSinceCleanup = 0;
const CLEANUP_EVERY_N_TICKS = 60; // Roughly once per hour given a 1-minute tick period.

export function setupAlarms(): void {
  chrome.alarms.create(ALARM_QUEUE_TICK, { periodInMinutes: QUEUE_TICK_PERIOD_MINUTES });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ALARM_QUEUE_TICK) return;
    void schedulerService.processDueTasks().catch((error) => logger.error('Scheduler tick failed', { error: String(error) }));
    void uploadQueue.tick().catch((error) => logger.error('Queue tick failed', { error: String(error) }));

    ticksSinceCleanup += 1;
    if (ticksSinceCleanup >= CLEANUP_EVERY_N_TICKS) {
      ticksSinceCleanup = 0;
      void cleanupOrphanBlobs().catch((error) => logger.error('Blob cleanup failed', { error: String(error) }));
    }
  });
}
