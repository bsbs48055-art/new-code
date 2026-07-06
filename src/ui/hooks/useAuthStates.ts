/** Reactive hook exposing per-platform connection state, backed by `chrome.storage.local`. */

import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@shared/constants';
import { tokenVault } from '@shared/security/tokenVault';
import type { PlatformAuthState } from '@shared/types/index';

export function useAuthStates(): PlatformAuthState[] {
  const [states, setStates] = useState<PlatformAuthState[]>([]);

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      tokenVault.getAllAuthStates().then((next) => {
        if (mounted) setStates(next);
      });
    };
    refresh();

    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes[STORAGE_KEYS.authState]) refresh();
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      mounted = false;
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  return states;
}
