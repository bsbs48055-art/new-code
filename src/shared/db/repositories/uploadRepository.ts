/** Data-access layer for upload queue tasks. Keeps Dexie query details out of business logic. */

import { db } from '@shared/db/db';
import type { UploadStatus, UploadTask } from '@shared/types/index';

export const uploadRepository = {
  async add(task: UploadTask): Promise<void> {
    await db.uploadTasks.put(task);
  },

  async bulkAdd(tasks: UploadTask[]): Promise<void> {
    await db.uploadTasks.bulkPut(tasks);
  },

  async update(id: string, patch: Partial<UploadTask>): Promise<void> {
    await db.uploadTasks.update(id, { ...patch, updatedAt: Date.now() });
  },

  async get(id: string): Promise<UploadTask | undefined> {
    return db.uploadTasks.get(id);
  },

  async remove(id: string): Promise<void> {
    await db.uploadTasks.delete(id);
  },

  async all(): Promise<UploadTask[]> {
    return db.uploadTasks.orderBy('createdAt').reverse().toArray();
  },

  async byStatus(status: UploadStatus): Promise<UploadTask[]> {
    return db.uploadTasks.where('status').equals(status).sortBy('priority');
  },

  async byStatuses(statuses: UploadStatus[]): Promise<UploadTask[]> {
    return db.uploadTasks.where('status').anyOf(statuses).sortBy('priority');
  },

  async dueScheduledTasks(nowMs: number): Promise<UploadTask[]> {
    return db.uploadTasks
      .where('status')
      .equals('scheduled')
      .filter((task) => (task.scheduledFor ?? Infinity) <= nowMs)
      .toArray();
  },

  async findPossibleDuplicate(fingerprint: string, excludeStatuses: UploadStatus[] = ['canceled', 'failed']): Promise<UploadTask | undefined> {
    const all = await db.uploadTasks.toArray();
    return all.find(
      (task) =>
        !excludeStatuses.includes(task.status) &&
        `${task.file.name.toLowerCase()}::${task.file.size}` === fingerprint,
    );
  },
};
