/** YouTube platform adapter — implements {@link PlatformAdapter} for the upload engine. */

import { YOUTUBE_DATA_API_BASE } from '@shared/constants';
import type { AnalyticsSnapshot, PlatformAuthState, UploadTask } from '@shared/types/index';
import { tokenVault } from '@shared/security/tokenVault';
import { logger } from '@shared/utils/logger';
import type { PlatformAdapter, PlatformUploadResult, UploadProgressUpdate } from '@background/platforms/PlatformAdapter';
import { connectYouTube, disconnectYouTube, getValidYouTubeToken } from './youtubeAuth';
import { fetchYouTubeAnalytics, setYouTubeThumbnail, uploadToYouTube } from './youtubeUploader';
import { getBlob } from '@shared/db/blobStore';

async function addToPlaylist(videoId: string, playlistId: string): Promise<void> {
  try {
    const token = await getValidYouTubeToken();
    await fetch(`${YOUTUBE_DATA_API_BASE}/playlistItems?part=snippet`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } } }),
    });
  } catch (error) {
    logger.warn('Failed to add uploaded video to playlist', { error: String(error) });
  }
}

export const youtubeAdapter: PlatformAdapter = {
  platform: 'youtube',

  connect: connectYouTube,
  disconnect: disconnectYouTube,
  getAuthState: () => tokenVault.getAuthState('youtube'),

  async upload(
    task: UploadTask,
    file: Blob,
    onProgress: (update: UploadProgressUpdate) => void,
    signal: AbortSignal,
  ): Promise<PlatformUploadResult> {
    const result = await uploadToYouTube(task, file, onProgress, signal);

    if (task.metadata.playlistId) {
      await addToPlaylist(result.platformContentId, task.metadata.playlistId);
    }

    if (task.thumbnail?.strategy === 'custom' && task.thumbnail.blobKey) {
      const thumbBlob = await getBlob(task.thumbnail.blobKey);
      if (thumbBlob) await setYouTubeThumbnail(result.platformContentId, thumbBlob);
    }

    return result;
  },

  async fetchAnalytics(task: UploadTask): Promise<AnalyticsSnapshot | null> {
    return fetchYouTubeAnalytics(task);
  },
};

export type { PlatformAuthState };
