/**
 * Wraps the Chrome Notifications API to surface desktop notifications for
 * upload completion, failure, and schedule reminders — gated by the user's
 * notification preferences in Settings.
 */

import type { PlatformUploadResult } from '@background/platforms/PlatformAdapter';
import { settingsRepository } from '@shared/db/settingsRepository';
import { PLATFORM_LABELS, type UploadTask } from '@shared/types/index';

let notificationCounter = 0;

function createNotification(options: chrome.notifications.NotificationOptions<true>): void {
  const id = `sms-pro-${Date.now()}-${notificationCounter++}`;
  chrome.notifications.create(id, options);
}

export async function notifyUploadComplete(task: UploadTask, result: PlatformUploadResult): Promise<void> {
  const settings = await settingsRepository.get();
  if (!settings.notifications.uploadComplete) return;
  createNotification({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title: `Upload complete — ${PLATFORM_LABELS[task.platform]}`,
    message: `"${task.metadata.title}" was published successfully.${result.platformContentUrl ? '' : ''}`,
    priority: 1,
  });
}

export async function notifyUploadFailed(task: UploadTask, errorMessage: string): Promise<void> {
  const settings = await settingsRepository.get();
  if (!settings.notifications.uploadFailed) return;
  createNotification({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title: `Upload failed — ${PLATFORM_LABELS[task.platform]}`,
    message: `"${task.metadata.title}" failed: ${errorMessage}`.slice(0, 200),
    priority: 2,
  });
}

export async function notifyScheduleReminder(task: UploadTask): Promise<void> {
  const settings = await settingsRepository.get();
  if (!settings.notifications.scheduleReminder) return;
  createNotification({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title: `Scheduled upload starting — ${PLATFORM_LABELS[task.platform]}`,
    message: `"${task.metadata.title}" is now being uploaded as scheduled.`,
    priority: 1,
  });
}
