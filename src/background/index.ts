/**
 * Background service worker — side panel wiring, alarms for cache sync,
 * and optional Chrome notifications. No scraping. No automation bypasses.
 */

const CACHE_ALARM = 'ch_cache_maintenance';
const SYNC_ALARM = 'ch_background_sync';

chrome.runtime.onInstalled.addListener(async () => {
  if (chrome.sidePanel?.setPanelBehavior) {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  }
  await chrome.alarms.create(CACHE_ALARM, { periodInMinutes: 60 });
  await chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 30 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === CACHE_ALARM || alarm.name === SYNC_ALARM) {
    // Notify open views to prune IndexedDB cache / retry offline queue.
    chrome.runtime.sendMessage({ type: 'CH_MAINTENANCE', alarm: alarm.name }).catch(() => undefined);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'CH_NOTIFY') {
    const enabled = message.notifications !== false;
    if (enabled && chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: message.title ?? 'Content Hunter AI Pro',
        message: message.body ?? '',
      });
    }
    sendResponse({ ok: true });
    return true;
  }
  return false;
});

export {};
