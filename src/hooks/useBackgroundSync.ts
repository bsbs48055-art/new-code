import { useEffect } from 'react';
import { clearExpiredCache, db } from '@/services/db';
import { apiRequest } from '@/api/client';

/**
 * Listen for background maintenance alarms and flush a simple offline queue
 * when connectivity returns.
 */
export function useBackgroundSync() {
  useEffect(() => {
    const onMessage = (message: { type?: string }) => {
      if (message?.type === 'CH_MAINTENANCE') {
        void clearExpiredCache();
        void flushOfflineQueue();
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(onMessage);
    }

    const onOnline = () => {
      void flushOfflineQueue();
    };
    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('online', onOnline);
      if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(onMessage);
      }
    };
  }, []);
}

async function flushOfflineQueue() {
  const items = await db.offlineQueue.orderBy('createdAt').toArray();
  for (const item of items) {
    try {
      await apiRequest(item.path, { method: item.method, body: item.body });
      await db.offlineQueue.delete(item.id);
    } catch {
      break;
    }
  }
}
