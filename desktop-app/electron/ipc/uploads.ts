import { ipcMain, dialog, type BrowserWindow } from 'electron';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { secureStore } from '../services/secureStore.js';
import { logger } from '../services/logger.js';
import { uploadVideoToAccount } from '../services/tiktokUploader.js';
import { IPC_CHANNELS, type PickVideoResult, type StartUploadPayload, type UploadJob } from '../types.js';

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm'];
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024 * 1024; // TikTok's documented max is 4GB for FILE_UPLOAD.

const jobs = new Map<string, UploadJob>();
const abortControllers = new Map<string, AbortController>();

function emitProgress(window: BrowserWindow, job: UploadJob): void {
  if (!window.isDestroyed()) window.webContents.send(IPC_CHANNELS.uploadsProgressEvent, job);
}

async function persistAndEmit(window: BrowserWindow, job: UploadJob): Promise<void> {
  await secureStore.saveUploadJob(job);
  emitProgress(window, job);
}

async function runUploadJob(window: BrowserWindow, job: UploadJob, delaySeconds: number): Promise<void> {
  for (let i = 0; i < job.targets.length; i += 1) {
    const target = job.targets[i];
    const controller = new AbortController();
    abortControllers.set(`${job.id}:${target.accountId}`, controller);

    target.status = 'uploading';
    await persistAndEmit(window, job);
    logger.info(`Uploading "${job.videoFileName}" to ${target.accountName}…`);

    try {
      const result = await uploadVideoToAccount(
        target.accountId,
        {
          filePath: job.videoPath,
          fileSize: job.fileSizeBytes,
          title: job.title,
          privacyLevel: job.privacyLevel,
          disableComment: job.disableComment,
          disableDuet: job.disableDuet,
          disableStitch: job.disableStitch,
        },
        (uploaded, total) => {
          target.progress = total > 0 ? Math.round((uploaded / total) * 100) : 0;
          emitProgress(window, job);
        },
        controller.signal,
      );
      target.status = 'success';
      target.progress = 100;
      target.publishId = result.publishId;
      target.postUrl = result.postUrl;
      logger.success(`Finished uploading "${job.videoFileName}" to ${target.accountName}.`);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        target.status = 'canceled';
        logger.warn(`Upload to ${target.accountName} was canceled.`);
      } else {
        target.status = 'failed';
        target.error = error instanceof Error ? error.message : String(error);
        logger.error(`Upload to ${target.accountName} failed.`, target.error);
      }
    } finally {
      abortControllers.delete(`${job.id}:${target.accountId}`);
    }

    await persistAndEmit(window, job);

    const hasMoreTargets = i < job.targets.length - 1;
    if (hasMoreTargets && delaySeconds > 0) {
      logger.info(`Waiting ${delaySeconds}s before the next account to keep posting activity human-paced…`);
      await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
    }
  }
}

export function registerUploadsIpc(getWindow: () => BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.uploadsPickVideo, async (): Promise<PickVideoResult> => {
    const window = getWindow();
    const result = await dialog.showOpenDialog(window, {
      title: 'Choose a video to upload',
      properties: ['openFile'],
      filters: [{ name: 'Video', extensions: VIDEO_EXTENSIONS }],
    });
    if (result.canceled || result.filePaths.length === 0) return { canceled: true };

    const filePath = result.filePaths[0];
    const stat = await fs.stat(filePath);
    if (stat.size > MAX_FILE_SIZE_BYTES) {
      throw new Error('That video is larger than TikTok\'s 4GB upload limit.');
    }
    return { canceled: false, path: filePath, fileName: path.basename(filePath), sizeBytes: stat.size };
  });

  ipcMain.handle(IPC_CHANNELS.uploadsStart, async (_event, payload: StartUploadPayload): Promise<UploadJob> => {
    if (payload.accountIds.length === 0) throw new Error('Select at least one account to upload to.');
    const accounts = secureStore.listAccounts();
    const stat = await fs.stat(payload.videoPath);

    const job: UploadJob = {
      id: randomUUID(),
      videoPath: payload.videoPath,
      videoFileName: path.basename(payload.videoPath),
      fileSizeBytes: stat.size,
      title: payload.title,
      privacyLevel: payload.privacyLevel,
      disableComment: payload.disableComment,
      disableDuet: payload.disableDuet,
      disableStitch: payload.disableStitch,
      createdAt: Date.now(),
      targets: payload.accountIds.map((accountId) => ({
        accountId,
        accountName: accounts.find((a) => a.id === accountId)?.displayName ?? 'Unknown account',
        status: 'queued' as const,
        progress: 0,
      })),
    };

    jobs.set(job.id, job);
    const window = getWindow();
    await persistAndEmit(window, job);
    logger.info(`Queued "${job.videoFileName}" for ${job.targets.length} account(s).`);

    const settings = secureStore.getSettings();
    void runUploadJob(window, job, settings.delayBetweenAccountsSeconds).catch((error) => {
      logger.error('Upload job crashed unexpectedly.', error instanceof Error ? error.message : String(error));
    });

    return job;
  });

  ipcMain.handle(IPC_CHANNELS.uploadsList, async () => secureStore.listUploadHistory());

  ipcMain.handle(IPC_CHANNELS.uploadsCancel, async (_event, jobId: string) => {
    for (const [key, controller] of abortControllers.entries()) {
      if (key.startsWith(`${jobId}:`)) controller.abort();
    }
  });
}
