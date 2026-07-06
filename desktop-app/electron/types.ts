/**
 * Shared type contracts between the Electron main process and the React
 * renderer (dashboard UI). Kept dependency-free so this file can be
 * imported from both the Node (main/preload) and browser (renderer) worlds.
 */

export type UploadStatus = 'queued' | 'uploading' | 'processing' | 'success' | 'failed' | 'canceled';

export type PrivacyLevel = 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY';

export interface TikTokAccount {
  id: string;
  displayName: string;
  avatarUrl?: string;
  openId: string;
  connectedAt: number;
  tokenExpiresAt: number;
  scopes: string[];
  /** Populated from /creator_info/query/ so the UI can only offer privacy levels TikTok will actually accept. */
  availablePrivacyLevels?: PrivacyLevel[];
  isUnaudited?: boolean;
}

export interface AppSettings {
  tiktokClientKey: string;
  hasTikTokClientSecret: boolean;
  oauthRedirectPort: number;
  delayBetweenAccountsSeconds: number;
  theme: 'dark' | 'light' | 'system';
}

export interface UploadJobTarget {
  accountId: string;
  accountName: string;
  status: UploadStatus;
  progress: number;
  publishId?: string;
  error?: string;
  postUrl?: string;
}

export interface UploadJob {
  id: string;
  videoPath: string;
  videoFileName: string;
  fileSizeBytes: number;
  title: string;
  privacyLevel: PrivacyLevel;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  createdAt: number;
  targets: UploadJobTarget[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  detail?: string;
}

export interface ConnectAccountResult {
  ok: boolean;
  account?: TikTokAccount;
  error?: string;
}

export interface StartUploadPayload {
  videoPath: string;
  title: string;
  privacyLevel: PrivacyLevel;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  accountIds: string[];
}

export interface PickVideoResult {
  canceled: boolean;
  path?: string;
  fileName?: string;
  sizeBytes?: number;
}

/** The full API surface exposed to the renderer via `contextBridge` in preload.ts. */
export interface ElectronApi {
  settings: {
    get: () => Promise<AppSettings>;
    setClientCredentials: (clientKey: string, clientSecret: string) => Promise<AppSettings>;
    update: (patch: Partial<Pick<AppSettings, 'delayBetweenAccountsSeconds' | 'theme' | 'oauthRedirectPort'>>) => Promise<AppSettings>;
  };
  accounts: {
    list: () => Promise<TikTokAccount[]>;
    connect: () => Promise<ConnectAccountResult>;
    remove: (accountId: string) => Promise<void>;
    refresh: (accountId: string) => Promise<ConnectAccountResult>;
  };
  uploads: {
    pickVideo: () => Promise<PickVideoResult>;
    start: (payload: StartUploadPayload) => Promise<UploadJob>;
    list: () => Promise<UploadJob[]>;
    cancel: (jobId: string) => Promise<void>;
    onProgress: (callback: (job: UploadJob) => void) => () => void;
  };
  logs: {
    list: () => Promise<LogEntry[]>;
    onNewEntry: (callback: (entry: LogEntry) => void) => () => void;
    clear: () => Promise<void>;
  };
  app: {
    getVersion: () => Promise<string>;
    openExternal: (url: string) => Promise<void>;
  };
}

export const IPC_CHANNELS = {
  settingsGet: 'settings:get',
  settingsSetClientCredentials: 'settings:setClientCredentials',
  settingsUpdate: 'settings:update',
  accountsList: 'accounts:list',
  accountsConnect: 'accounts:connect',
  accountsRemove: 'accounts:remove',
  accountsRefresh: 'accounts:refresh',
  uploadsPickVideo: 'uploads:pickVideo',
  uploadsStart: 'uploads:start',
  uploadsList: 'uploads:list',
  uploadsCancel: 'uploads:cancel',
  uploadsProgressEvent: 'uploads:progressEvent',
  logsList: 'logs:list',
  logsClear: 'logs:clear',
  logsNewEntryEvent: 'logs:newEntryEvent',
  appGetVersion: 'app:getVersion',
  appOpenExternal: 'app:openExternal',
} as const;
