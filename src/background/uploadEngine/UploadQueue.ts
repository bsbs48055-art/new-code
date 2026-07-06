/**
 * Core bulk-upload queue engine. Runs entirely inside the background
 * service worker, persists all state to IndexedDB (so it survives the
 * worker being suspended/restarted by Chrome), and drives each task through
 * the appropriate platform adapter with configurable concurrency, priority
 * ordering, retry-with-backoff, and pause/resume/cancel support.
 */

import type { UploadTask } from '@shared/types/index';
import { uploadRepository } from '@shared/db/repositories/uploadRepository';
import { logRepository } from '@shared/db/repositories/logRepository';
import { settingsRepository } from '@shared/db/settingsRepository';
import { getBlob } from '@shared/db/blobStore';
import { logger } from '@shared/utils/logger';
import { broadcast } from '@shared/messaging';
import { MESSAGE_TYPES } from '@shared/constants';
import { getPlatformAdapter } from '@background/platforms/registry';
import { NonRetryableUploadError } from '@background/platforms/PlatformAdapter';
import { notifyUploadComplete, notifyUploadFailed } from '@background/notifications/NotificationService';

const activeControllers = new Map<string, AbortController>();
const pausedTaskIds = new Set<string>();
const taskCompletedListeners: ((task: UploadTask) => void)[] = [];

function backoffDelayMs(attempt: number): number {
  return Math.min(2 ** attempt * 1000, 30_000);
}

class UploadQueueEngine {
  private processing = false;

  /** Kicks the queue: pulls queued/retryable tasks up to the configured concurrency limit. */
  async tick(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      const settings = await settingsRepository.get();
      const [queued, uploading] = await Promise.all([
        uploadRepository.byStatus('queued'),
        uploadRepository.byStatus('uploading'),
      ]);

      const capacity = Math.max(settings.uploadConcurrency, 1) - uploading.length;
      if (capacity <= 0) return;

      const sorted = queued.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);
      const toStart = sorted.slice(0, capacity);

      await Promise.all(toStart.map((task) => this.runTask(task)));
    } finally {
      this.processing = false;
    }
  }

  private async runTask(task: UploadTask): Promise<void> {
    const controller = new AbortController();
    activeControllers.set(task.id, controller);
    pausedTaskIds.delete(task.id);

    await uploadRepository.update(task.id, { status: 'uploading', error: undefined });
    broadcast(MESSAGE_TYPES.QUEUE_UPDATED);

    try {
      const blob = await getBlob(task.file.blobKey);
      if (!blob) throw new NonRetryableUploadError('The source file could not be found. It may have been removed.');

      const adapter = getPlatformAdapter(task.platform);
      const startedAt = Date.now();

      const result = await adapter.upload(
        task,
        blob,
        async ({ bytesUploaded, totalBytes }) => {
          const elapsedSeconds = (Date.now() - startedAt) / 1000;
          const rate = elapsedSeconds > 0 ? bytesUploaded / elapsedSeconds : 0;
          const remainingBytes = totalBytes - bytesUploaded;
          const eta = rate > 0 ? remainingBytes / rate : undefined;
          await uploadRepository.update(task.id, {
            bytesUploaded,
            progress: totalBytes > 0 ? Math.round((bytesUploaded / totalBytes) * 100) : 0,
            estimatedSecondsRemaining: eta,
          });
          broadcast(MESSAGE_TYPES.QUEUE_UPDATED);
        },
        controller.signal,
      );

      const completedAt = Date.now();
      await uploadRepository.update(task.id, {
        status: 'completed',
        progress: 100,
        completedAt,
        platformContentId: result.platformContentId,
        platformContentUrl: result.platformContentUrl,
        estimatedSecondsRemaining: 0,
      });
      await logRepository.append({
        level: 'success',
        platform: task.platform,
        taskId: task.id,
        message: `Published "${task.metadata.title}" to ${task.platform}.`,
      });
      await notifyUploadComplete(task, result);
      const completedTask = await uploadRepository.get(task.id);
      if (completedTask) taskCompletedListeners.forEach((listener) => listener(completedTask));
    } catch (error) {
      await this.handleTaskError(task, error);
    } finally {
      activeControllers.delete(task.id);
      broadcast(MESSAGE_TYPES.QUEUE_UPDATED);
      void this.tick();
    }
  }

  private async handleTaskError(task: UploadTask, error: unknown): Promise<void> {
    const isAbort = error instanceof DOMException && error.name === 'AbortError';
    if (isAbort) {
      const status = pausedTaskIds.has(task.id) ? 'paused' : 'canceled';
      await uploadRepository.update(task.id, { status });
      await logRepository.append({
        level: 'warning',
        platform: task.platform,
        taskId: task.id,
        message: `Upload ${status} for "${task.metadata.title}".`,
      });
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    const nonRetryable = error instanceof NonRetryableUploadError;
    const nextAttempt = task.attempt + 1;
    const canRetry = !nonRetryable && nextAttempt < task.maxAttempts;

    logger.error(`Upload failed for task ${task.id}`, { message, nonRetryable, attempt: nextAttempt });

    if (canRetry) {
      await uploadRepository.update(task.id, { status: 'queued', attempt: nextAttempt, error: message });
      await logRepository.append({
        level: 'warning',
        platform: task.platform,
        taskId: task.id,
        message: `Retry ${nextAttempt}/${task.maxAttempts} scheduled for "${task.metadata.title}": ${message}`,
      });
      setTimeout(() => void this.tick(), backoffDelayMs(nextAttempt));
    } else {
      await uploadRepository.update(task.id, { status: 'failed', attempt: nextAttempt, error: message });
      await logRepository.append({
        level: 'error',
        platform: task.platform,
        taskId: task.id,
        message: `Upload failed for "${task.metadata.title}": ${message}`,
      });
      await notifyUploadFailed(task, message);
    }
  }

  async pause(taskId: string): Promise<void> {
    pausedTaskIds.add(taskId);
    activeControllers.get(taskId)?.abort();
    const task = await uploadRepository.get(taskId);
    if (task && task.status === 'queued') {
      await uploadRepository.update(taskId, { status: 'paused' });
    }
  }

  async resume(taskId: string): Promise<void> {
    pausedTaskIds.delete(taskId);
    const task = await uploadRepository.get(taskId);
    if (task && (task.status === 'paused' || task.status === 'failed')) {
      await uploadRepository.update(taskId, { status: 'queued', error: undefined });
    }
    void this.tick();
  }

  async cancel(taskId: string): Promise<void> {
    activeControllers.get(taskId)?.abort();
    await uploadRepository.update(taskId, { status: 'canceled' });
  }

  async retry(taskId: string): Promise<void> {
    const task = await uploadRepository.get(taskId);
    if (!task) return;
    await uploadRepository.update(taskId, {
      status: 'queued',
      attempt: 0,
      error: undefined,
      resumableSessionUrl: undefined,
      bytesUploaded: 0,
      progress: 0,
    });
    void this.tick();
  }

  async reorder(taskId: string, priority: number): Promise<void> {
    await uploadRepository.update(taskId, { priority });
  }

  /** Subscribes to task-completion events (used by the scheduler to spawn recurring occurrences). */
  onTaskCompleted(listener: (task: UploadTask) => void): () => void {
    taskCompletedListeners.push(listener);
    return () => {
      const idx = taskCompletedListeners.indexOf(listener);
      if (idx !== -1) taskCompletedListeners.splice(idx, 1);
    };
  }
}

export const uploadQueue = new UploadQueueEngine();
