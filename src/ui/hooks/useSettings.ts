/** Reactive hook exposing app settings, backed by `chrome.storage.local`. */

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, settingsRepository } from '@shared/db/settingsRepository';
import type { AppSettings } from '@shared/types/index';

export function useSettings(): {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  loaded: boolean;
} {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    settingsRepository.get().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
    return settingsRepository.onChange(setSettings);
  }, []);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = await settingsRepository.update(patch);
    setSettings(next);
  }, []);

  return { settings, updateSettings, loaded };
}
