/**
 * Drives scheduled/recurring uploads. A `chrome.alarms` tick periodically
 * checks for scheduled tasks whose time has arrived and moves them into the
 * live upload queue; completed recurring tasks spawn their next occurrence.
 */

import { uploadRepository } from '@shared/db/repositories/uploadRepository';
import { logRepository } from '@shared/db/repositories/logRepository';
import { computeNextOccurrence } from '@shared/utils/dateUtils';
import { generateId } from '@shared/utils/id';
import type { UploadTask } from '@shared/types/index';
import { uploadQueue } from '@background/uploadEngine/UploadQueue';
import { notifyScheduleReminder } from '@background/notifications/NotificationService';

export const schedulerService = {
  /** Promotes any due scheduled tasks to the live queue and kicks the queue. */
  async processDueTasks(): Promise<void> {
    const due = (await uploadRepository.dueScheduledTasks(Date.now())).filter((t) => !t.isDemo);
    for (const task of due) {
      await uploadRepository.update(task.id, { status: 'queued' });
      await notifyScheduleReminder(task);
      await logRepository.append({
        level: 'info',
        platform: task.platform,
        taskId: task.id,
        message: `Scheduled time reached — "${task.metadata.title}" moved to the upload queue.`,
      });
    }
    if (due.length > 0) void uploadQueue.tick();
  },

  /** Called after a recurring task completes to enqueue its next scheduled occurrence. */
  async spawnNextOccurrenceIfNeeded(completedTask: UploadTask): Promise<void> {
    if (!completedTask.recurrence || completedTask.recurrence.frequency === 'none') return;
    const base = completedTask.scheduledFor ?? completedTask.completedAt ?? Date.now();
    const next = computeNextOccurrence(base, completedTask.recurrence);
    if (!next) return;

    const clone: UploadTask = {
      ...completedTask,
      id: generateId('task'),
      status: 'scheduled',
      scheduledFor: next,
      progress: 0,
      bytesUploaded: 0,
      attempt: 0,
      error: undefined,
      resumableSessionUrl: undefined,
      platformContentId: undefined,
      platformContentUrl: undefined,
      completedAt: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await uploadRepository.add(clone);
  },
};
