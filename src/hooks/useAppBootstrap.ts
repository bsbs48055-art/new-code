import { useEffect } from 'react';
import { useAuthStore, useSettingsStore } from '@/store';
import { subscribeAuth } from '@/firebase/auth';
import { clearExpiredCache } from '@/services/db';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';

/** Boot settings, auth subscription, and cache maintenance. */
export function useAppBootstrap() {
  const load = useSettingsStore((s) => s.load);
  const loaded = useSettingsStore((s) => s.loaded);
  const setUser = useAuthStore((s) => s.setUser);
  useBackgroundSync();

  useEffect(() => {
    void load();
    void clearExpiredCache();
  }, [load]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    void subscribeAuth(setUser).then((fn) => {
      unsub = fn;
    });
    return () => unsub?.();
  }, [setUser]);

  return { loaded };
}
