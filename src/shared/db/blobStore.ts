/**
 * Persists raw file content in IndexedDB so that large binaries survive
 * navigation between the popup/side panel/options pages and remain
 * accessible to the background service worker for chunked uploads, without
 * ever needing to pass a `File` object through `chrome.runtime` messaging
 * (which cannot serialize File/Blob instances).
 */

import { db } from '@shared/db/db';
import { generateId } from '@shared/utils/id';

/** Stores a File/Blob and returns the key used to retrieve it later. */
export async function storeBlob(file: File | Blob, name = 'file'): Promise<string> {
  const key = generateId('blob');
  await db.blobs.put({
    key,
    blob: file,
    name: file instanceof File ? file.name : name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    createdAt: Date.now(),
  });
  return key;
}

/** Retrieves a previously stored blob, or null if it no longer exists. */
export async function getBlob(key: string): Promise<Blob | null> {
  const record = await db.blobs.get(key);
  return record?.blob ?? null;
}

/** Deletes a stored blob (e.g. after a task completes or is canceled). */
export async function deleteBlob(key: string): Promise<void> {
  await db.blobs.delete(key);
}

/** Removes blobs older than `maxAgeMs` that are no longer referenced, to bound storage growth. */
export async function pruneOrphanBlobs(referencedKeys: Set<string>, maxAgeMs = 1000 * 60 * 60 * 24 * 14): Promise<number> {
  const cutoff = Date.now() - maxAgeMs;
  const all = await db.blobs.toArray();
  const toDelete = all.filter((record) => !referencedKeys.has(record.key) && record.createdAt < cutoff);
  await db.blobs.bulkDelete(toDelete.map((r) => r.key));
  return toDelete.length;
}
