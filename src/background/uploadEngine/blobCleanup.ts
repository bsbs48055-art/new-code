/** Periodically removes staged file blobs that are no longer referenced by any upload task. */

import { uploadRepository } from '@shared/db/repositories/uploadRepository';
import { pruneOrphanBlobs } from '@shared/db/blobStore';
import { logger } from '@shared/utils/logger';

export async function cleanupOrphanBlobs(): Promise<void> {
  const tasks = await uploadRepository.all();
  const referenced = new Set<string>();
  for (const task of tasks) {
    referenced.add(task.file.blobKey);
    if (task.thumbnail?.blobKey) referenced.add(task.thumbnail.blobKey);
  }
  const removed = await pruneOrphanBlobs(referenced);
  if (removed > 0) logger.info(`Cleaned up ${removed} orphaned staged file(s).`);
}
