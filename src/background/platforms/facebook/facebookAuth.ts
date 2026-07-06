/**
 * Facebook Login (OAuth) via `chrome.identity.launchWebAuthFlow`, using the
 * implicit grant (`response_type=token`) so no client secret is ever needed
 * inside the extension for the authorization step itself. Requires a
 * Facebook App ID configured in Settings — see docs/API_SETUP.md.
 *
 * After login we resolve the user's Pages (`/me/accounts`) and store the
 * selected Page's access token, since publishing to a Facebook Page (rather
 * than a personal profile) is the supported, officially-sanctioned way to
 * post video/photo content via the Graph API.
 */

import { FACEBOOK_GRAPH_API_BASE } from '@shared/constants';
import type { PlatformAuthState } from '@shared/types/index';
import { tokenVault } from '@shared/security/tokenVault';
import { settingsRepository } from '@shared/db/settingsRepository';
import { getExtensionRedirectUrl, launchInteractiveAuthFlow, parseUrlFragmentParams } from '@background/platforms/oauth';
import type { FacebookPagesResponse } from './types';

const FACEBOOK_SCOPES = ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement', 'publish_video'];

export async function connectFacebook(): Promise<PlatformAuthState> {
  const settings = await settingsRepository.get();
  const appId = settings.platformApps.facebookAppId;
  if (!appId) {
    throw new Error('Add your Facebook App ID in Settings → Platform Apps before connecting Facebook.');
  }

  const redirectUri = getExtensionRedirectUrl();
  const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', FACEBOOK_SCOPES.join(','));

  const redirectResult = await launchInteractiveAuthFlow(authUrl.toString());
  const params = parseUrlFragmentParams(redirectResult);
  const shortLivedToken = params.get('access_token');
  if (!shortLivedToken) {
    throw new Error(`Facebook did not return an access token. ${params.get('error_description') ?? ''}`.trim());
  }

  const userAccessToken = await tryExchangeForLongLivedToken(shortLivedToken, appId, settings.platformApps.helperServerUrl);

  const pagesResponse = await fetch(
    `${FACEBOOK_GRAPH_API_BASE}/me/accounts?access_token=${encodeURIComponent(userAccessToken)}`,
  );
  if (!pagesResponse.ok) {
    throw new Error(`Could not list your Facebook Pages (HTTP ${pagesResponse.status}). Verify app permissions/review status.`);
  }
  const pagesData = (await pagesResponse.json()) as FacebookPagesResponse;
  if (!pagesData.data || pagesData.data.length === 0) {
    throw new Error('No Facebook Pages found for this account. You must manage at least one Page to publish content.');
  }

  const preferredPageId = settings.platformApps.facebookPageId;
  const page = pagesData.data.find((p) => p.id === preferredPageId) ?? pagesData.data[0];

  const wasExchanged = userAccessToken !== shortLivedToken;

  return tokenVault.saveTokens('facebook', {
    accessToken: page.access_token,
    accountLabel: page.name,
    accountId: page.id,
    scopes: FACEBOOK_SCOPES,
    // Page tokens derived from a long-lived (exchanged) user token are valid
    // ~60 days; otherwise the short-lived user token expires in ~1-2 hours.
    expiresAt: Date.now() + (wasExchanged ? 1000 * 60 * 60 * 24 * 55 : 1000 * 60 * 60),
  });
}

/**
 * Attempts to trade a short-lived user token for a long-lived one via the
 * local helper server (requires `FACEBOOK_APP_SECRET` in `server/.env`).
 * Falls back to the short-lived token if the helper server isn't running —
 * the connection will simply need to be refreshed sooner.
 */
async function tryExchangeForLongLivedToken(shortLivedToken: string, appId: string, helperServerUrl: string): Promise<string> {
  try {
    const response = await fetch(`${helperServerUrl}/oauth/facebook/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortLivedToken, appId }),
    });
    if (!response.ok) return shortLivedToken;
    const data = (await response.json()) as { access_token?: string };
    return data.access_token ?? shortLivedToken;
  } catch {
    return shortLivedToken;
  }
}

export async function disconnectFacebook(): Promise<void> {
  await tokenVault.disconnect('facebook');
}

export async function getValidFacebookToken(): Promise<string> {
  const state = await tokenVault.getAuthState('facebook');
  if (!state.connected || (state.expiresAt && state.expiresAt < Date.now())) {
    throw new Error('Your Facebook connection has expired. Reconnect it from the Dashboard.');
  }
  const token = await tokenVault.getAccessToken('facebook');
  if (!token) throw new Error('Facebook is not connected.');
  return token;
}

export async function getConnectedPageId(): Promise<string> {
  const state = await tokenVault.getAuthState('facebook');
  if (!state.accountId) throw new Error('Facebook is not connected.');
  return state.accountId;
}
