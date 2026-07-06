/** Facebook platform adapter — implements {@link PlatformAdapter} for the upload engine. */

import type { AnalyticsSnapshot, UploadTask } from '@shared/types/index';
import { tokenVault } from '@shared/security/tokenVault';
import type { PlatformAdapter, PlatformUploadResult, UploadProgressUpdate } from '@background/platforms/PlatformAdapter';
import { connectFacebook, disconnectFacebook } from './facebookAuth';
import { fetchFacebookAnalytics, uploadToFacebook } from './facebookUploader';

export const facebookAdapter: PlatformAdapter = {
  platform: 'facebook',

  connect: connectFacebook,
  disconnect: disconnectFacebook,
  getAuthState: () => tokenVault.getAuthState('facebook'),

  async upload(
    task: UploadTask,
    file: Blob,
    onProgress: (update: UploadProgressUpdate) => void,
    signal: AbortSignal,
  ): Promise<PlatformUploadResult> {
    return uploadToFacebook(task, file, onProgress, signal);
  },

  async fetchAnalytics(task: UploadTask): Promise<AnalyticsSnapshot | null> {
    return fetchFacebookAnalytics(task);
  },
};
