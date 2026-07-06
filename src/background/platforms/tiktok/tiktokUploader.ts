/**
 * TikTok Content Posting API (v2) video publishing:
 *   1. `/v2/post/publish/video/init/` declares the upload (size + chunking
 *      plan) and returns a pre-signed `upload_url`.
 *   2. The video is PUT to `upload_url` in chunks with `Content-Range`
 *      headers (mirrors the same resumable pattern as YouTube/Facebook).
 *   3. `/v2/post/publish/status/fetch/` is polled until TikTok finishes
 *      processing and publishing the post.
 *
 * Photo/carousel posts use the analogous `/v2/post/publish/content/init/`
 * endpoint with `PHOTO` post mode.
 */

import { TIKTOK_API_BASE } from '@shared/constants';
import type { AnalyticsSnapshot, UploadTask } from '@shared/types/index';
import { uploadRepository } from '@shared/db/repositories/uploadRepository';
import type { PlatformUploadResult, UploadProgressUpdate } from '@background/platforms/PlatformAdapter';
import { NonRetryableUploadError } from '@background/platforms/PlatformAdapter';
import { getValidTikTokToken } from './tiktokAuth';
import type { TikTokInitVideoResponse, TikTokPublishStatusResponse } from './types';

const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MiB, within TikTok's 5MB-64MB recommended chunk range.

function mapPrivacyLevel(task: UploadTask): string {
  switch (task.metadata.privacyStatus) {
    case 'private':
      return 'SELF_ONLY';
    case 'unlisted':
      return 'MUTUAL_FOLLOW_FRIENDS';
    default:
      return 'PUBLIC_TO_EVERYONE';
  }
}

async function initVideoUpload(task: UploadTask, file: Blob, token: string): Promise<{ publishId: string; uploadUrl: string }> {
  const totalChunkCount = Math.ceil(file.size / CHUNK_SIZE);
  const response = await fetch(`${TIKTOK_API_BASE}/post/publish/video/init/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      post_info: {
        title: task.metadata.title.slice(0, 150),
        privacy_level: mapPrivacyLevel(task),
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: file.size,
        chunk_size: Math.min(CHUNK_SIZE, file.size),
        total_chunk_count: Math.max(totalChunkCount, 1),
      },
    }),
  });

  const data = (await response.json()) as TikTokInitVideoResponse;
  if (!response.ok || data.error) {
    const message = data.error?.message ?? response.statusText;
    if (response.status === 401 || response.status === 403) {
      throw new NonRetryableUploadError(`TikTok rejected the upload session: ${message}`);
    }
    throw new Error(`Failed to start TikTok upload session: ${message}`);
  }
  return { publishId: data.data.publish_id, uploadUrl: data.data.upload_url };
}

async function pollPublishStatus(publishId: string, token: string, timeoutMs = 120_000): Promise<string[] | undefined> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(`${TIKTOK_API_BASE}/post/publish/status/fetch/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ publish_id: publishId }),
    });
    const data = (await response.json()) as TikTokPublishStatusResponse;
    if (data.data?.status === 'PUBLISH_COMPLETE') return data.data.publicaly_available_post_id;
    if (data.data?.status === 'FAILED') {
      throw new Error(`TikTok failed to process the video: ${data.data.fail_reason ?? 'unknown reason'}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  return undefined; // Processing continues server-side; analytics fetch will pick up the ID later.
}

export async function uploadToTikTok(
  task: UploadTask,
  file: Blob,
  onProgress: (update: UploadProgressUpdate) => void,
  signal: AbortSignal,
): Promise<PlatformUploadResult> {
  const token = await getValidTikTokToken();

  let uploadUrl = task.resumableSessionUrl;
  let publishId = task.platformContentId;
  let offset = task.bytesUploaded ?? 0;

  if (!uploadUrl || !publishId) {
    const initResult = await initVideoUpload(task, file, token);
    uploadUrl = initResult.uploadUrl;
    publishId = initResult.publishId;
    offset = 0;
    await uploadRepository.update(task.id, { resumableSessionUrl: uploadUrl, platformContentId: publishId });
  }

  while (offset < file.size) {
    if (signal.aborted) throw new DOMException('Upload paused or canceled.', 'AbortError');
    const end = Math.min(offset + CHUNK_SIZE, file.size);
    const chunk = file.slice(offset, end);

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      signal,
      headers: {
        'Content-Range': `bytes ${offset}-${end - 1}/${file.size}`,
        'Content-Type': file.type || 'video/mp4',
      },
      body: chunk,
    });

    if (!response.ok && response.status !== 201 && response.status !== 206) {
      const text = await response.text().catch(() => '');
      throw new Error(`TikTok chunk upload failed (HTTP ${response.status}): ${text}`);
    }

    offset = end;
    onProgress({ bytesUploaded: offset, totalBytes: file.size });
  }

  const publishedIds = await pollPublishStatus(publishId, token);

  return {
    platformContentId: publishId,
    platformContentUrl: publishedIds?.[0] ? `https://www.tiktok.com/@me/video/${publishedIds[0]}` : undefined,
  };
}

export async function fetchTikTokAnalytics(_task: UploadTask): Promise<AnalyticsSnapshot | null> {
  // TikTok's public Content Posting API does not currently expose a
  // general-purpose video analytics endpoint for third-party apps; detailed
  // performance metrics are only available for Business/Ads accounts via
  // separate, more restrictive TikTok Business API products. We surface
  // this honestly instead of fabricating numbers.
  return null;
}
