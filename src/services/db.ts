import Dexie, { type Table } from 'dexie';
import type {
  Collection,
  ExportJob,
  Folder,
  HistoryEntry,
  SavedIdea,
} from '@/types';

export interface CacheEntry {
  key: string;
  data: unknown;
  expiresAt: number;
  createdAt: string;
}

export interface OfflineQueueItem {
  id: string;
  method: string;
  path: string;
  body?: unknown;
  createdAt: string;
}

/**
 * IndexedDB via Dexie — local-first persistence for ideas, history,
 * exports, folders/collections, and API response cache.
 */
export class ContentHunterDB extends Dexie {
  ideas!: Table<SavedIdea, string>;
  collections!: Table<Collection, string>;
  folders!: Table<Folder, string>;
  history!: Table<HistoryEntry, string>;
  exports!: Table<ExportJob, string>;
  cache!: Table<CacheEntry, string>;
  offlineQueue!: Table<OfflineQueueItem, string>;

  constructor() {
    super('content_hunter_ai_pro');
    this.version(1).stores({
      ideas: 'id, favorite, folderId, collectionId, updatedAt, *tags',
      collections: 'id, name, createdAt',
      folders: 'id, name, parentId, createdAt',
      history: 'id, action, createdAt',
      exports: 'id, format, createdAt',
      cache: 'key, expiresAt',
      offlineQueue: 'id, createdAt',
    });
  }
}

export const db = new ContentHunterDB();

export async function getCached<T>(key: string): Promise<T | null> {
  const entry = await db.cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    await db.cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export async function setCache(key: string, data: unknown, ttlMinutes: number) {
  await db.cache.put({
    key,
    data,
    expiresAt: Date.now() + ttlMinutes * 60_000,
    createdAt: new Date().toISOString(),
  });
}

export async function clearExpiredCache() {
  await db.cache.where('expiresAt').below(Date.now()).delete();
}
