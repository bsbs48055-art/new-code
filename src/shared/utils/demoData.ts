/**
 * Sample/demo data so a first-time user can explore the dashboard (queue,
 * history, activity log, analytics) before connecting any real platform
 * account. Everything inserted here is clearly labeled "[Demo]" and can be
 * removed in one click — it never touches real platform APIs and is not
 * involved in any actual upload.
 */

import { db } from '@shared/db/db';
import type { ActivityLogEntry, AnalyticsSnapshot, UploadTask } from '@shared/types/index';
import { generateId } from '@shared/utils/id';

const DEMO_TAG = '__sms_pro_demo__';

function demoTask(overrides: Partial<UploadTask> & Pick<UploadTask, 'platform' | 'status' | 'metadata'>): UploadTask {
  const now = Date.now();
  return {
    id: generateId('demo_task'),
    mediaKind: 'video',
    file: { name: 'demo-clip.mp4', mimeType: 'video/mp4', size: 42 * 1024 * 1024, blobKey: DEMO_TAG },
    progress: 0,
    bytesUploaded: 0,
    attempt: 0,
    maxAttempts: 3,
    priority: 0,
    createdAt: now,
    updatedAt: now,
    batchId: DEMO_TAG,
    isDemo: true,
    ...overrides,
  };
}

/** Inserts a small, clearly-labeled set of sample tasks/logs/analytics for UI exploration. */
export async function loadDemoData(): Promise<void> {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  const tasks: UploadTask[] = [
    demoTask({
      platform: 'youtube',
      status: 'completed',
      progress: 100,
      completedAt: now - 2 * day,
      platformContentId: 'demo-yt-1',
      platformContentUrl: undefined,
      metadata: { title: '[Demo] 5 Tips for Better Lighting', description: 'A sample completed upload.', privacyStatus: 'public', tags: ['lighting', 'tutorial'] },
    }),
    demoTask({
      platform: 'tiktok',
      status: 'completed',
      progress: 100,
      completedAt: now - 1 * day,
      mediaKind: 'short',
      metadata: { title: '[Demo] Quick behind-the-scenes', description: 'Sample completed short.', privacyStatus: 'public', hashtags: ['#bts', '#creator'] },
    }),
    demoTask({
      platform: 'facebook',
      status: 'failed',
      progress: 40,
      error: 'Demo error: connection expired (this is sample data, not a real failure).',
      metadata: { title: '[Demo] Weekly update video', description: 'Sample failed upload for illustration.', privacyStatus: 'public' },
    }),
    demoTask({
      platform: 'youtube',
      status: 'scheduled',
      scheduledFor: now + 2 * day,
      metadata: { title: '[Demo] Upcoming product walkthrough', description: 'Sample scheduled upload.', privacyStatus: 'public' },
    }),
    demoTask({
      platform: 'tiktok',
      status: 'queued',
      metadata: { title: '[Demo] Trending sound edit', description: 'Sample item waiting in the queue.', privacyStatus: 'public' },
    }),
  ];
  await db.uploadTasks.bulkPut(tasks);

  const logs: ActivityLogEntry[] = [
    { id: generateId('demo_log'), timestamp: now - 2 * day, level: 'success', platform: 'youtube', message: '[Demo] Published "5 Tips for Better Lighting" to YouTube.' },
    { id: generateId('demo_log'), timestamp: now - 1 * day, level: 'success', platform: 'tiktok', message: '[Demo] Published "Quick behind-the-scenes" to TikTok.' },
    { id: generateId('demo_log'), timestamp: now - 3 * hour, level: 'error', platform: 'facebook', message: '[Demo] Upload failed for "Weekly update video": connection expired.' },
  ];
  await db.logs.bulkPut(logs);

  const analytics: AnalyticsSnapshot[] = [
    { id: generateId('demo_analytics'), platform: 'youtube', contentId: 'demo-yt-1', title: '[Demo] 5 Tips for Better Lighting', capturedAt: now - 1 * day, views: 1240, likes: 88, comments: 12 },
    { id: generateId('demo_analytics'), platform: 'youtube', contentId: 'demo-yt-1', title: '[Demo] 5 Tips for Better Lighting', capturedAt: now, views: 2310, likes: 156, comments: 24 },
  ];
  await db.analytics.bulkPut(analytics);
}

/** Removes all sample data inserted by {@link loadDemoData}. Never touches real uploads/logs. */
export async function clearDemoData(): Promise<void> {
  await db.uploadTasks.where('batchId').equals(DEMO_TAG).delete();
  await db.logs.filter((entry) => entry.message.startsWith('[Demo]')).delete();
  await db.analytics.filter((entry) => entry.contentId.startsWith('demo-')).delete();
}

export async function hasDemoData(): Promise<boolean> {
  const count = await db.uploadTasks.where('batchId').equals(DEMO_TAG).count();
  return count > 0;
}
