/**
 * Common contract every platform module (YouTube, Facebook, TikTok)
 * implements. The upload engine is written entirely against this interface,
 * so adding a new platform never requires touching queue/scheduling logic.
 */

import type { AnalyticsSnapshot, PlatformAuthState, PlatformId, UploadTask } from '@shared/types/index';

export interface UploadProgressUpdate {
  bytesUploaded: number;
  totalBytes: number;
}

export interface PlatformUploadResult {
  platformContentId: string;
  platformContentUrl?: string;
}

/** Thrown by adapters for errors that should NOT be retried (e.g. invalid credentials, quota exceeded permanently). */
export class NonRetryableUploadError extends Error {}

export interface PlatformAdapter {
  readonly platform: PlatformId;

  /** Initiates the official OAuth flow for this platform via `chrome.identity`. */
  connect(): Promise<PlatformAuthState>;

  /** Revokes/clears locally stored credentials for this platform. */
  disconnect(): Promise<void>;

  /** Returns current (possibly refreshed) auth state without prompting the user. */
  getAuthState(): Promise<PlatformAuthState>;

  /** Uploads a single task's media + metadata, reporting progress as it goes. */
  upload(
    task: UploadTask,
    file: Blob,
    onProgress: (update: UploadProgressUpdate) => void,
    signal: AbortSignal,
  ): Promise<PlatformUploadResult>;

  /** Fetches recent performance analytics for previously published content. */
  fetchAnalytics(task: UploadTask): Promise<AnalyticsSnapshot | null>;
}
