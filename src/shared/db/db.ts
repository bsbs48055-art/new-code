/**
 * IndexedDB schema definition using Dexie. This database is accessible from
 * the background service worker, the side panel, the popup, and the options
 * page alike (IndexedDB is shared across all extension contexts for the same
 * extension origin), so it acts as the single source of truth for anything
 * larger or longer-lived than a simple preference flag.
 */

import Dexie, { type Table } from 'dexie';
import { DB_NAME, DB_VERSION } from '@shared/constants';
import type {
  ActivityLogEntry,
  AnalyticsSnapshot,
  ContentMetadataDefaults,
  PublishingProfile,
  UploadTask,
} from '@shared/types/index';

/** A reusable, standalone content template (independent of a publishing profile). */
export interface ContentTemplate {
  id: string;
  name: string;
  defaults: ContentMetadataDefaults;
  createdAt: number;
  updatedAt: number;
}

/** Raw binary storage record for files staged for upload. */
export interface BlobRecord {
  key: string;
  blob: Blob;
  name: string;
  mimeType: string;
  size: number;
  createdAt: number;
}

export class SmsProDatabase extends Dexie {
  uploadTasks!: Table<UploadTask, string>;
  profiles!: Table<PublishingProfile, string>;
  templates!: Table<ContentTemplate, string>;
  logs!: Table<ActivityLogEntry, string>;
  analytics!: Table<AnalyticsSnapshot, string>;
  blobs!: Table<BlobRecord, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      uploadTasks: 'id, platform, status, batchId, scheduledFor, priority, createdAt, updatedAt, completedAt',
      profiles: 'id, name, updatedAt',
      templates: 'id, name, updatedAt',
      logs: 'id, timestamp, level, platform',
      analytics: 'id, platform, contentId, capturedAt',
      blobs: 'key, createdAt',
    });
  }
}

export const db = new SmsProDatabase();
