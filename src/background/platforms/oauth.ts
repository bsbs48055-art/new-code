/**
 * OAuth helpers built on `chrome.identity`. Two flows are used:
 *
 *  - Google/YouTube uses `chrome.identity.getAuthToken`, which relies on the
 *    `oauth2` key in manifest.json and Chrome's built-in account chooser —
 *    no redirect URI or client secret handling needed on our side.
 *  - Facebook and TikTok use `chrome.identity.launchWebAuthFlow` against
 *    each platform's own OAuth dialog, with PKCE (for TikTok) so no client
 *    secret needs to live in the extension bundle for the authorization
 *    step itself. Where a platform's token endpoint mandates a client
 *    secret (TikTok's code exchange, Facebook's long-lived token exchange),
 *    we delegate that single call to the optional local helper server
 *    (see `/server`) so the secret never ships inside the extension.
 */

import { logger } from '@shared/utils/logger';

export function getExtensionRedirectUrl(): string {
  return chrome.identity.getRedirectURL();
}

/** Generates a PKCE code_verifier + S256 code_challenge pair. */
export async function generatePkcePair(): Promise<{ verifier: string; challenge: string }> {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64UrlEncode(randomBytes);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = base64UrlEncode(new Uint8Array(digest));
  return { verifier, challenge };
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Launches an interactive OAuth dialog and returns the full redirect URL Chrome received back. */
export async function launchInteractiveAuthFlow(authUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (redirectUrl) => {
      if (chrome.runtime.lastError || !redirectUrl) {
        const message = chrome.runtime.lastError?.message ?? 'Authentication was canceled or failed.';
        logger.warn('OAuth flow did not complete', { message });
        reject(new Error(message));
        return;
      }
      resolve(redirectUrl);
    });
  });
}

/** Requests a Google OAuth access token using the extension's manifest.json `oauth2` configuration. */
export async function getGoogleAuthToken(interactive: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message ?? 'Google sign-in failed.'));
        return;
      }
      resolve(typeof token === 'string' ? token : (token as unknown as { token: string }).token);
    });
  });
}

/** Revokes a cached Google auth token so the next connect() prompts for a fresh account/consent. */
export async function revokeGoogleAuthToken(token: string): Promise<void> {
  await new Promise<void>((resolve) => chrome.identity.removeCachedAuthToken({ token }, () => resolve()));
  try {
    await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${encodeURIComponent(token)}`);
  } catch (error) {
    logger.warn('Failed to revoke Google token server-side (local cache was still cleared)', {
      error: String(error),
    });
  }
}

export function parseUrlFragmentParams(url: string): URLSearchParams {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const start = hashIndex !== -1 ? hashIndex + 1 : queryIndex !== -1 ? queryIndex + 1 : url.length;
  return new URLSearchParams(url.slice(start));
}
