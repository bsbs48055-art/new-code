/**
 * YouTube Data API v3 resumable video upload. Implements the official
 * resumable upload protocol (init session → chunked PUT with Content-Range
 * → 308 for "keep going", 200/201 for done), which is what makes true
 * pause/resume possible: the session URL and last confirmed byte offset are
 * persisted on the task record, so upload can resume after the popup/side
 * panel closes or the service worker is suspended and later restarted.
 */

import { YOUTUBE_API_BASE, YOUTUBE_DATA_API_BASE } from '@shared/constants';
import type { AnalyticsSnapshot, UploadTask } from '@shared/types/index';
import { uploadRepository } from '@shared/db/repositories/uploadRepository';
import { logger } from '@shared/utils/logger';
import { getValidYouTubeToken } from './youtubeAuth';
import { resolveCategoryId } from './categoryMap';
import type { YouTubeVideoInsertBody, YouTubeVideoResource } from './types';
import type { PlatformUploadResult, UploadProgressUpdate } from '@background/platforms/PlatformAdapter';
import { NonRetryableUploadError } from '@background/platforms/PlatformAdapter';

const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MiB, aligned to Google's required 256 KiB multiple.

function buildVideoResourceBody(task: UploadTask): YouTubeVideoInsertBody {
  const privacyStatus =
    task.metadata.privacyStatus === 'unlisted' || task.metadata.privacyStatus === 'private'
      ? task.metadata.privacyStatus
      : 'public';

  return {
    snippet: {
      title: task.metadata.title.slice(0, 100),
      description: task.metadata.description.slice(0, 5000),
      tags: task.metadata.tags?.slice(0, 500),
      categoryId: resolveCategoryId(task.metadata.category),
      defaultLanguage: task.metadata.language,
    },
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: task.metadata.audience === 'made_for_kids',
      publishAt: task.scheduledFor ? new Date(task.scheduledFor).toISOString() : undefined,
    },
  };
}

async function initiateResumableSession(task: UploadTask, file: Blob, token: string): Promise<string> {
  const body = buildVideoResourceBody(task);
  const response = await fetch(
    `${YOUTUBE_API_BASE}/videos?uploadType=resumable&part=snippet,status`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(file.size),
        'X-Upload-Content-Type': file.type || 'video/*',
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    if (response.status === 401 || response.status === 403) {
      throw new NonRetryableUploadError(`YouTube rejected the upload session (HTTP ${response.status}): ${text}`);
    }
    throw new Error(`Failed to start YouTube upload session (HTTP ${response.status}): ${text}`);
  }

  const location = response.headers.get('Location');
  if (!location) throw new Error('YouTube did not return a resumable upload session URL.');
  return location;
}

/** Queries how many bytes the server has already received for a session (used to resume after a pause). */
async function queryUploadedOffset(sessionUrl: string, totalBytes: number): Promise<number> {
  const response = await fetch(sessionUrl, {
    method: 'PUT',
    headers: { 'Content-Range': `bytes */${totalBytes}` },
  });
  if (response.status === 308) {
    const range = response.headers.get('Range');
    if (!range) return 0;
    const match = /bytes=0-(\d+)/.exec(range);
    return match ? Number(match[1]) + 1 : 0;
  }
  if (response.ok) {
    // The server considers the upload already complete.
    return totalBytes;
  }
  return 0;
}

export async function uploadToYouTube(
  task: UploadTask,
  file: Blob,
  onProgress: (update: UploadProgressUpdate) => void,
  signal: AbortSignal,
): Promise<PlatformUploadResult> {
  const token = await getValidYouTubeToken();

  let sessionUrl = task.resumableSessionUrl;
  let offset = 0;

  if (sessionUrl) {
    offset = await queryUploadedOffset(sessionUrl, file.size);
  } else {
    sessionUrl = await initiateResumableSession(task, file, token);
    await uploadRepository.update(task.id, { resumableSessionUrl: sessionUrl });
  }

  while (offset < file.size) {
    if (signal.aborted) throw new DOMException('Upload paused or canceled.', 'AbortError');

    const end = Math.min(offset + CHUNK_SIZE, file.size);
    const chunk = file.slice(offset, end);

    const response = await fetch(sessionUrl, {
      method: 'PUT',
      signal,
      headers: {
        'Content-Length': String(chunk.size),
        'Content-Range': `bytes ${offset}-${end - 1}/${file.size}`,
      },
      body: chunk,
    });

    if (response.status === 308) {
      offset = end;
      onProgress({ bytesUploaded: offset, totalBytes: file.size });
      continue;
    }

    if (response.ok) {
      const resource = (await response.json()) as YouTubeVideoResource;
      onProgress({ bytesUploaded: file.size, totalBytes: file.size });
      return {
        platformContentId: resource.id,
        platformContentUrl: `https://www.youtube.com/watch?v=${resource.id}`,
      };
    }

    const text = await response.text().catch(() => '');
    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
      throw new NonRetryableUploadError(`YouTube upload failed (HTTP ${response.status}): ${text}`);
    }
    throw new Error(`YouTube upload chunk failed (HTTP ${response.status}): ${text}`);
  }

  throw new Error('YouTube upload ended unexpectedly without a server confirmation.');
}

/** Uploads a custom thumbnail for an already-published video. */
export async function setYouTubeThumbnail(videoId: string, thumbnail: Blob): Promise<void> {
  const token = await getValidYouTubeToken();
  const response = await fetch(`${YOUTUBE_API_BASE}/thumbnails/set?videoId=${videoId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': thumbnail.type || 'image/jpeg' },
    body: thumbnail,
  });
  if (!response.ok) {
    logger.warn('Failed to set custom YouTube thumbnail', { status: response.status });
  }
}

export async function fetchYouTubeAnalytics(task: UploadTask): Promise<AnalyticsSnapshot | null> {
  if (!task.platformContentId) return null;
  const token = await getValidYouTubeToken();
  const response = await fetch(
    `${YOUTUBE_DATA_API_BASE}/videos?part=statistics,snippet&id=${task.platformContentId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as {
    items?: { statistics?: Record<string, string>; snippet?: { title?: string } }[];
  };
  const item = data.items?.[0];
  if (!item) return null;

  return {
    id: `youtube_${task.platformContentId}_${Date.now()}`,
    platform: 'youtube',
    contentId: task.platformContentId,
    title: item.snippet?.title ?? task.metadata.title,
    capturedAt: Date.now(),
    views: Number(item.statistics?.viewCount ?? 0),
    likes: Number(item.statistics?.likeCount ?? 0),
    comments: Number(item.statistics?.commentCount ?? 0),
  };
}
