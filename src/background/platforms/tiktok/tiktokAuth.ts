/**
 * TikTok Login Kit (OAuth 2.0 + PKCE) via `chrome.identity.launchWebAuthFlow`.
 *
 * TikTok's `/v2/oauth/token/` endpoint requires a confidential `client_secret`
 * that must never ship inside a browser extension bundle. The authorization
 * step (redirecting the user to TikTok and getting a `code` back) happens
 * entirely client-side with PKCE, but the single code→token exchange call is
 * delegated to the optional local helper server in `/server`, which keeps
 * the client secret in its own `.env` file. See docs/API_SETUP.md.
 *
 * Note: TikTok's Content Posting API requires an approved, audited app for
 * public posting; unaudited apps can only post to the developer's own
 * sandboxed TikTok account. This module implements the full, correct
 * integration against TikTok's documented API either way.
 */

import { TIKTOK_API_BASE } from '@shared/constants';
import type { PlatformAuthState } from '@shared/types/index';
import { tokenVault } from '@shared/security/tokenVault';
import { settingsRepository } from '@shared/db/settingsRepository';
import {
  generatePkcePair,
  getExtensionRedirectUrl,
  launchInteractiveAuthFlow,
  parseUrlFragmentParams,
} from '@background/platforms/oauth';
import type { TikTokTokenResponse, TikTokUserInfoResponse } from './types';

const TIKTOK_SCOPES = ['user.info.basic', 'video.upload', 'video.publish'];

async function exchangeCodeViaHelperServer(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientKey: string;
}): Promise<TikTokTokenResponse> {
  const settings = await settingsRepository.get();
  const response = await fetch(`${settings.platformApps.helperServerUrl}/oauth/tiktok/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).catch(() => {
    throw new Error(
      `Could not reach the local helper server at ${settings.platformApps.helperServerUrl}. Run "npm run server" (see docs/API_SETUP.md) then try again.`,
    );
  });
  const data = (await response.json()) as TikTokTokenResponse;
  if (!response.ok || data.error) {
    throw new Error(`TikTok token exchange failed: ${data.error_description ?? data.error ?? response.statusText}`);
  }
  return data;
}

export async function connectTikTok(): Promise<PlatformAuthState> {
  const settings = await settingsRepository.get();
  const clientKey = settings.platformApps.tiktokClientKey;
  if (!clientKey) {
    throw new Error('Add your TikTok Client Key in Settings → Platform Apps before connecting TikTok.');
  }

  const redirectUri = getExtensionRedirectUrl();
  const { verifier, challenge } = await generatePkcePair();
  const state = crypto.randomUUID();

  const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
  authUrl.searchParams.set('client_key', clientKey);
  authUrl.searchParams.set('scope', TIKTOK_SCOPES.join(','));
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  const redirectResult = await launchInteractiveAuthFlow(authUrl.toString());
  const params = parseUrlFragmentParams(redirectResult);
  const code = params.get('code');
  if (!code) {
    throw new Error(`TikTok did not return an authorization code. ${params.get('error_description') ?? ''}`.trim());
  }

  const tokenData = await exchangeCodeViaHelperServer({ code, codeVerifier: verifier, redirectUri, clientKey });

  const userInfoResponse = await fetch(
    `${TIKTOK_API_BASE}/user/info/?fields=open_id,display_name`,
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
  );
  const userInfo = (await userInfoResponse.json()) as TikTokUserInfoResponse;

  return tokenVault.saveTokens('tiktok', {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    accountLabel: userInfo.data?.user?.display_name ?? 'TikTok account',
    accountId: tokenData.open_id,
    scopes: tokenData.scope?.split(',') ?? TIKTOK_SCOPES,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
  });
}

export async function disconnectTikTok(): Promise<void> {
  await tokenVault.disconnect('tiktok');
}

export async function getValidTikTokToken(): Promise<string> {
  const state = await tokenVault.getAuthState('tiktok');
  if (!state.connected) throw new Error('TikTok is not connected.');

  if (state.expiresAt && state.expiresAt > Date.now() + 60_000) {
    const token = await tokenVault.getAccessToken('tiktok');
    if (token) return token;
  }

  const refreshToken = await tokenVault.getRefreshToken('tiktok');
  if (!refreshToken) throw new Error('Your TikTok session expired. Reconnect it from the Dashboard.');

  const settings = await settingsRepository.get();
  const response = await fetch(`${settings.platformApps.helperServerUrl}/oauth/tiktok/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken, clientKey: settings.platformApps.tiktokClientKey }),
  });
  const data = (await response.json()) as TikTokTokenResponse;
  if (!response.ok || data.error) {
    throw new Error('Failed to refresh TikTok session. Reconnect it from the Dashboard.');
  }

  await tokenVault.saveTokens('tiktok', {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accountId: state.accountId,
    accountLabel: state.accountLabel,
    scopes: state.scopes,
    expiresAt: Date.now() + data.expires_in * 1000,
  });
  return data.access_token;
}
