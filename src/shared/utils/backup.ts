/**
 * Manual JSON export/import of the app's IndexedDB tables and settings,
 * used by Settings → Backup & Restore. Blob content (staged upload files)
 * is intentionally excluded from backups since it is large and transient;
 * only durable metadata (history, profiles, templates, logs, analytics,
 * settings) is portable.
 */

import { db } from '@shared/db/db';
import { settingsRepository } from '@shared/db/settingsRepository';

export interface BackupPayload {
  version: 1;
  exportedAt: number;
  settings: Awaited<ReturnType<typeof settingsRepository.get>>;
  uploadTasks: unknown[];
  profiles: unknown[];
  templates: unknown[];
  logs: unknown[];
  analytics: unknown[];
}

export async function exportBackup(): Promise<BackupPayload> {
  const [settings, uploadTasks, profiles, templates, logs, analytics] = await Promise.all([
    settingsRepository.get(),
    db.uploadTasks.toArray(),
    db.profiles.toArray(),
    db.templates.toArray(),
    db.logs.toArray(),
    db.analytics.toArray(),
  ]);
  return { version: 1, exportedAt: Date.now(), settings, uploadTasks, profiles, templates, logs, analytics };
}

export async function downloadBackup(): Promise<void> {
  const payload = await exportBackup();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const filename = `sms-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
  await chrome.downloads.download({ url, filename, saveAs: true });
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function importBackup(payload: BackupPayload): Promise<void> {
  if (payload.version !== 1) throw new Error('Unsupported backup file version.');
  await db.transaction('rw', [db.uploadTasks, db.profiles, db.templates, db.logs, db.analytics], async () => {
    await db.uploadTasks.bulkPut(payload.uploadTasks as never[]);
    await db.profiles.bulkPut(payload.profiles as never[]);
    await db.templates.bulkPut(payload.templates as never[]);
    await db.logs.bulkPut(payload.logs as never[]);
    await db.analytics.bulkPut(payload.analytics as never[]);
  });
  await settingsRepository.update(payload.settings);
}
