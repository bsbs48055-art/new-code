/** Applies and persists the light/dark/system theme preference to `<html data-theme>`. */

import { useCallback, useEffect, useState } from 'react';
import { settingsRepository } from '@shared/db/settingsRepository';
import type { AppSettings } from '@shared/types/index';

function resolveEffectiveTheme(theme: AppSettings['theme']): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function applyTheme(theme: AppSettings['theme']): void {
  document.documentElement.setAttribute('data-theme', resolveEffectiveTheme(theme));
}

export function useTheme(): { theme: AppSettings['theme']; setTheme: (theme: AppSettings['theme']) => void } {
  const [theme, setThemeState] = useState<AppSettings['theme']>('system');

  useEffect(() => {
    settingsRepository.get().then((settings) => {
      setThemeState(settings.theme);
      applyTheme(settings.theme);
    });

    const unsubscribeSettings = settingsRepository.onChange((settings) => {
      setThemeState(settings.theme);
      applyTheme(settings.theme);
    });

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onMediaChange = () => applyTheme(theme);
    media.addEventListener('change', onMediaChange);

    return () => {
      unsubscribeSettings?.();
      media.removeEventListener('change', onMediaChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback((next: AppSettings['theme']) => {
    setThemeState(next);
    applyTheme(next);
    void settingsRepository.update({ theme: next });
  }, []);

  return { theme, setTheme };
}
