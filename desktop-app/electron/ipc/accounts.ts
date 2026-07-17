import { ipcMain } from 'electron';
import { randomUUID } from 'node:crypto';
import { secureStore } from '../services/secureStore.js';
import { logger } from '../services/logger.js';
import { runInteractiveAuthorization, fetchUserInfo, fetchCreatorInfo, getValidAccessToken } from '../services/tiktokAuth.js';
import { IPC_CHANNELS, type ConnectAccountResult, type TikTokAccount } from '../types.js';

export function registerAccountsIpc(): void {
  ipcMain.handle(IPC_CHANNELS.accountsList, async () => secureStore.listAccounts());

  ipcMain.handle(IPC_CHANNELS.accountsConnect, async (): Promise<ConnectAccountResult> => {
    try {
      const session = await runInteractiveAuthorization();
      const userInfo = await fetchUserInfo(session.accessToken);
      const creatorInfo = await fetchCreatorInfo(session.accessToken);

      const existing = secureStore.listAccounts().find((a) => a.openId === session.openId);
      const account: TikTokAccount = {
        id: existing?.id ?? randomUUID(),
        displayName: userInfo.displayName,
        avatarUrl: userInfo.avatarUrl,
        openId: session.openId,
        connectedAt: existing?.connectedAt ?? Date.now(),
        tokenExpiresAt: session.expiresAt,
        scopes: session.scopes,
        availablePrivacyLevels: creatorInfo.privacyLevelOptions,
        isUnaudited: creatorInfo.privacyLevelOptions.length === 1 && creatorInfo.privacyLevelOptions[0] === 'SELF_ONLY',
      };

      await secureStore.saveAccount(account, { accessToken: session.accessToken, refreshToken: session.refreshToken });
      logger.success(`Connected TikTok account "${account.displayName}".`);
      return { ok: true, account };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to connect a TikTok account.', message);
      return { ok: false, error: message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.accountsRemove, async (_event, accountId: string) => {
    const account = secureStore.getAccount(accountId);
    await secureStore.removeAccount(accountId);
    if (account) logger.info(`Removed TikTok account "${account.displayName}".`);
  });

  ipcMain.handle(IPC_CHANNELS.accountsRefresh, async (_event, accountId: string): Promise<ConnectAccountResult> => {
    try {
      const account = secureStore.getAccount(accountId);
      if (!account) throw new Error('Account not found.');
      const accessToken = await getValidAccessToken(accountId);
      const [userInfo, creatorInfo] = await Promise.all([fetchUserInfo(accessToken), fetchCreatorInfo(accessToken)]);
      const secrets = secureStore.getAccountSecrets(accountId);
      const updated: TikTokAccount = {
        ...account,
        displayName: userInfo.displayName,
        avatarUrl: userInfo.avatarUrl,
        availablePrivacyLevels: creatorInfo.privacyLevelOptions,
        isUnaudited: creatorInfo.privacyLevelOptions.length === 1 && creatorInfo.privacyLevelOptions[0] === 'SELF_ONLY',
      };
      await secureStore.saveAccount(updated, secrets!);
      return { ok: true, account: updated };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to refresh account status.', message);
      return { ok: false, error: message };
    }
  });
}
