/**
 * Facebook Graph API publishing. Videos use the official chunked
 * "resumable upload" protocol (`upload_phase=start|transfer|finish`), which
 * gives us real progress reporting and the ability to resume a partially
 * uploaded video (by re-querying the session) after a pause. Photos are
 * small enough to publish in a single multipart request.
 */

import { FACEBOOK_GRAPH_API_BASE } from '@shared/constants';
import type { AnalyticsSnapshot, UploadTask } from '@shared/types/index';
import { uploadRepository } from '@shared/db/repositories/uploadRepository';
import type { PlatformUploadResult, UploadProgressUpdate } from '@background/platforms/PlatformAdapter';
import { NonRetryableUploadError } from '@background/platforms/PlatformAdapter';
import { getConnectedPageId, getValidFacebookToken } from './facebookAuth';
import type {
  FacebookInsightsResponse,
  FacebookPhotoUploadResponse,
  FacebookResumableStartResponse,
  FacebookResumableTransferResponse,
} from './types';

const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MiB

async function startResumableSession(pageId: string, token: string, fileSize: number): Promise<FacebookResumableStartResponse> {
  const form = new FormData();
  form.set('upload_phase', 'start');
  form.set('file_size', String(fileSize));
  form.set('access_token', token);

  const response = await fetch(`${FACEBOOK_GRAPH_API_BASE}/${pageId}/videos`, { method: 'POST', body: form });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new NonRetryableUploadError(`Facebook rejected the upload session (HTTP ${response.status}): ${text}`);
  }
  return response.json();
}

async function transferChunk(
  pageId: string,
  token: string,
  sessionId: string,
  startOffset: number,
  chunk: Blob,
  signal: AbortSignal,
): Promise<FacebookResumableTransferResponse> {
  const form = new FormData();
  form.set('upload_phase', 'transfer');
  form.set('upload_session_id', sessionId);
  form.set('start_offset', String(startOffset));
  form.set('access_token', token);
  form.set('video_file_chunk', chunk, 'chunk');

  const response = await fetch(`${FACEBOOK_GRAPH_API_BASE}/${pageId}/videos`, { method: 'POST', body: form, signal });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Facebook chunk upload failed (HTTP ${response.status}): ${text}`);
  }
  return response.json();
}

async function finishSession(
  pageId: string,
  token: string,
  sessionId: string,
  task: UploadTask,
): Promise<void> {
  const form = new FormData();
  form.set('upload_phase', 'finish');
  form.set('upload_session_id', sessionId);
  form.set('access_token', token);
  form.set('title', task.metadata.title.slice(0, 255));
  form.set('description', task.metadata.description);
  if (task.metadata.privacyStatus) {
    const privacyValue = task.metadata.privacyStatus === 'public' ? 'EVERYONE' : 'SELF';
    form.set('privacy', JSON.stringify({ value: privacyValue }));
  }

  const response = await fetch(`${FACEBOOK_GRAPH_API_BASE}/${pageId}/videos`, { method: 'POST', body: form });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to finalize Facebook video (HTTP ${response.status}): ${text}`);
  }
}

async function uploadVideo(
  task: UploadTask,
  file: Blob,
  onProgress: (update: UploadProgressUpdate) => void,
  signal: AbortSignal,
): Promise<PlatformUploadResult> {
  const token = await getValidFacebookToken();
  const pageId = await getConnectedPageId();

  let sessionId = task.resumableSessionUrl;
  let videoId = task.platformContentId;
  let offset = task.bytesUploaded ?? 0;

  if (!sessionId) {
    const started = await startResumableSession(pageId, token, file.size);
    sessionId = started.upload_session_id;
    videoId = started.video_id;
    offset = Number(started.start_offset ?? 0);
    await uploadRepository.update(task.id, { resumableSessionUrl: sessionId, platformContentId: videoId });
  }

  while (offset < file.size) {
    if (signal.aborted) throw new DOMException('Upload paused or canceled.', 'AbortError');
    const end = Math.min(offset + CHUNK_SIZE, file.size);
    const chunk = file.slice(offset, end);
    const transfer = await transferChunk(pageId, token, sessionId, offset, chunk, signal);
    offset = Number(transfer.start_offset);
    onProgress({ bytesUploaded: Math.min(offset, file.size), totalBytes: file.size });
    if (Number(transfer.end_offset) === Number(transfer.start_offset)) break;
  }

  await finishSession(pageId, token, sessionId, task);
  onProgress({ bytesUploaded: file.size, totalBytes: file.size });

  return {
    platformContentId: videoId!,
    platformContentUrl: `https://www.facebook.com/${videoId}`,
  };
}

async function uploadPhoto(
  task: UploadTask,
  file: Blob,
  onProgress: (update: UploadProgressUpdate) => void,
  signal: AbortSignal,
): Promise<PlatformUploadResult> {
  const token = await getValidFacebookToken();
  const pageId = await getConnectedPageId();

  const form = new FormData();
  form.set('source', file, task.file.name);
  form.set('caption', `${task.metadata.title}\n\n${task.metadata.description}`.trim());
  form.set('access_token', token);
  if (task.metadata.privacyStatus === 'private') form.set('published', 'false');

  onProgress({ bytesUploaded: 0, totalBytes: file.size });
  const response = await fetch(`${FACEBOOK_GRAPH_API_BASE}/${pageId}/photos`, { method: 'POST', body: form, signal });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Facebook photo upload failed (HTTP ${response.status}): ${text}`);
  }
  const data = (await response.json()) as FacebookPhotoUploadResponse;
  onProgress({ bytesUploaded: file.size, totalBytes: file.size });

  return {
    platformContentId: data.id,
    platformContentUrl: data.post_id ? `https://www.facebook.com/${data.post_id}` : undefined,
  };
}

export async function uploadToFacebook(
  task: UploadTask,
  file: Blob,
  onProgress: (update: UploadProgressUpdate) => void,
  signal: AbortSignal,
): Promise<PlatformUploadResult> {
  if (task.mediaKind === 'image') return uploadPhoto(task, file, onProgress, signal);
  return uploadVideo(task, file, onProgress, signal);
}

export async function fetchFacebookAnalytics(task: UploadTask): Promise<AnalyticsSnapshot | null> {
  if (!task.platformContentId) return null;
  try {
    const token = await getValidFacebookToken();
    const metrics = task.mediaKind === 'image' ? [] : ['total_video_views', 'total_video_views_unique'];
    if (metrics.length === 0) return null;

    const response = await fetch(
      `${FACEBOOK_GRAPH_API_BASE}/${task.platformContentId}/video_insights?metric=${metrics.join(',')}&access_token=${token}`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as FacebookInsightsResponse;
    const views = data.data.find((m) => m.name === 'total_video_views')?.values?.[0]?.value;

    return {
      id: `facebook_${task.platformContentId}_${Date.now()}`,
      platform: 'facebook',
      contentId: task.platformContentId,
      title: task.metadata.title,
      capturedAt: Date.now(),
      views,
    };
  } catch {
    return null;
  }
}
