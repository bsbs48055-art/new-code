import { contextBridge, ipcRenderer } from 'electron';

/**
 * Electron's sandboxed preload loader only supports CommonJS, and is
 * compiled as a standalone bundle separate from the rest of the main
 * process (see tsconfig.electron.preload.json) so that a shared ESM file
 * can't accidentally end up on its module graph. Because of that, this
 * file deliberately has ZERO imports from other project files — the IPC
 * channel names and the `ElectronApi` shape are duplicated here from
 * electron/types.ts. Keep both in sync if you add/change an IPC channel.
 */
type Unsubscribe = () => void;

interface ElectronApi {
  settings: {
    get: () => Promise<unknown>;
    setClientCredentials: (clientKey: string, clientSecret: string) => Promise<unknown>;
    update: (patch: Record<string, unknown>) => Promise<unknown>;
  };
  accounts: {
    list: () => Promise<unknown>;
    connect: () => Promise<unknown>;
    remove: (accountId: string) => Promise<void>;
    refresh: (accountId: string) => Promise<unknown>;
  };
  uploads: {
    pickVideo: () => Promise<unknown>;
    start: (payload: Record<string, unknown>) => Promise<unknown>;
    list: () => Promise<unknown>;
    cancel: (jobId: string) => Promise<void>;
    onProgress: (callback: (job: unknown) => void) => Unsubscribe;
  };
  logs: {
    list: () => Promise<unknown>;
    onNewEntry: (callback: (entry: unknown) => void) => Unsubscribe;
    clear: () => Promise<void>;
  };
  app: {
    getVersion: () => Promise<string>;
    openExternal: (url: string) => Promise<void>;
  };
}
const IPC_CHANNELS = {
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

const api: ElectronApi = {
  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.settingsGet),
    setClientCredentials: (clientKey, clientSecret) =>
      ipcRenderer.invoke(IPC_CHANNELS.settingsSetClientCredentials, clientKey, clientSecret),
    update: (patch) => ipcRenderer.invoke(IPC_CHANNELS.settingsUpdate, patch),
  },
  accounts: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.accountsList),
    connect: () => ipcRenderer.invoke(IPC_CHANNELS.accountsConnect),
    remove: (accountId) => ipcRenderer.invoke(IPC_CHANNELS.accountsRemove, accountId),
    refresh: (accountId) => ipcRenderer.invoke(IPC_CHANNELS.accountsRefresh, accountId),
  },
  uploads: {
    pickVideo: () => ipcRenderer.invoke(IPC_CHANNELS.uploadsPickVideo),
    start: (payload) => ipcRenderer.invoke(IPC_CHANNELS.uploadsStart, payload),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.uploadsList),
    cancel: (jobId) => ipcRenderer.invoke(IPC_CHANNELS.uploadsCancel, jobId),
    onProgress: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, job: Parameters<typeof callback>[0]) => callback(job);
      ipcRenderer.on(IPC_CHANNELS.uploadsProgressEvent, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.uploadsProgressEvent, listener);
    },
  },
  logs: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.logsList),
    clear: () => ipcRenderer.invoke(IPC_CHANNELS.logsClear),
    onNewEntry: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, entry: Parameters<typeof callback>[0]) => callback(entry);
      ipcRenderer.on(IPC_CHANNELS.logsNewEntryEvent, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.logsNewEntryEvent, listener);
    },
  },
  app: {
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.appGetVersion),
    openExternal: (url) => ipcRenderer.invoke(IPC_CHANNELS.appOpenExternal, url),
  },
};

contextBridge.exposeInMainWorld('api', api);
