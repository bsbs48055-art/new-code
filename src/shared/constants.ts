/** App-wide constants shared between the background worker and dashboard UI. */

export const APP_NAME = 'Social Media Studio Pro';

export const DB_NAME = 'sms_pro_db';
export const DB_VERSION = 1;

/** Chrome Alarms API names. */
export const ALARM_QUEUE_TICK = 'sms-pro:queue-tick';
export const ALARM_SCHEDULE_PREFIX = 'sms-pro:schedule:';
export const ALARM_TOKEN_REFRESH_TICK = 'sms-pro:token-refresh-tick';

/** chrome.storage.local keys for lightweight, frequently-read settings. */
export const STORAGE_KEYS = {
  settings: 'sms_pro_settings',
  authState: 'sms_pro_auth_state',
  cryptoKey: 'sms_pro_crypto_key',
} as const;

/** Runtime message type identifiers used across chrome.runtime.sendMessage. */
export const MESSAGE_TYPES = {
  ENQUEUE_TASKS: 'ENQUEUE_TASKS',
  PAUSE_TASK: 'PAUSE_TASK',
  RESUME_TASK: 'RESUME_TASK',
  CANCEL_TASK: 'CANCEL_TASK',
  RETRY_TASK: 'RETRY_TASK',
  REORDER_TASK: 'REORDER_TASK',
  QUEUE_UPDATED: 'QUEUE_UPDATED',
  ACTIVITY_APPENDED: 'ACTIVITY_APPENDED',
  CONNECT_PLATFORM: 'CONNECT_PLATFORM',
  DISCONNECT_PLATFORM: 'DISCONNECT_PLATFORM',
  AUTH_STATE_UPDATED: 'AUTH_STATE_UPDATED',
  FETCH_ANALYTICS: 'FETCH_ANALYTICS',
  DETECTED_ACCOUNT: 'DETECTED_ACCOUNT',
  RUN_SCHEDULER_TICK: 'RUN_SCHEDULER_TICK',
} as const;

export const DEFAULT_UPLOAD_CONCURRENCY = 2;
export const DEFAULT_MAX_ATTEMPTS = 3;
export const QUEUE_TICK_PERIOD_MINUTES = 1; // Chrome's minimum granularity for repeating alarms; acts as a safety-net poll on top of event-driven ticks.

export const YOUTUBE_API_BASE = 'https://www.googleapis.com/upload/youtube/v3';
export const YOUTUBE_DATA_API_BASE = 'https://www.googleapis.com/youtube/v3';
export const YOUTUBE_ANALYTICS_API_BASE = 'https://youtubeanalytics.googleapis.com/v2';

export const FACEBOOK_GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

export const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

export const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
export const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
export const SUPPORTED_SUBTITLE_EXTENSIONS = ['.srt', '.vtt'];
