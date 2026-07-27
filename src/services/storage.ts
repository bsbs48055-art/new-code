import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/utils/constants';

const SETTINGS_KEY = 'ch_settings';
const SECURE_KEYS = 'ch_secure_keys';

/** Chrome Storage settings with localStorage fallback for non-extension contexts. */
export async function loadSettings(): Promise<AppSettings> {
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    const result = await chrome.storage.sync.get(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] as Partial<AppSettings> | undefined) };
  }
  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
    return;
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export interface SecureKeyBag {
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseAppId?: string;
}

/** Client-side Firebase config only — server secrets stay on the Express backend. */
export async function loadSecureKeys(): Promise<SecureKeyBag> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const result = await chrome.storage.local.get(SECURE_KEYS);
    return (result[SECURE_KEYS] as SecureKeyBag) ?? {};
  }
  const raw = localStorage.getItem(SECURE_KEYS);
  return raw ? JSON.parse(raw) : {};
}

export async function saveSecureKeys(keys: SecureKeyBag): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [SECURE_KEYS]: keys });
    return;
  }
  localStorage.setItem(SECURE_KEYS, JSON.stringify(keys));
}
