import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { secureStore } from './services/secureStore.js';
import { logger } from './services/logger.js';
import { registerSettingsIpc } from './ipc/settings.js';
import { registerAccountsIpc } from './ipc/accounts.js';
import { registerUploadsIpc } from './ipc/uploads.js';
import { registerLogsIpc } from './ipc/logs.js';
import { registerAppIpc } from './ipc/app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0f1115',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => window.show());

  // Every external link (e.g. "Open TikTok Developer Portal") opens in the
  // user's real browser instead of a new app window.
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    void window.loadURL('http://localhost:5183');
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    void window.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return window;
}

async function bootstrap(): Promise<void> {
  await secureStore.load();
  mainWindow = createWindow();
  logger.attachWindow(mainWindow);

  registerSettingsIpc();
  registerAccountsIpc();
  registerUploadsIpc(() => mainWindow!);
  registerLogsIpc();
  registerAppIpc();

  logger.info('TikTok Multi Uploader started.');
}

app.whenReady().then(() => {
  void bootstrap();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
      logger.attachWindow(mainWindow);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
