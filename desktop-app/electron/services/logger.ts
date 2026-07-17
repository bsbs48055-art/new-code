import { randomUUID } from 'node:crypto';
import type { BrowserWindow } from 'electron';
import type { LogEntry } from '../types.js';
import { IPC_CHANNELS } from '../types.js';

class Logger {
  private entries: LogEntry[] = [];
  private window: BrowserWindow | null = null;

  attachWindow(window: BrowserWindow): void {
    this.window = window;
  }

  list(): LogEntry[] {
    return this.entries;
  }

  clear(): void {
    this.entries = [];
  }

  private push(level: LogEntry['level'], message: string, detail?: string): void {
    const entry: LogEntry = { id: randomUUID(), timestamp: Date.now(), level, message, detail };
    this.entries.unshift(entry);
    this.entries = this.entries.slice(0, 500);
    // eslint-disable-next-line no-console
    console.log(`[${level.toUpperCase()}] ${message}${detail ? ` — ${detail}` : ''}`);
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(IPC_CHANNELS.logsNewEntryEvent, entry);
    }
  }

  info(message: string, detail?: string): void {
    this.push('info', message, detail);
  }

  success(message: string, detail?: string): void {
    this.push('success', message, detail);
  }

  warn(message: string, detail?: string): void {
    this.push('warn', message, detail);
  }

  error(message: string, detail?: string): void {
    this.push('error', message, detail);
  }
}

export const logger = new Logger();
