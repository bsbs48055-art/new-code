import { promises as fs } from 'node:fs';
import { getValidAccessToken, fetchCreatorInfo } from './tiktokAuth.js';
import { logger } from './logger.js';
import type { PrivacyLevel } from '../types.js';

const API_BASE = 'https://open.tiktokapis.com/v2';
const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MiB — within TikTok's 5–64MB recommended chunk range.

interface InitVideoResponse {
  data?: { publish_id: string; upload_url: string };
  error?: { code: string; message: string };
}

interface PublishStatusResponse {
  data?: { status: string; publicaly_available_post_id?: string[]; fail_reason?: string };
  error?: { code: string; message: string };
}

export interface UploadRequest {
  accessToken: string;
  filePath: string;
  fileSize: number;
  title: string;
  privacyLevel: PrivacyLevel;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
}

export class NonRetryableUploadError extends Error {}

async function initVideoUpload(req: UploadRequest): Promise<{ publishId: string; uploadUrl: string }> {
  const totalChunkCount = Math.max(Math.ceil(req.fileSize / CHUNK_SIZE), 1);
  const response = await fetch(`${API_BASE}/post/publish/video/init/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${req.accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({
      post_info: {
        title: req.title.slice(0, 2200),
        privacy_level: req.privacyLevel,
        disable_duet: req.disableDuet,
        disable_comment: req.disableComment,
        disable_stitch: req.disableStitch,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: req.fileSize,
        chunk_size: Math.min(CHUNK_SIZE, req.fileSize),
        total_chunk_count: totalChunkCount,
      },
    }),
  });

  const data = (await response.json()) as InitVideoResponse;
  if (!response.ok || !data.data || (data.error && data.error.code !== 'ok')) {
    const message = data.error?.message ?? response.statusText;
    if (response.status === 401 || response.status === 403) {
      throw new NonRetryableUploadError(`TikTok rejected the upload session: ${message}`);
    }
    throw new Error(`Failed to start TikTok upload session: ${message}`);
  }
  return { publishId: data.data.publish_id, uploadUrl: data.data.upload_url };
}

async function uploadChunks(
  uploadUrl: string,
  filePath: string,
  fileSize: number,
  onProgress: (bytesUploaded: number, totalBytes: number) => void,
  signal: AbortSignal,
): Promise<void> {
  const handle = await fs.open(filePath, 'r');
  try {
    let offset = 0;
    while (offset < fileSize) {
      if (signal.aborted) throw new DOMException('Upload canceled.', 'AbortError');
      const end = Math.min(offset + CHUNK_SIZE, fileSize);
      const length = end - offset;
      const buffer = Buffer.alloc(length);
      await handle.read(buffer, 0, length, offset);

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        signal,
        headers: {
          'Content-Range': `bytes ${offset}-${end - 1}/${fileSize}`,
          'Content-Length': String(length),
          'Content-Type': 'video/mp4',
        },
        body: buffer,
      });

      if (!response.ok && response.status !== 201 && response.status !== 206) {
        const text = await response.text().catch(() => '');
        throw new Error(`TikTok chunk upload failed (HTTP ${response.status}): ${text}`);
      }

      offset = end;
      onProgress(offset, fileSize);
    }
  } finally {
    await handle.close();
  }
}

async function pollPublishStatus(publishId: string, accessToken: string, signal: AbortSignal, timeoutMs = 3 * 60_000): Promise<string[] | undefined> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (signal.aborted) throw new DOMException('Upload canceled.', 'AbortError');
    const response = await fetch(`${API_BASE}/post/publish/status/fetch/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ publish_id: publishId }),
    });
    const data = (await response.json()) as PublishStatusResponse;
    if (data.data?.status === 'PUBLISH_COMPLETE') return data.data.publicaly_available_post_id;
    if (data.data?.status === 'FAILED') {
      throw new Error(`TikTok failed to process the video: ${data.data.fail_reason ?? 'unknown reason'}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  return undefined; // Still processing server-side; the app already reports it as "uploaded", TikTok finishes async.
}

export interface UploadResult {
  publishId: string;
  postUrl?: string;
}

export async function uploadVideoToAccount(
  accountId: string,
  req: Omit<UploadRequest, 'accessToken'>,
  onProgress: (bytesUploaded: number, totalBytes: number) => void,
  signal: AbortSignal,
): Promise<UploadResult> {
  const accessToken = await getValidAccessToken(accountId);

  // Re-check creator info immediately before every post, per TikTok's UX
  // guidelines, and clamp the requested privacy level to what this
  // account/app is actually allowed to use (unaudited apps are restricted
  // to SELF_ONLY regardless of what the user picked).
  const creatorInfo = await fetchCreatorInfo(accessToken);
  let privacyLevel = req.privacyLevel;
  if (!creatorInfo.privacyLevelOptions.includes(privacyLevel)) {
    logger.warn(
      `TikTok restricted this account to ${creatorInfo.privacyLevelOptions.join(', ')}; posting privately instead of "${privacyLevel}".`,
    );
    privacyLevel = creatorInfo.privacyLevelOptions[0] ?? 'SELF_ONLY';
  }

  const { publishId, uploadUrl } = await initVideoUpload({ ...req, accessToken, privacyLevel });
  await uploadChunks(uploadUrl, req.filePath, req.fileSize, onProgress, signal);
  const publishedIds = await pollPublishStatus(publishId, accessToken, signal);

  return {
    publishId,
    postUrl: publishedIds?.[0] ? `https://www.tiktok.com/@${creatorInfo.creatorUsername ?? 'me'}/video/${publishedIds[0]}` : undefined,
  };
}
