/**
 * Central type definitions shared across the background service worker,
 * dashboard UI, and platform adapters. Keeping these in one module makes it
 * easy to reason about the shape of data flowing through the extension.
 */

/** The three social platforms this extension can publish to. */
export type PlatformId = 'youtube' | 'facebook' | 'tiktok';

/** The kind of media being published. */
export type MediaKind = 'video' | 'image' | 'reel' | 'short' | 'story';

/** Visibility/privacy level requested for a piece of content. */
export type PrivacyStatus = 'public' | 'unlisted' | 'private' | 'scheduled' | 'friends' | 'only_me';

/** Lifecycle states for an item in the upload queue. */
export type UploadStatus =
  | 'queued'
  | 'mapping'
  | 'uploading'
  | 'paused'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'canceled'
  | 'scheduled';

/** Where the underlying file for a task currently lives. */
export interface MediaFileRef {
  /** Original filename as selected by the user. */
  name: string;
  /** MIME type reported by the browser (best-effort). */
  mimeType: string;
  /** Size in bytes. */
  size: number;
  /** Object URL or IndexedDB blob key used to re-hydrate the File for upload. */
  blobKey: string;
  /** Relative path within an imported folder, used for duplicate detection. */
  relativePath?: string;
}

/** Best-effort technical metadata extracted from a media file client-side. */
export interface MediaProbeResult {
  durationSeconds?: number;
  width?: number;
  height?: number;
  estimatedFps?: number;
  estimatedBitrateKbps?: number;
  container?: string;
  videoCodecGuess?: string;
  audioCodecGuess?: string;
}

/** A named, reusable set of publishing defaults (e.g. "Gaming", "Shorts"). */
export interface PublishingProfile {
  id: string;
  name: string;
  description?: string;
  platforms: PlatformId[];
  defaults: ContentMetadataDefaults;
  createdAt: number;
  updatedAt: number;
}

/** Metadata defaults saved on a publishing profile and applied to new tasks. */
export interface ContentMetadataDefaults {
  titleTemplate?: string;
  descriptionTemplate?: string;
  tags?: string[];
  hashtags?: string[];
  category?: string;
  playlistId?: string;
  privacyStatus?: PrivacyStatus;
  audience?: 'made_for_kids' | 'not_made_for_kids' | 'unspecified';
  location?: string;
  language?: string;
}

/** Per-task content metadata, seeded from a profile and editable per upload. */
export interface ContentMetadata extends ContentMetadataDefaults {
  title: string;
  description: string;
}

/** Thumbnail selection strategy for a task. */
export type ThumbnailStrategy = 'custom' | 'random-from-folder' | 'platform-auto';

export interface ThumbnailSelection {
  strategy: ThumbnailStrategy;
  blobKey?: string;
}

/** Recurrence rule for scheduled uploads. */
export interface RecurrenceRule {
  frequency: 'none' | 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: number;
}

/** A single item in the bulk upload queue. */
export interface UploadTask {
  id: string;
  platform: PlatformId;
  mediaKind: MediaKind;
  file: MediaFileRef;
  probe?: MediaProbeResult;
  metadata: ContentMetadata;
  thumbnail?: ThumbnailSelection;
  status: UploadStatus;
  priority: number;
  progress: number;
  bytesUploaded: number;
  estimatedSecondsRemaining?: number;
  error?: string;
  attempt: number;
  maxAttempts: number;
  scheduledFor?: number;
  recurrence?: RecurrenceRule;
  profileId?: string;
  batchId?: string;
  duplicateOfTaskId?: string;
  platformContentId?: string;
  platformContentUrl?: string;
  /** Platform-issued resumable upload session URL/ID, persisted so pause/resume survives a service worker restart. */
  resumableSessionUrl?: string;
  /** True for sample/demo tasks inserted for UI exploration — the queue engine and scheduler must never process these. */
  isDemo?: boolean;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

/** A folder-import batch and how files inside it were auto-mapped. */
export interface FolderImportResult {
  batchId: string;
  rootName: string;
  videos: MediaFileRef[];
  images: MediaFileRef[];
  thumbnails: MediaFileRef[];
  subtitles: MediaFileRef[];
  descriptionText?: string;
  tags?: string[];
  scheduleRows?: ScheduleCsvRow[];
  metadataJson?: Record<string, unknown>;
  unmatched: MediaFileRef[];
}

export interface ScheduleCsvRow {
  fileName: string;
  publishAt: string;
  platform?: string;
  title?: string;
}

/** OAuth/token state persisted (encrypted) per platform. */
export interface PlatformAuthState {
  platform: PlatformId;
  connected: boolean;
  accountLabel?: string;
  accountId?: string;
  scopes?: string[];
  expiresAt?: number;
  encryptedToken?: string;
  encryptedRefreshToken?: string;
}

/** A single activity/log entry surfaced in the dashboard's Activity Log. */
export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
  platform?: PlatformId;
  message: string;
  taskId?: string;
}

/** App-wide user preferences. */
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  defaultImportFolderHint?: string;
  defaultMetadata: ContentMetadataDefaults;
  notifications: {
    uploadComplete: boolean;
    uploadFailed: boolean;
    scheduleReminder: boolean;
  };
  uploadConcurrency: number;
  aiProvider: {
    endpoint: string;
    model: string;
    hasApiKey: boolean;
  };
  platformApps: {
    facebookAppId?: string;
    facebookPageId?: string;
    tiktokClientKey?: string;
    helperServerUrl: string;
  };
}

/** Aggregate analytics snapshot for the dashboard's performance charts. */
export interface AnalyticsSnapshot {
  id: string;
  platform: PlatformId;
  contentId: string;
  title: string;
  capturedAt: number;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  watchTimeMinutes?: number;
  ctr?: number;
}

/** Message envelope used for typed chrome.runtime messaging. */
export interface RuntimeMessage<T = unknown> {
  type: string;
  payload?: T;
}

export const PLATFORM_LABELS: Record<PlatformId, string> = {
  youtube: 'YouTube',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};
