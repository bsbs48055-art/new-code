import { create } from 'zustand';
import type { AppSettings, LogEntry, TikTokAccount, UploadJob } from '../../electron/types';

interface AppState {
  accounts: TikTokAccount[];
  uploadJobs: UploadJob[];
  logs: LogEntry[];
  settings: AppSettings | null;
  loading: boolean;
  connectingAccount: boolean;
  initialized: boolean;

  init: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
  connectAccount: () => Promise<{ ok: boolean; error?: string }>;
  removeAccount: (accountId: string) => Promise<void>;
  refreshAccountStatus: (accountId: string) => Promise<void>;
  refreshUploadJobs: () => Promise<void>;
  saveClientCredentials: (clientKey: string, clientSecret: string) => Promise<void>;
  updateSettings: (patch: Partial<Pick<AppSettings, 'delayBetweenAccountsSeconds' | 'theme' | 'oauthRedirectPort'>>) => Promise<void>;
  clearLogs: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  accounts: [],
  uploadJobs: [],
  logs: [],
  settings: null,
  loading: true,
  connectingAccount: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    const [accounts, uploadJobs, logs, settings] = await Promise.all([
      window.api.accounts.list(),
      window.api.uploads.list(),
      window.api.logs.list(),
      window.api.settings.get(),
    ]);
    set({ accounts, uploadJobs, logs, settings, loading: false, initialized: true });

    window.api.uploads.onProgress((job) => {
      set((state) => {
        const existingIndex = state.uploadJobs.findIndex((j) => j.id === job.id);
        const next = [...state.uploadJobs];
        if (existingIndex >= 0) next[existingIndex] = job;
        else next.unshift(job);
        return { uploadJobs: next };
      });
    });

    window.api.logs.onNewEntry((entry) => {
      set((state) => ({ logs: [entry, ...state.logs].slice(0, 500) }));
    });
  },

  refreshAccounts: async () => {
    const accounts = await window.api.accounts.list();
    set({ accounts });
  },

  connectAccount: async () => {
    set({ connectingAccount: true });
    try {
      const result = await window.api.accounts.connect();
      if (result.ok) await get().refreshAccounts();
      return result;
    } finally {
      set({ connectingAccount: false });
    }
  },

  removeAccount: async (accountId) => {
    await window.api.accounts.remove(accountId);
    await get().refreshAccounts();
  },

  refreshAccountStatus: async (accountId) => {
    await window.api.accounts.refresh(accountId);
    await get().refreshAccounts();
  },

  refreshUploadJobs: async () => {
    const uploadJobs = await window.api.uploads.list();
    set({ uploadJobs });
  },

  saveClientCredentials: async (clientKey, clientSecret) => {
    const settings = await window.api.settings.setClientCredentials(clientKey, clientSecret);
    set({ settings });
  },

  updateSettings: async (patch) => {
    const settings = await window.api.settings.update(patch);
    set({ settings });
  },

  clearLogs: async () => {
    await window.api.logs.clear();
    set({ logs: [] });
  },
}));
