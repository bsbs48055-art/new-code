/**
 * Lightweight, read-only account detector.
 *
 * Per the extension's core design principle, all publishing happens through
 * official APIs using tokens the user explicitly grants via OAuth — this
 * script never reads credentials, cookies, or session tokens, and never
 * automates page interactions. Its only purpose is to let the dashboard
 * show "you're currently browsing as <name> on <platform>" so users can
 * double check they're looking at the right account's tab before
 * connecting it, which is an informational convenience only.
 *
 * Runs as a classic (non-module) content script on facebook.com,
 * youtube.com, and tiktok.com per manifest.json.
 */

import { MESSAGE_TYPES } from '../shared/constants';
import type { PlatformId } from '../shared/types/index';

function detectPlatform(): PlatformId | null {
  const host = location.hostname;
  if (host.includes('youtube.com')) return 'youtube';
  if (host.includes('facebook.com')) return 'facebook';
  if (host.includes('tiktok.com')) return 'tiktok';
  return null;
}

function detectAccountLabel(platform: PlatformId): string | null {
  try {
    if (platform === 'youtube') {
      const avatarImg = document.querySelector<HTMLImageElement>(
        '#avatar-btn img, ytd-topbar-menu-button-renderer img, tp-yt-paper-icon-button#avatar-btn img',
      );
      return avatarImg?.alt || null;
    }
    if (platform === 'facebook') {
      const profileLink = document.querySelector<HTMLElement>('[aria-label="Your profile"], [data-testid="user-name-link"]');
      return profileLink?.getAttribute('aria-label') || profileLink?.textContent?.trim() || null;
    }
    if (platform === 'tiktok') {
      const avatarImg = document.querySelector<HTMLImageElement>('[data-e2e="profile-icon"] img, .avatar img');
      return avatarImg?.alt || null;
    }
  } catch {
    return null;
  }
  return null;
}

function reportDetection(): void {
  const platform = detectPlatform();
  if (!platform) return;
  const accountLabel = detectAccountLabel(platform);
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.DETECTED_ACCOUNT,
    payload: { platform, accountLabel, url: location.href },
  }).catch(() => {
    // The background worker may not be listening yet (e.g. right after install) — safe to ignore.
  });
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleReport(): void {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(reportDetection, 1500);
}

scheduleReport();
new MutationObserver(scheduleReport).observe(document.documentElement, { childList: true, subtree: true });
