/**
 * YouTube/Google authentication, layered on `chrome.identity.getAuthToken`.
 * Requires the developer to register an OAuth Client ID (type "Chrome
 * Extension") in Google Cloud Console and place it in `manifest.json`'s
 * `oauth2.client_id` field — see docs/API_SETUP.md.
 */

import { YOUTUBE_DATA_API_BASE } from '@shared/constants';
import type { PlatformAuthState } from '@shared/types/index';
import { tokenVault } from '@shared/security/tokenVault';
import { isYouTubeClientIdConfigured } from '@shared/utils/manifestChecks';
import { getGoogleAuthToken, revokeGoogleAuthToken } from '@background/platforms/oauth';
import type { YouTubeChannelResource } from './types';

export async function connectYouTube(): Promise<PlatformAuthState> {
  if (!isYouTubeClientIdConfigured()) {
    throw new Error(
      'YouTube is not set up yet: add your Google OAuth Client ID to manifest.json and rebuild the extension. See Settings → Platform Apps → YouTube Setup for step-by-step instructions.',
    );
  }

  let token: string;
  try {
    token = await getGoogleAuthToken(true);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Google sign-in failed: ${message}. Double-check your OAuth Client ID (type "Chrome Extension") and that this extension's ID is registered with it — see Settings → Platform Apps → YouTube Setup.`,
    );
  }
  const response = await fetch(`${YOUTUBE_DATA_API_BASE}/channels?part=snippet&mine=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Could not verify the YouTube channel (HTTP ${response.status}). Check API access in Google Cloud Console.`);
  }
  const data = (await response.json()) as { items?: YouTubeChannelResource[] };
  const channel = data.items?.[0];

  return tokenVault.saveTokens('youtube', {
    accessToken: token,
    accountLabel: channel?.snippet?.title ?? 'YouTube channel',
    accountId: channel?.id,
    scopes: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
    ],
  });
}

export async function disconnectYouTube(): Promise<void> {
  const token = await tokenVault.getAccessToken('youtube');
  if (token) await revokeGoogleAuthToken(token);
  await tokenVault.disconnect('youtube');
}

/** Returns a valid access token, transparently refreshing via Chrome's silent flow if needed. */
export async function getValidYouTubeToken(): Promise<string> {
  const cached = await tokenVault.getAccessToken('youtube');
  if (cached) {
    const check = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${cached}`);
    if (check.ok) return cached;
  }
  const refreshed = await getGoogleAuthToken(false);
  await tokenVault.saveTokens('youtube', { accessToken: refreshed });
  return refreshed;
}
