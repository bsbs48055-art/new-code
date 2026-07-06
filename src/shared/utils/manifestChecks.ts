/** Helpers for detecting whether the developer has finished the one-time platform setup steps. */

const PLACEHOLDER_GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com';

/** True once a real Google OAuth Client ID has been placed in manifest.json (see docs/API_SETUP.md). */
export function isYouTubeClientIdConfigured(): boolean {
  const clientId = chrome.runtime.getManifest().oauth2?.client_id;
  return Boolean(clientId) && clientId !== PLACEHOLDER_GOOGLE_CLIENT_ID;
}

/** The extension's stable ID for this install — needed when registering OAuth apps with each platform. */
export function getExtensionId(): string {
  return chrome.runtime.id;
}

/** The OAuth redirect URI Facebook/TikTok apps must allow-list (`https://<extension-id>.chromiumapp.org/`). */
export function getOAuthRedirectUri(): string {
  return chrome.identity.getRedirectURL();
}
