import { app, safeStorage } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AppSettings, TikTokAccount, UploadJob } from '../types.js';

/**
 * Everything is persisted as plain JSON on disk under the app's userData
 * directory, EXCEPT the TikTok client secret and OAuth tokens, which are
 * encrypted at rest with Electron's `safeStorage` (backed by the OS
 * keychain: DPAPI on Windows, Keychain on macOS, libsecret on Linux) before
 * ever touching disk.
 */

interface StoredAccountSecrets {
  accessToken: string;
  refreshToken: string;
}

interface DiskShape {
  settings: {
    tiktokClientKey: string;
    tiktokClientSecretEncrypted?: string; // base64
    oauthRedirectPort: number;
    delayBetweenAccountsSeconds: number;
    theme: 'dark' | 'light' | 'system';
  };
  accounts: TikTokAccount[];
  accountSecretsEncrypted: Record<string, string>; // accountId -> base64 encrypted JSON
  uploadHistory: UploadJob[];
}

const DEFAULT_DATA: DiskShape = {
  settings: {
    tiktokClientKey: '',
    oauthRedirectPort: 53127,
    delayBetweenAccountsSeconds: 20,
    theme: 'dark',
  },
  accounts: [],
  accountSecretsEncrypted: {},
  uploadHistory: [],
};

function encrypt(plainText: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    // Extremely rare (e.g. some headless Linux setups with no keyring). We
    // still base64-encode so the JSON file stays valid, but this is not
    // real encryption - surfaced to the user in Settings.
    return Buffer.from(plainText, 'utf-8').toString('base64');
  }
  return safeStorage.encryptString(plainText).toString('base64');
}

function decrypt(cipherText: string): string {
  const buffer = Buffer.from(cipherText, 'base64');
  if (!safeStorage.isEncryptionAvailable()) {
    return buffer.toString('utf-8');
  }
  return safeStorage.decryptString(buffer);
}

class SecureStore {
  private filePath: string;
  private data: DiskShape = structuredClone(DEFAULT_DATA);
  private loaded = false;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'store.json');
  }

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<DiskShape>;
      this.data = {
        ...structuredClone(DEFAULT_DATA),
        ...parsed,
        settings: { ...DEFAULT_DATA.settings, ...parsed.settings },
      };
    } catch {
      this.data = structuredClone(DEFAULT_DATA);
    }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      const tmpPath = `${this.filePath}.tmp`;
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      await fs.rename(tmpPath, this.filePath);
    });
    await this.writeQueue;
  }

  getSettings(): AppSettings {
    return {
      tiktokClientKey: this.data.settings.tiktokClientKey,
      hasTikTokClientSecret: Boolean(this.data.settings.tiktokClientSecretEncrypted),
      oauthRedirectPort: this.data.settings.oauthRedirectPort,
      delayBetweenAccountsSeconds: this.data.settings.delayBetweenAccountsSeconds,
      theme: this.data.settings.theme,
    };
  }

  getTikTokClientSecret(): string {
    if (!this.data.settings.tiktokClientSecretEncrypted) return '';
    return decrypt(this.data.settings.tiktokClientSecretEncrypted);
  }

  async setClientCredentials(clientKey: string, clientSecret: string): Promise<AppSettings> {
    this.data.settings.tiktokClientKey = clientKey.trim();
    if (clientSecret.trim()) {
      this.data.settings.tiktokClientSecretEncrypted = encrypt(clientSecret.trim());
    }
    await this.persist();
    return this.getSettings();
  }

  async updateSettings(
    patch: Partial<Pick<DiskShape['settings'], 'delayBetweenAccountsSeconds' | 'theme' | 'oauthRedirectPort'>>,
  ): Promise<AppSettings> {
    this.data.settings = { ...this.data.settings, ...patch };
    await this.persist();
    return this.getSettings();
  }

  listAccounts(): TikTokAccount[] {
    return this.data.accounts;
  }

  getAccount(accountId: string): TikTokAccount | undefined {
    return this.data.accounts.find((a) => a.id === accountId);
  }

  async saveAccount(account: TikTokAccount, secrets: StoredAccountSecrets): Promise<void> {
    const existingIndex = this.data.accounts.findIndex((a) => a.id === account.id);
    if (existingIndex >= 0) this.data.accounts[existingIndex] = account;
    else this.data.accounts.push(account);
    this.data.accountSecretsEncrypted[account.id] = encrypt(JSON.stringify(secrets));
    await this.persist();
  }

  getAccountSecrets(accountId: string): StoredAccountSecrets | undefined {
    const raw = this.data.accountSecretsEncrypted[accountId];
    if (!raw) return undefined;
    return JSON.parse(decrypt(raw)) as StoredAccountSecrets;
  }

  async removeAccount(accountId: string): Promise<void> {
    this.data.accounts = this.data.accounts.filter((a) => a.id !== accountId);
    delete this.data.accountSecretsEncrypted[accountId];
    await this.persist();
  }

  listUploadHistory(): UploadJob[] {
    return this.data.uploadHistory;
  }

  async saveUploadJob(job: UploadJob): Promise<void> {
    const existingIndex = this.data.uploadHistory.findIndex((j) => j.id === job.id);
    if (existingIndex >= 0) this.data.uploadHistory[existingIndex] = job;
    else this.data.uploadHistory.unshift(job);
    this.data.uploadHistory = this.data.uploadHistory.slice(0, 200);
    await this.persist();
  }
}

export const secureStore = new SecureStore();
