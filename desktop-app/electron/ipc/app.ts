import { app, ipcMain, shell } from 'electron';
import { IPC_CHANNELS } from '../types.js';

const ALLOWED_EXTERNAL_PREFIXES = ['https://www.tiktok.com/', 'https://developers.tiktok.com/'];

export function registerAppIpc(): void {
  ipcMain.handle(IPC_CHANNELS.appGetVersion, async () => app.getVersion());

  ipcMain.handle(IPC_CHANNELS.appOpenExternal, async (_event, url: string) => {
    if (!ALLOWED_EXTERNAL_PREFIXES.some((prefix) => url.startsWith(prefix))) {
      throw new Error('Blocked attempt to open a non-allow-listed external URL.');
    }
    await shell.openExternal(url);
  });
}
