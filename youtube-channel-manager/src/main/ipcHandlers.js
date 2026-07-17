'use strict';

const { ipcMain, dialog, shell } = require('electron');
const { v4: uuid } = require('uuid');

const store = require('./store');
const { listChromeProfiles } = require('./chromeProfiles');
const { scanContentFolder } = require('./folderScanner');
const automationRunner = require('./uploader/automationRunner');
const { removeSandbox } = require('./uploader/profileSandbox');

function mergeUploadStatus(channelId, videos) {
  const history = store.getUploadedFilesForChannel(channelId);
  return videos.map((video) => {
    const record = history[video.filePath];
    return {
      ...video,
      status: record ? 'uploaded' : 'pending',
      uploadedAt: record ? record.uploadedAt : null,
      videoUrl: record ? record.videoUrl : null
    };
  });
}

function setupIpcHandlers(mainWindow) {
  automationRunner.on('log', (payload) => mainWindow.webContents.send('automation:log', payload));
  automationRunner.on('video-status', (payload) => mainWindow.webContents.send('automation:video-status', payload));
  automationRunner.on('channel-status', (payload) => mainWindow.webContents.send('automation:channel-status', payload));

  ipcMain.handle('profiles:list', async () => {
    return listChromeProfiles();
  });

  ipcMain.handle('channels:list', async () => {
    return store.getChannels();
  });

  ipcMain.handle('channels:save', async (_evt, channel) => {
    const toSave = channel.id
      ? channel
      : { ...channel, id: uuid(), createdAt: Date.now() };
    return store.saveChannel(toSave);
  });

  ipcMain.handle('channels:delete', async (_evt, channelId) => {
    store.deleteChannel(channelId);
    await removeSandbox(channelId).catch(() => {});
    return true;
  });

  ipcMain.handle('folder:choose', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select the folder containing videos to upload'
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('folder:scan', async (_evt, { folderPath, channelId }) => {
    const scan = scanContentFolder(folderPath);
    return { ...scan, videos: mergeUploadStatus(channelId, scan.videos) };
  });

  ipcMain.handle('settings:get', async () => {
    return store.getSettings();
  });

  ipcMain.handle('settings:save', async (_evt, partial) => {
    return store.saveSettings(partial);
  });

  ipcMain.handle('history:clear', async (_evt, channelId) => {
    store.clearHistoryForChannel(channelId);
    return true;
  });

  ipcMain.handle('run:start', async (_evt, { channel, includeUploaded }) => {
    const scan = scanContentFolder(channel.contentFolder);
    let videos = mergeUploadStatus(channel.id, scan.videos);
    if (!includeUploaded) {
      videos = videos.filter((v) => v.status !== 'uploaded');
    }
    if (videos.length === 0) {
      mainWindow.webContents.send('automation:log', {
        channelId: channel.id,
        message: `[${new Date().toLocaleTimeString()}] Nothing to upload - no pending videos found in the content folder.`
      });
      return { started: false, reason: 'no-pending-videos' };
    }
    automationRunner.enqueueChannelRun(channel, videos);
    return { started: true, count: videos.length };
  });

  ipcMain.handle('run:stop', async (_evt, channelId) => {
    automationRunner.stopChannel(channelId);
    return true;
  });

  ipcMain.handle('run:login', async (_evt, channel) => {
    await automationRunner.openChannelForLogin(channel);
    return true;
  });

  ipcMain.handle('run:isActive', async (_evt, channelId) => {
    return automationRunner.isRunning(channelId);
  });

  ipcMain.handle('shell:openPath', async (_evt, targetPath) => {
    await shell.openPath(targetPath);
    return true;
  });
}

module.exports = { setupIpcHandlers };
