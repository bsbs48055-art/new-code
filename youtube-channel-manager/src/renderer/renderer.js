'use strict';

const state = {
  channels: [],
  chromeProfiles: [],
  settings: {},
  selectedChannelId: null,
  videosByChannel: {},
  logsByChannel: {},
  statusByChannel: {},
  editingChannelId: null
};

const el = (id) => document.getElementById(id);

async function init() {
  state.channels = await window.api.listChannels();
  state.settings = await window.api.getSettings();
  await refreshProfiles();

  renderSidebar();
  if (state.channels.length > 0) {
    selectChannel(state.channels[0].id);
  } else {
    el('emptyState').classList.remove('hidden');
    el('channelView').classList.add('hidden');
  }

  window.api.onLog(({ channelId, message }) => {
    if (!state.logsByChannel[channelId]) state.logsByChannel[channelId] = [];
    state.logsByChannel[channelId].push(message);
    if (state.logsByChannel[channelId].length > 500) state.logsByChannel[channelId].shift();
    if (channelId === state.selectedChannelId) renderLog();
  });

  window.api.onVideoStatus(({ channelId, videoId, status, videoUrl, error }) => {
    const videos = state.videosByChannel[channelId];
    if (!videos) return;
    const video = videos.find((v) => v.id === videoId);
    if (video) {
      video.status = status === 'success' ? 'uploaded' : status;
      if (videoUrl) video.videoUrl = videoUrl;
      if (error) video.error = error;
    }
    if (channelId === state.selectedChannelId) renderVideoTable();
  });

  window.api.onChannelStatus(({ channelId, status }) => {
    state.statusByChannel[channelId] = status;
    renderSidebar();
    if (channelId === state.selectedChannelId) renderRunControls();
  });

  bindStaticEvents();
}

async function refreshProfiles() {
  state.chromeProfiles = await window.api.listChromeProfiles();
}

function renderSidebar() {
  const list = el('channelList');
  list.innerHTML = '';
  for (const channel of state.channels) {
    const status = state.statusByChannel[channel.id] || 'idle';
    const item = document.createElement('div');
    item.className = 'channel-item' + (channel.id === state.selectedChannelId ? ' active' : '');
    item.innerHTML = `
      <div class="channel-avatar">${initials(channel.name)}</div>
      <div class="channel-item-text">
        <div class="channel-item-name">${escapeHtml(channel.name)}</div>
        <div class="channel-item-sub">${
          channel.linkedProfile ? escapeHtml(channel.linkedProfile.displayName) : 'No profile linked'
        }</div>
      </div>
      <div class="channel-status-dot ${status}"></div>
    `;
    item.addEventListener('click', () => selectChannel(channel.id));
    list.appendChild(item);
  }
}

function initials(name) {
  return (name || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

async function selectChannel(channelId) {
  state.selectedChannelId = channelId;
  el('emptyState').classList.add('hidden');
  el('channelView').classList.remove('hidden');
  renderSidebar();
  renderChannelHeader();
  renderRunControls();
  renderLog();
  await rescanCurrentChannel();
}

function getSelectedChannel() {
  return state.channels.find((c) => c.id === state.selectedChannelId) || null;
}

function renderChannelHeader() {
  const channel = getSelectedChannel();
  if (!channel) return;
  el('channelName').textContent = channel.name;
  el('channelProfileBadge').textContent = channel.linkedProfile
    ? `${channel.linkedProfile.displayName} (${channel.linkedProfile.browser})`
    : 'No profile linked - manual login';
  el('folderPath').textContent = channel.contentFolder || 'No folder selected';
}

function renderRunControls() {
  const channel = getSelectedChannel();
  if (!channel) return;
  const status = state.statusByChannel[channel.id] || 'idle';
  const badge = el('channelStatusBadge');
  badge.textContent = status[0].toUpperCase() + status.slice(1);
  badge.className = `badge status-${status}`;

  const running = status === 'running';
  el('runBtn').style.display = running ? 'none' : 'inline-block';
  el('stopBtn').style.display = running ? 'inline-block' : 'none';
}

function renderLog() {
  const channel = getSelectedChannel();
  const box = el('logConsole');
  if (!channel) {
    box.textContent = '';
    return;
  }
  const lines = state.logsByChannel[channel.id] || [];
  box.textContent = lines.join('\n');
  box.scrollTop = box.scrollHeight;
}

function renderVideoTable() {
  const channel = getSelectedChannel();
  const tbody = el('videoTableBody');
  tbody.innerHTML = '';
  const videos = channel ? state.videosByChannel[channel.id] || [] : [];

  if (videos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-hint">No videos found in the content folder yet.</td></tr>`;
    return;
  }

  for (const video of videos) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(video.fileName)}</td>
      <td>${escapeHtml(video.metadata.title)}</td>
      <td>${escapeHtml(video.metadata.privacy)}</td>
      <td><span class="status-pill ${video.status}">${video.status}</span></td>
    `;
    tbody.appendChild(tr);
  }
}

async function rescanCurrentChannel() {
  const channel = getSelectedChannel();
  if (!channel || !channel.contentFolder) {
    state.videosByChannel[channel ? channel.id : null] = [];
    renderVideoTable();
    return;
  }
  const scan = await window.api.scanFolder(channel.contentFolder, channel.id);
  state.videosByChannel[channel.id] = scan.videos;
  renderVideoTable();
}

function bindStaticEvents() {
  el('addChannelBtn').addEventListener('click', () => openChannelModal(null));
  el('emptyAddChannelBtn').addEventListener('click', () => openChannelModal(null));
  el('editChannelBtn').addEventListener('click', () => openChannelModal(getSelectedChannel()));
  el('deleteChannelBtn').addEventListener('click', onDeleteChannel);

  el('changeFolderBtn').addEventListener('click', onChangeFolder);
  el('openFolderBtn').addEventListener('click', () => {
    const channel = getSelectedChannel();
    if (channel && channel.contentFolder) window.api.openPath(channel.contentFolder);
  });
  el('rescanBtn').addEventListener('click', rescanCurrentChannel);

  el('runBtn').addEventListener('click', onRunUpload);
  el('stopBtn').addEventListener('click', onStopRun);
  el('loginBtn').addEventListener('click', onLoginChannel);

  el('cancelChannelModalBtn').addEventListener('click', closeChannelModal);
  el('saveChannelModalBtn').addEventListener('click', onSaveChannelModal);
  el('refreshProfilesBtn').addEventListener('click', async () => {
    await refreshProfiles();
    populateProfileSelect();
  });
  el('pickFolderBtn').addEventListener('click', async () => {
    const folder = await window.api.chooseFolder();
    if (folder) el('channelFolderInput').value = folder;
  });

  el('settingsBtn').addEventListener('click', openSettingsModal);
  el('closeSettingsBtn').addEventListener('click', closeSettingsModal);
  el('saveSettingsBtn').addEventListener('click', onSaveSettings);
}

async function onChangeFolder() {
  const folder = await window.api.chooseFolder();
  if (!folder) return;
  const channel = getSelectedChannel();
  channel.contentFolder = folder;
  await window.api.saveChannel(channel);
  renderChannelHeader();
  await rescanCurrentChannel();
}

async function onDeleteChannel() {
  const channel = getSelectedChannel();
  if (!channel) return;
  if (!confirm(`Delete channel "${channel.name}"? This removes it from the app (your videos and Chrome profile are untouched).`)) {
    return;
  }
  await window.api.deleteChannel(channel.id);
  state.channels = state.channels.filter((c) => c.id !== channel.id);
  state.selectedChannelId = state.channels[0]?.id || null;
  renderSidebar();
  if (state.selectedChannelId) {
    selectChannel(state.selectedChannelId);
  } else {
    el('emptyState').classList.remove('hidden');
    el('channelView').classList.add('hidden');
  }
}

async function onRunUpload() {
  const channel = getSelectedChannel();
  if (!channel) return;
  if (!channel.contentFolder) {
    alert('Please choose a content folder for this channel first.');
    return;
  }
  const includeUploaded = el('includeUploadedCheckbox').checked;
  const result = await window.api.startRun(channel, includeUploaded);
  if (!result.started) {
    alert('No pending videos to upload. Add new files to the content folder or check "re-upload" above.');
  }
}

async function onStopRun() {
  const channel = getSelectedChannel();
  if (!channel) return;
  await window.api.stopRun(channel.id);
}

async function onLoginChannel() {
  const channel = getSelectedChannel();
  if (!channel) return;
  try {
    await window.api.loginChannel(channel);
  } catch (err) {
    alert(`Could not open browser: ${err.message}`);
  }
}

/* ---------------- Channel modal ---------------- */

function openChannelModal(existingChannel) {
  state.editingChannelId = existingChannel ? existingChannel.id : null;
  el('channelModalTitle').textContent = existingChannel ? 'Edit Channel' : 'Add Channel';
  el('channelNameInput').value = existingChannel ? existingChannel.name : '';
  el('channelFolderInput').value = existingChannel ? existingChannel.contentFolder || '' : '';
  el('channelPrivacySelect').value = existingChannel ? existingChannel.defaultPrivacy || 'private' : 'private';
  el('channelMadeForKidsInput').checked = existingChannel ? Boolean(existingChannel.defaultMadeForKids) : false;

  populateProfileSelect(existingChannel ? existingChannel.linkedProfile : null);

  el('channelModalBackdrop').classList.remove('hidden');
}

function populateProfileSelect(selectedProfile) {
  const select = el('profileSelect');
  select.innerHTML = '';

  const noneOpt = document.createElement('option');
  noneOpt.value = '';
  noneOpt.textContent = 'No linked profile (log in manually)';
  select.appendChild(noneOpt);

  state.chromeProfiles.forEach((profile, index) => {
    const opt = document.createElement('option');
    opt.value = String(index);
    const account = profile.googleAccount ? ` — ${profile.googleAccount}` : '';
    opt.textContent = `${profile.displayName}${account} [${profile.browser}]`;
    select.appendChild(opt);
  });

  if (selectedProfile) {
    const idx = state.chromeProfiles.findIndex((p) => p.id === selectedProfile.id);
    select.value = idx >= 0 ? String(idx) : '';
  } else {
    select.value = '';
  }
}

function closeChannelModal() {
  el('channelModalBackdrop').classList.add('hidden');
}

async function onSaveChannelModal() {
  const name = el('channelNameInput').value.trim();
  if (!name) {
    alert('Please enter a channel name.');
    return;
  }

  const profileIndex = el('profileSelect').value;
  const linkedProfile = profileIndex !== '' ? state.chromeProfiles[Number(profileIndex)] : null;

  const channel = {
    id: state.editingChannelId,
    name,
    contentFolder: el('channelFolderInput').value || null,
    linkedProfile,
    defaultPrivacy: el('channelPrivacySelect').value,
    defaultMadeForKids: el('channelMadeForKidsInput').checked
  };

  const saved = await window.api.saveChannel(channel);
  const idx = state.channels.findIndex((c) => c.id === saved.id);
  if (idx >= 0) state.channels[idx] = saved;
  else state.channels.push(saved);

  closeChannelModal();
  renderSidebar();
  selectChannel(saved.id);
}

/* ---------------- Settings modal ---------------- */

function openSettingsModal() {
  el('headlessInput').checked = Boolean(state.settings.headless);
  el('concurrencyInput').value = state.settings.concurrency || 1;
  el('pauseInput').value = Math.round((state.settings.pauseBetweenUploadsMs || 15000) / 1000);
  el('chromePathInput').value = state.settings.chromeExecutablePath || '';
  el('settingsModalBackdrop').classList.remove('hidden');
}

function closeSettingsModal() {
  el('settingsModalBackdrop').classList.add('hidden');
}

async function onSaveSettings() {
  const partial = {
    headless: el('headlessInput').checked,
    concurrency: Number(el('concurrencyInput').value) || 1,
    pauseBetweenUploadsMs: (Number(el('pauseInput').value) || 15) * 1000,
    chromeExecutablePath: el('chromePathInput').value.trim() || null
  };
  state.settings = await window.api.saveSettings(partial);
  closeSettingsModal();
}

init();
