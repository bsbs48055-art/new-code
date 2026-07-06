/** Reads/writes app-wide settings from `chrome.storage.local`, with sane defaults. */

import { STORAGE_KEYS } from '@shared/constants';
import type { AppSettings } from '@shared/types/index';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  defaultMetadata: {
    privacyStatus: 'public',
    audience: 'unspecified',
  },
  notifications: {
    uploadComplete: true,
    uploadFailed: true,
    scheduleReminder: true,
  },
  uploadConcurrency: 2,
  aiProvider: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    hasApiKey: false,
  },
  platformApps: {
    helperServerUrl: 'http://localhost:8787',
  },
};

export const settingsRepository = {
  async get(): Promise<AppSettings> {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.settings);
    const saved = stored[STORAGE_KEYS.settings] as Partial<AppSettings> | undefined;
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      notifications: { ...DEFAULT_SETTINGS.notifications, ...saved?.notifications },
      aiProvider: { ...DEFAULT_SETTINGS.aiProvider, ...saved?.aiProvider },
      platformApps: { ...DEFAULT_SETTINGS.platformApps, ...saved?.platformApps },
    };
  },

  async update(patch: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.get();
    const next: AppSettings = {
      ...current,
      ...patch,
      notifications: { ...current.notifications, ...patch.notifications },
      aiProvider: { ...current.aiProvider, ...patch.aiProvider },
      defaultMetadata: { ...current.defaultMetadata, ...patch.defaultMetadata },
      platformApps: { ...current.platformApps, ...patch.platformApps },
    };
    await chrome.storage.local.set({ [STORAGE_KEYS.settings]: next });
    return next;
  },

  onChange(callback: (settings: AppSettings) => void): () => void {
    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local' || !changes[STORAGE_KEYS.settings]) return;
      callback(changes[STORAGE_KEYS.settings].newValue as AppSettings);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  },
};

const AI_API_KEY_STORAGE = 'sms_pro_ai_api_key_encrypted';

export const aiKeyStore = {
  async setApiKey(plainKey: string): Promise<void> {
    const { encryptSecret } = await import('@shared/security/crypto');
    const encrypted = await encryptSecret(plainKey);
    await chrome.storage.local.set({ [AI_API_KEY_STORAGE]: encrypted });
    await settingsRepository.update({ aiProvider: { ...(await settingsRepository.get()).aiProvider, hasApiKey: true } });
  },

  async getApiKey(): Promise<string | null> {
    const stored = await chrome.storage.local.get(AI_API_KEY_STORAGE);
    const encrypted = stored[AI_API_KEY_STORAGE] as string | undefined;
    if (!encrypted) return null;
    const { decryptSecret } = await import('@shared/security/crypto');
    return decryptSecret(encrypted);
  },

  async clearApiKey(): Promise<void> {
    await chrome.storage.local.remove(AI_API_KEY_STORAGE);
    const current = await settingsRepository.get();
    await settingsRepository.update({ aiProvider: { ...current.aiProvider, hasApiKey: false } });
  },
};
