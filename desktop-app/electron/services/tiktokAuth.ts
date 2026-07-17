import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { shell } from 'electron';
import { secureStore } from './secureStore.js';
import { waitForOAuthRedirect } from './oauthServer.js';
import { logger } from './logger.js';
import type { PrivacyLevel } from '../types.js';

/**
 * TikTok "Login Kit for Desktop" + Content Posting API integration.
 * https://developers.tiktok.com/doc/login-kit-desktop/
 * https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
 *
 * Unlike the web Login Kit (which mandates an https redirect_uri), TikTok's
 * desktop flow explicitly documents loopback redirect URIs
 * (http://127.0.0.1:<port>/callback/) and requires PKCE with a *hex*-encoded
 * SHA-256 code_challenge (not the base64url encoding used by the generic
 * OAuth PKCE spec / TikTok's web flow) — see the desktop guide above.
 *
 * The authorization step always opens the user's real system browser
 * (`shell.openExternal`) so credentials are entered directly on
 * tiktok.com — this app never sees the user's TikTok password, and never
 * embeds TikTok's login page inside an app-controlled webview.
 */

const AUTH_BASE = 'https://www.tiktok.com/v2/auth/authorize/';
const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const API_BASE = 'https://open.tiktokapis.com/v2';
const SCOPES = ['user.info.basic', 'video.publish', 'video.upload'];

function generateCodeVerifier(): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const bytes = randomBytes(96);
  let out = '';
  for (let i = 0; i < 96; i += 1) out += charset[bytes[i] % charset.length];
  return out; // 96 chars, within TikTok's documented 43-128 range.
}

function codeChallengeFromVerifier(verifier: string): string {
  // TikTok desktop docs: "You must use hex encoding of SHA256 to generate
  // the code challenge from the code verifier."
  return createHash('sha256').update(verifier).digest('hex');
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  open_id: string;
  scope: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  error?: string;
  error_description?: string;
}

interface UserInfoResponse {
  data?: { user?: { open_id: string; display_name: string; avatar_url?: string } };
  error?: { code: string; message: string };
}

export interface CreatorInfo {
  creatorUsername?: string;
  creatorNickname?: string;
  creatorAvatarUrl?: string;
  privacyLevelOptions: PrivacyLevel[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxVideoPostDurationSec?: number;
}

interface CreatorInfoResponse {
  data?: {
    creator_username?: string;
    creator_nickname?: string;
    creator_avatar_url?: string;
    privacy_level_options?: PrivacyLevel[];
    comment_disabled?: boolean;
    duet_disabled?: boolean;
    stitch_disabled?: boolean;
    max_video_post_duration_sec?: number;
  };
  error?: { code: string; message: string };
}

function redirectUri(port: number): string {
  return `http://127.0.0.1:${port}/callback/`;
}

export interface AuthorizedSession {
  accessToken: string;
  refreshToken: string;
  openId: string;
  scopes: string[];
  expiresAt: number;
}

/** Runs the full interactive authorization-code + PKCE flow and returns the resulting tokens. */
export async function runInteractiveAuthorization(): Promise<AuthorizedSession> {
  const settings = secureStore.getSettings();
  const clientSecret = secureStore.getTikTokClientSecret();
  if (!settings.tiktokClientKey || !clientSecret) {
    throw new Error('Add your TikTok Client Key and Client Secret in Settings before connecting an account.');
  }

  const port = settings.oauthRedirectPort;
  const verifier = generateCodeVerifier();
  const challenge = codeChallengeFromVerifier(verifier);
  const state = randomUUID();

  const authUrl = new URL(AUTH_BASE);
  authUrl.searchParams.set('client_key', settings.tiktokClientKey);
  authUrl.searchParams.set('scope', SCOPES.join(','));
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri(port));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  logger.info('Opening system browser for TikTok sign-in…');
  const redirectPromise = waitForOAuthRedirect(port, state);
  await shell.openExternal(authUrl.toString());

  const result = await redirectPromise;
  if (result.error || !result.code) {
    throw new Error(result.errorDescription || result.error || 'TikTok did not return an authorization code.');
  }

  return exchangeCodeForTokens(result.code, verifier, port, settings.tiktokClientKey, clientSecret);
}

async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  port: number,
  clientKey: string,
  clientSecret: string,
): Promise<AuthorizedSession> {
  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri(port),
    code_verifier: codeVerifier,
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  });
  const data = (await response.json()) as TokenResponse;
  if (!response.ok || data.error) {
    throw new Error(`TikTok token exchange failed: ${data.error_description ?? data.error ?? response.statusText}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    openId: data.open_id,
    scopes: data.scope ? data.scope.split(',') : SCOPES,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function refreshTokens(refreshToken: string): Promise<AuthorizedSession> {
  const settings = secureStore.getSettings();
  const clientSecret = secureStore.getTikTokClientSecret();
  const body = new URLSearchParams({
    client_key: settings.tiktokClientKey,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  });
  const data = (await response.json()) as TokenResponse;
  if (!response.ok || data.error) {
    throw new Error(`Failed to refresh TikTok session: ${data.error_description ?? data.error ?? response.statusText}`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    openId: data.open_id,
    scopes: data.scope ? data.scope.split(',') : SCOPES,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function fetchUserInfo(accessToken: string): Promise<{ openId: string; displayName: string; avatarUrl?: string }> {
  const response = await fetch(`${API_BASE}/user/info/?fields=open_id,display_name,avatar_url`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await response.json()) as UserInfoResponse;
  if (!response.ok || data.error?.code === 'error' || !data.data?.user) {
    throw new Error(data.error?.message || 'Failed to fetch TikTok account info.');
  }
  return {
    openId: data.data.user.open_id,
    displayName: data.data.user.display_name,
    avatarUrl: data.data.user.avatar_url,
  };
}

/**
 * Per TikTok's UX guidelines, apps must query `/creator_info/query/` before
 * showing publish options, and only offer the privacy levels it returns —
 * unaudited apps will only see `SELF_ONLY` here, which is what forces every
 * post from this app to stay private until the developer's TikTok app
 * passes an audit. See docs/API_SETUP.md.
 */
export async function fetchCreatorInfo(accessToken: string): Promise<CreatorInfo> {
  const response = await fetch(`${API_BASE}/post/publish/creator_info/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
  });
  const data = (await response.json()) as CreatorInfoResponse;
  if (!response.ok || data.error?.code !== 'ok') {
    throw new Error(data.error?.message || 'Failed to fetch TikTok creator info.');
  }
  return {
    creatorUsername: data.data?.creator_username,
    creatorNickname: data.data?.creator_nickname,
    creatorAvatarUrl: data.data?.creator_avatar_url,
    privacyLevelOptions: data.data?.privacy_level_options ?? ['SELF_ONLY'],
    commentDisabled: Boolean(data.data?.comment_disabled),
    duetDisabled: Boolean(data.data?.duet_disabled),
    stitchDisabled: Boolean(data.data?.stitch_disabled),
    maxVideoPostDurationSec: data.data?.max_video_post_duration_sec,
  };
}

/** Returns a valid (non-expired) access token for an account, refreshing it first if needed. */
export async function getValidAccessToken(accountId: string): Promise<string> {
  const account = secureStore.getAccount(accountId);
  const secrets = secureStore.getAccountSecrets(accountId);
  if (!account || !secrets) throw new Error('This TikTok account is no longer connected.');

  if (account.tokenExpiresAt > Date.now() + 60_000) {
    return secrets.accessToken;
  }

  logger.info(`Refreshing TikTok session for ${account.displayName}…`);
  const refreshed = await refreshTokens(secrets.refreshToken);
  await secureStore.saveAccount(
    { ...account, tokenExpiresAt: refreshed.expiresAt, scopes: refreshed.scopes },
    { accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken },
  );
  return refreshed.accessToken;
}
