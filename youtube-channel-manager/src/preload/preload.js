'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listChromeProfiles: () => ipcRenderer.invoke('profiles:list'),

  listChannels: () => ipcRenderer.invoke('channels:list'),
  saveChannel: (channel) => ipcRenderer.invoke('channels:save', channel),
  deleteChannel: (channelId) => ipcRenderer.invoke('channels:delete', channelId),

  chooseFolder: () => ipcRenderer.invoke('folder:choose'),
  scanFolder: (folderPath, channelId) => ipcRenderer.invoke('folder:scan', { folderPath, channelId }),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (partial) => ipcRenderer.invoke('settings:save', partial),

  clearHistory: (channelId) => ipcRenderer.invoke('history:clear', channelId),

  startRun: (channel, includeUploaded) => ipcRenderer.invoke('run:start', { channel, includeUploaded }),
  stopRun: (channelId) => ipcRenderer.invoke('run:stop', channelId),
  loginChannel: (channel) => ipcRenderer.invoke('run:login', channel),
  isRunActive: (channelId) => ipcRenderer.invoke('run:isActive', channelId),

  openPath: (targetPath) => ipcRenderer.invoke('shell:openPath', targetPath),

  onLog: (callback) => {
    const listener = (_evt, payload) => callback(payload);
    ipcRenderer.on('automation:log', listener);
    return () => ipcRenderer.removeListener('automation:log', listener);
  },
  onVideoStatus: (callback) => {
    const listener = (_evt, payload) => callback(payload);
    ipcRenderer.on('automation:video-status', listener);
    return () => ipcRenderer.removeListener('automation:video-status', listener);
  },
  onChannelStatus: (callback) => {
    const listener = (_evt, payload) => callback(payload);
    ipcRenderer.on('automation:channel-status', listener);
    return () => ipcRenderer.removeListener('automation:channel-status', listener);
  }
});
