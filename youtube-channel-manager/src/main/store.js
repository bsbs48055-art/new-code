'use strict';

const Store = require('electron-store');

const store = new Store({
  name: 'ytcm-data',
  defaults: {
    channels: [],
    settings: {
      headless: false,
      concurrency: 1,
      stepDelayMs: 900,
      chromeExecutablePath: null,
      pauseBetweenUploadsMs: 15000
    },
    uploadHistory: {}
  }
});

function getChannels() {
  return store.get('channels');
}

function saveChannel(channel) {
  const channels = getChannels();
  const idx = channels.findIndex((c) => c.id === channel.id);
  if (idx >= 0) {
    channels[idx] = channel;
  } else {
    channels.push(channel);
  }
  store.set('channels', channels);
  return channel;
}

function deleteChannel(channelId) {
  const channels = getChannels().filter((c) => c.id !== channelId);
  store.set('channels', channels);

  const history = store.get('uploadHistory');
  delete history[channelId];
  store.set('uploadHistory', history);
}

function getSettings() {
  return store.get('settings');
}

function saveSettings(partial) {
  const current = getSettings();
  const next = { ...current, ...partial };
  store.set('settings', next);
  return next;
}

function getUploadedFilesForChannel(channelId) {
  const history = store.get('uploadHistory');
  return history[channelId] || {};
}

function markFileUploaded(channelId, filePath, result) {
  const history = store.get('uploadHistory');
  if (!history[channelId]) history[channelId] = {};
  history[channelId][filePath] = {
    uploadedAt: Date.now(),
    ...result
  };
  store.set('uploadHistory', history);
}

function clearHistoryForChannel(channelId) {
  const history = store.get('uploadHistory');
  history[channelId] = {};
  store.set('uploadHistory', history);
}

module.exports = {
  getChannels,
  saveChannel,
  deleteChannel,
  getSettings,
  saveSettings,
  getUploadedFilesForChannel,
  markFileUploaded,
  clearHistoryForChannel
};
