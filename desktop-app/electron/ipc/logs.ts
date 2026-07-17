import { ipcMain } from 'electron';
import { logger } from '../services/logger.js';
import { IPC_CHANNELS } from '../types.js';

export function registerLogsIpc(): void {
  ipcMain.handle(IPC_CHANNELS.logsList, async () => logger.list());
  ipcMain.handle(IPC_CHANNELS.logsClear, async () => logger.clear());
}
