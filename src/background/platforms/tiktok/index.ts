/** TikTok platform adapter — implements {@link PlatformAdapter} for the upload engine. */

import type { AnalyticsSnapshot, UploadTask } from '@shared/types/index';
import { tokenVault } from '@shared/security/tokenVault';
import type { PlatformAdapter, PlatformUploadResult, UploadProgressUpdate } from '@background/platforms/PlatformAdapter';
import { connectTikTok, disconnectTikTok } from './tiktokAuth';
import { fetchTikTokAnalytics, uploadToTikTok } from './tiktokUploader';

export const tiktokAdapter: PlatformAdapter = {
  platform: 'tiktok',

  connect: connectTikTok,
  disconnect: disconnectTikTok,
  getAuthState: () => tokenVault.getAuthState('tiktok'),

  async upload(
    task: UploadTask,
    file: Blob,
    onProgress: (update: UploadProgressUpdate) => void,
    signal: AbortSignal,
  ): Promise<PlatformUploadResult> {
    return uploadToTikTok(task, file, onProgress, signal);
  },

  async fetchAnalytics(task: UploadTask): Promise<AnalyticsSnapshot | null> {
    return fetchTikTokAnalytics(task);
  },
};
