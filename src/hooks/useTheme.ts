import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store';

/** Resolve theme and apply `.dark` class on documentElement. */
export function useTheme() {
  const theme = useSettingsStore((s) => s.settings.theme);
  const update = useSettingsStore((s) => s.update);
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const next = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      setResolved(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return {
    theme,
    resolved,
    setTheme: (value: 'light' | 'dark' | 'system') => update({ theme: value }),
  };
}
