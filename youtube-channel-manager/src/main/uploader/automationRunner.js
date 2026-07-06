'use strict';

const { EventEmitter } = require('events');
const { chromium } = require('playwright-core');

const { syncProfileIntoSandbox, ensureBlankSandbox, getSandboxDir } = require('./profileSandbox');
const { uploadVideo } = require('./youtubeUpload');
const store = require('../store');

/**
 * Coordinates one automated upload run per channel. Multiple channels can
 * run concurrently (bounded by settings.concurrency); videos within a
 * single channel are always uploaded one at a time to look and behave
 * like a normal person using their browser.
 */
class AutomationRunner extends EventEmitter {
  constructor() {
    super();
    this.activeRuns = new Map(); // channelId -> { cancelled: boolean, context, page }
    this.queue = [];
    this.runningCount = 0;
  }

  isRunning(channelId) {
    return this.activeRuns.has(channelId);
  }

  stopChannel(channelId) {
    const run = this.activeRuns.get(channelId);
    if (run) {
      run.cancelled = true;
      this.emitLog(channelId, 'Stop requested - will halt after the current video finishes.');
    }
  }

  emitLog(channelId, message) {
    const line = `[${new Date().toLocaleTimeString()}] ${message}`;
    this.emit('log', { channelId, message: line });
  }

  emitVideoStatus(channelId, videoId, status, extra = {}) {
    this.emit('video-status', { channelId, videoId, status, ...extra });
  }

  emitChannelStatus(channelId, status, extra = {}) {
    this.emit('channel-status', { channelId, status, ...extra });
  }

  /**
   * Queues a channel to run its pending videos. Resolves once the run for
   * this specific channel has finished (or been stopped/errored) - it does
   * not wait for other queued channels.
   */
  async enqueueChannelRun(channel, videos) {
    return new Promise((resolve) => {
      this.queue.push({ channel, videos, resolve });
      this._drainQueue();
    });
  }

  _drainQueue() {
    const settings = store.getSettings();
    const concurrency = Math.max(1, Number(settings.concurrency) || 1);

    while (this.runningCount < concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      this.runningCount += 1;
      this._runChannel(job.channel, job.videos)
        .catch((err) => this.emitLog(job.channel.id, `Fatal error: ${err.message}`))
        .finally(() => {
          this.runningCount -= 1;
          job.resolve();
          this._drainQueue();
        });
    }
  }

  async _runChannel(channel, videos) {
    const channelId = channel.id;
    if (this.activeRuns.has(channelId)) {
      this.emitLog(channelId, 'Already running - ignoring duplicate start request.');
      return;
    }

    const runState = { cancelled: false, context: null, page: null };
    this.activeRuns.set(channelId, runState);
    this.emitChannelStatus(channelId, 'running');

    const settings = store.getSettings();
    let context;

    try {
      this.emitLog(channelId, `Preparing browser profile for "${channel.name}"...`);
      const sandboxDir = channel.linkedProfile
        ? await syncProfileIntoSandbox(
            channel.linkedProfile.profileDir,
            channel.linkedProfile.userDataRoot,
            channelId
          )
        : await ensureBlankSandbox(channelId);

      this.emitLog(channelId, 'Launching Chrome...');
      context = await chromium.launchPersistentContext(sandboxDir, {
        channel: 'chrome',
        headless: Boolean(settings.headless),
        viewport: null,
        executablePath: settings.chromeExecutablePath || undefined,
        args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
      });
      runState.context = context;

      const page = context.pages()[0] || (await context.newPage());
      runState.page = page;

      let uploadedCount = 0;
      let failedCount = 0;

      for (const video of videos) {
        if (runState.cancelled) {
          this.emitLog(channelId, 'Run stopped by user.');
          break;
        }

        this.emitVideoStatus(channelId, video.id, 'uploading');
        try {
          const result = await uploadVideo(page, video, (msg) => this.emitLog(channelId, msg));
          store.markFileUploaded(channelId, video.filePath, {
            title: video.metadata.title,
            videoUrl: result.videoUrl || null
          });
          this.emitVideoStatus(channelId, video.id, 'success', { videoUrl: result.videoUrl });
          uploadedCount += 1;
        } catch (err) {
          this.emitLog(channelId, `Failed to upload "${video.fileName}": ${err.message}`);
          this.emitVideoStatus(channelId, video.id, 'error', { error: err.message });
          failedCount += 1;
        }

        if (!runState.cancelled && video !== videos[videos.length - 1]) {
          const pause = Number(settings.pauseBetweenUploadsMs) || 15000;
          this.emitLog(channelId, `Waiting ${Math.round(pause / 1000)}s before the next upload...`);
          await sleep(pause, runState);
        }
      }

      this.emitLog(
        channelId,
        `Run finished. ${uploadedCount} uploaded, ${failedCount} failed${
          runState.cancelled ? ', stopped early by user' : ''
        }.`
      );
      this.emitChannelStatus(channelId, runState.cancelled ? 'stopped' : 'idle');
    } catch (err) {
      this.emitLog(channelId, `Error: ${err.message}`);
      this.emitChannelStatus(channelId, 'error', { error: err.message });
    } finally {
      if (context) {
        await context.close().catch(() => {});
      }
      this.activeRuns.delete(channelId);
    }
  }

  /**
   * Opens a visible browser window for a channel without uploading
   * anything - used for "Test / Log in" so the user can confirm the
   * profile is signed in to the right YouTube account, or sign in for the
   * first time on a brand-new automation profile.
   */
  async openChannelForLogin(channel) {
    const channelId = channel.id;
    if (this.activeRuns.has(channelId)) {
      throw new Error('This channel already has a browser open.');
    }

    const runState = { cancelled: false, context: null, page: null };
    this.activeRuns.set(channelId, runState);
    this.emitChannelStatus(channelId, 'running');

    try {
      const sandboxDir = channel.linkedProfile
        ? await syncProfileIntoSandbox(
            channel.linkedProfile.profileDir,
            channel.linkedProfile.userDataRoot,
            channelId
          )
        : await ensureBlankSandbox(channelId);

      const context = await chromium.launchPersistentContext(sandboxDir, {
        channel: 'chrome',
        headless: false,
        viewport: null,
        args: ['--start-maximized']
      });
      runState.context = context;
      const page = context.pages()[0] || (await context.newPage());
      await page.goto('https://studio.youtube.com', { waitUntil: 'domcontentloaded' });
      this.emitLog(channelId, 'Browser window opened. Log in if needed, then close the window when done.');

      context.on('close', () => {
        this.activeRuns.delete(channelId);
        this.emitChannelStatus(channelId, 'idle');
        this.emitLog(channelId, 'Browser window closed.');
      });
    } catch (err) {
      this.activeRuns.delete(channelId);
      this.emitChannelStatus(channelId, 'error', { error: err.message });
      throw err;
    }
  }

  getSandboxDirFor(channelId) {
    return getSandboxDir(channelId);
  }
}

function sleep(ms, runState) {
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (runState.cancelled || Date.now() - start >= ms) {
        clearInterval(interval);
        resolve();
      }
    }, 250);
  });
}

module.exports = new AutomationRunner();
