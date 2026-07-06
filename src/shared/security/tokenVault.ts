/**
 * High-level API for reading/writing per-platform authentication state.
 * OAuth access/refresh tokens are encrypted before ever touching
 * `chrome.storage.local`; every other field (connection status, account
 * label, scopes, expiry) is stored in plaintext since it is not sensitive.
 */

import { STORAGE_KEYS } from '@shared/constants';
import type { PlatformAuthState, PlatformId } from '@shared/types/index';
import { decryptSecret, encryptSecret } from '@shared/security/crypto';

type AuthStateMap = Partial<Record<PlatformId, PlatformAuthState>>;

async function readAll(): Promise<AuthStateMap> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.authState);
  return (stored[STORAGE_KEYS.authState] as AuthStateMap) ?? {};
}

async function writeAll(map: AuthStateMap): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.authState]: map });
}

export const tokenVault = {
  async getAuthState(platform: PlatformId): Promise<PlatformAuthState> {
    const all = await readAll();
    return all[platform] ?? { platform, connected: false };
  },

  async getAllAuthStates(): Promise<PlatformAuthState[]> {
    const all = await readAll();
    const platforms: PlatformId[] = ['youtube', 'facebook', 'tiktok'];
    return platforms.map((platform) => all[platform] ?? { platform, connected: false });
  },

  /** Saves connection metadata plus an encrypted access/refresh token pair. */
  async saveTokens(
    platform: PlatformId,
    fields: {
      accessToken: string;
      refreshToken?: string;
      accountLabel?: string;
      accountId?: string;
      scopes?: string[];
      expiresAt?: number;
    },
  ): Promise<PlatformAuthState> {
    const all = await readAll();
    const encryptedToken = await encryptSecret(fields.accessToken);
    const encryptedRefreshToken = fields.refreshToken ? await encryptSecret(fields.refreshToken) : undefined;
    const state: PlatformAuthState = {
      platform,
      connected: true,
      accountLabel: fields.accountLabel,
      accountId: fields.accountId,
      scopes: fields.scopes,
      expiresAt: fields.expiresAt,
      encryptedToken,
      encryptedRefreshToken,
    };
    all[platform] = state;
    await writeAll(all);
    return state;
  },

  async getAccessToken(platform: PlatformId): Promise<string | null> {
    const state = await this.getAuthState(platform);
    if (!state.encryptedToken) return null;
    return decryptSecret(state.encryptedToken);
  },

  async getRefreshToken(platform: PlatformId): Promise<string | null> {
    const state = await this.getAuthState(platform);
    if (!state.encryptedRefreshToken) return null;
    return decryptSecret(state.encryptedRefreshToken);
  },

  async disconnect(platform: PlatformId): Promise<void> {
    const all = await readAll();
    delete all[platform];
    await writeAll(all);
  },
};
