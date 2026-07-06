/**
 * Builds new upload tasks from raw enqueue requests, applying profile
 * defaults, duplicate detection (skip-existing), and scheduling.
 */

import { DEFAULT_MAX_ATTEMPTS } from '@shared/constants';
import type { ContentMetadata, MediaFileRef, MediaKind, MediaProbeResult, PlatformId, RecurrenceRule, ThumbnailSelection, UploadTask } from '@shared/types/index';
import { generateId } from '@shared/utils/id';
import { uploadRepository } from '@shared/db/repositories/uploadRepository';
import { profileRepository } from '@shared/db/repositories/profileRepository';
import { fileFingerprint } from '@shared/utils/fileUtils';

export interface EnqueueTaskInput {
  platform: PlatformId;
  mediaKind: MediaKind;
  file: MediaFileRef;
  metadata: Partial<ContentMetadata>;
  probe?: MediaProbeResult;
  thumbnail?: ThumbnailSelection;
  profileId?: string;
  batchId?: string;
  priority?: number;
  scheduledFor?: number;
  recurrence?: RecurrenceRule;
  skipIfDuplicate?: boolean;
}

export async function buildAndEnqueueTasks(
  inputs: EnqueueTaskInput[],
): Promise<{ created: UploadTask[]; skippedDuplicates: number }> {
  const created: UploadTask[] = [];
  let skippedDuplicates = 0;

  for (const input of inputs) {
    if (input.skipIfDuplicate) {
      const existing = await uploadRepository.findPossibleDuplicate(fileFingerprint(input.file));
      if (existing) {
        skippedDuplicates += 1;
        continue;
      }
    }

    const profile = input.profileId ? await profileRepository.get(input.profileId) : undefined;
    const now = Date.now();

    const metadata: ContentMetadata = {
      title: input.metadata.title ?? profile?.defaults.titleTemplate ?? input.file.name,
      description: input.metadata.description ?? profile?.defaults.descriptionTemplate ?? '',
      tags: input.metadata.tags ?? profile?.defaults.tags,
      hashtags: input.metadata.hashtags ?? profile?.defaults.hashtags,
      category: input.metadata.category ?? profile?.defaults.category,
      playlistId: input.metadata.playlistId ?? profile?.defaults.playlistId,
      privacyStatus: input.metadata.privacyStatus ?? profile?.defaults.privacyStatus ?? 'public',
      audience: input.metadata.audience ?? profile?.defaults.audience,
      location: input.metadata.location ?? profile?.defaults.location,
      language: input.metadata.language ?? profile?.defaults.language,
    };

    const task: UploadTask = {
      id: generateId('task'),
      platform: input.platform,
      mediaKind: input.mediaKind,
      file: input.file,
      probe: input.probe,
      thumbnail: input.thumbnail,
      metadata,
      status: input.scheduledFor ? 'scheduled' : 'queued',
      priority: input.priority ?? 0,
      progress: 0,
      bytesUploaded: 0,
      attempt: 0,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
      scheduledFor: input.scheduledFor,
      recurrence: input.recurrence,
      profileId: input.profileId,
      batchId: input.batchId,
      createdAt: now,
      updatedAt: now,
    };

    created.push(task);
  }

  if (created.length > 0) await uploadRepository.bulkAdd(created);
  return { created, skippedDuplicates };
}
