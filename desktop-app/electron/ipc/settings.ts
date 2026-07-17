import { ipcMain } from 'electron';
import { secureStore } from '../services/secureStore.js';
import { IPC_CHANNELS } from '../types.js';
import { logger } from '../services/logger.js';

export function registerSettingsIpc(): void {
  ipcMain.handle(IPC_CHANNELS.settingsGet, async () => secureStore.getSettings());

  ipcMain.handle(IPC_CHANNELS.settingsSetClientCredentials, async (_event, clientKey: string, clientSecret: string) => {
    const settings = await secureStore.setClientCredentials(clientKey, clientSecret);
    logger.info('Saved TikTok developer app credentials.');
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.settingsUpdate, async (_event, patch) => secureStore.updateSettings(patch));
}
