/**
 * Background service worker entry point. Wires together the upload queue,
 * scheduler, notifications, platform adapters, and the message bus that the
 * dashboard UI (popup/side panel/options) talks to. Manifest V3 service
 * workers are ephemeral — they can be suspended and restarted by Chrome at
 * any time — so all durable state lives in IndexedDB/chrome.storage rather
 * than in memory here.
 */

import { MESSAGE_TYPES } from '@shared/constants';
import { onBackgroundMessage } from '@shared/messaging';
import { logger } from '@shared/utils/logger';
import { registerActivityLogSink } from '@shared/db/repositories/logRepository';
import { uploadRepository } from '@shared/db/repositories/uploadRepository';
import { uploadQueue } from '@background/uploadEngine/UploadQueue';
import { buildAndEnqueueTasks, type EnqueueTaskInput } from '@background/uploadEngine/taskFactory';
import { schedulerService } from '@background/scheduler/SchedulerService';
import { setupAlarms } from '@background/scheduler/alarms';
import { getPlatformAdapter, platformAdapters } from '@background/platforms/registry';
import type { PlatformId } from '@shared/types/index';

registerActivityLogSink();
setupAlarms();

uploadQueue.onTaskCompleted((task) => {
  void schedulerService.spawnNextOccurrenceIfNeeded(task);
});

chrome.runtime.onInstalled.addListener(() => {
  logger.info('Social Media Studio Pro installed/updated.');
  chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true }).catch(() => undefined);
});

chrome.runtime.onStartup.addListener(() => {
  void schedulerService.processDueTasks();
  void uploadQueue.tick();
});

// Kick the queue once on every service worker (re)start too, since
// `onStartup` only fires on browser launch, not on worker resurrection.
void schedulerService.processDueTasks();
void uploadQueue.tick();

onBackgroundMessage<EnqueueTaskInput[]>(MESSAGE_TYPES.ENQUEUE_TASKS, async (inputs) => {
  const result = await buildAndEnqueueTasks(inputs);
  void uploadQueue.tick();
  return result;
});

onBackgroundMessage<{ taskId: string }>(MESSAGE_TYPES.PAUSE_TASK, async ({ taskId }) => {
  await uploadQueue.pause(taskId);
  return { ok: true };
});

onBackgroundMessage<{ taskId: string }>(MESSAGE_TYPES.RESUME_TASK, async ({ taskId }) => {
  await uploadQueue.resume(taskId);
  return { ok: true };
});

onBackgroundMessage<{ taskId: string }>(MESSAGE_TYPES.CANCEL_TASK, async ({ taskId }) => {
  await uploadQueue.cancel(taskId);
  return { ok: true };
});

onBackgroundMessage<{ taskId: string }>(MESSAGE_TYPES.RETRY_TASK, async ({ taskId }) => {
  await uploadQueue.retry(taskId);
  return { ok: true };
});

onBackgroundMessage<{ taskId: string; priority: number }>(MESSAGE_TYPES.REORDER_TASK, async ({ taskId, priority }) => {
  await uploadQueue.reorder(taskId, priority);
  return { ok: true };
});

onBackgroundMessage<{ platform: PlatformId }>(MESSAGE_TYPES.CONNECT_PLATFORM, async ({ platform }) => {
  try {
    const state = await getPlatformAdapter(platform).connect();
    return { ok: true, state };
  } catch (error) {
    logger.error(`Failed to connect ${platform}`, { error: String(error) });
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});

onBackgroundMessage<{ platform: PlatformId }>(MESSAGE_TYPES.DISCONNECT_PLATFORM, async ({ platform }) => {
  await getPlatformAdapter(platform).disconnect();
  return { ok: true };
});

onBackgroundMessage<{ taskId: string }>(MESSAGE_TYPES.FETCH_ANALYTICS, async ({ taskId }) => {
  const task = await uploadRepository.get(taskId);
  if (!task) return { ok: false, error: 'Task not found.' };
  try {
    const snapshot = await getPlatformAdapter(task.platform).fetchAnalytics(task);
    return { ok: true, snapshot };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});

onBackgroundMessage(MESSAGE_TYPES.DETECTED_ACCOUNT, async (payload) => {
  logger.debug('Detected active platform account from content script', payload as Record<string, unknown>);
  return { ok: true };
});

logger.info('Social Media Studio Pro background service worker started.', {
  platforms: Object.keys(platformAdapters),
});
