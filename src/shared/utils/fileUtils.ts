/**
 * Folder-import auto-mapping. Given a flat list of `File` objects (as
 * produced by a `<input webkitdirectory>` selection or a recursive
 * drag-and-drop payload), classifies each file by role using its extension
 * and well-known filename conventions, matching the spec:
 *
 *   video.mp4, cover.jpg, thumbnail.jpg, captions.srt, description.txt,
 *   tags.txt, schedule.csv, metadata.json
 */

import {
  SUPPORTED_IMAGE_EXTENSIONS,
  SUPPORTED_SUBTITLE_EXTENSIONS,
  SUPPORTED_VIDEO_EXTENSIONS,
} from '@shared/constants';
import type { FolderImportResult, MediaFileRef } from '@shared/types/index';
import { generateId } from '@shared/utils/id';
import { parseScheduleCsv } from '@shared/utils/csvParser';
import { storeBlob } from '@shared/db/blobStore';

function extensionOf(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx === -1 ? '' : fileName.slice(idx).toLowerCase();
}

function baseNameOf(fileName: string): string {
  const parts = fileName.split('/');
  return parts[parts.length - 1].toLowerCase();
}

const THUMBNAIL_HINTS = ['thumb', 'thumbnail', 'cover', 'poster'];

export async function fileToMediaFileRef(file: File): Promise<MediaFileRef> {
  const blobKey = await storeBlob(file);
  return { name: file.name, mimeType: file.type, size: file.size, blobKey };
}

export function detectMediaKindFromExtension(fileName: string): 'video' | 'image' | 'unknown' {
  const ext = extensionOf(fileName);
  if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) return 'video';
  if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) return 'image';
  return 'unknown';
}

async function toMediaFileRef(file: File, relativePath: string): Promise<MediaFileRef> {
  const blobKey = await storeBlob(file);
  return {
    name: file.name,
    mimeType: file.type,
    size: file.size,
    blobKey,
    relativePath,
  };
}

/**
 * Classifies and maps a flat array of Files coming from a folder selection
 * (or a recursively-flattened drag-and-drop) into the buckets the upload
 * workflow understands, persisting binary content into the blob store as it
 * goes so downstream code only ever deals with lightweight references.
 */
export async function mapFolderImport(files: File[], rootName: string): Promise<FolderImportResult> {
  const batchId = generateId('batch');
  const result: FolderImportResult = {
    batchId,
    rootName,
    videos: [],
    images: [],
    thumbnails: [],
    subtitles: [],
    unmatched: [],
  };

  for (const file of files) {
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const base = baseNameOf(relativePath);
    const ext = extensionOf(base);
    const isThumbnailHint = THUMBNAIL_HINTS.some((hint) => base.includes(hint));

    if (base === 'description.txt') {
      result.descriptionText = await file.text();
      continue;
    }
    if (base === 'tags.txt') {
      const text = await file.text();
      result.tags = text
        .split(/[\n,]/)
        .map((t) => t.trim())
        .filter(Boolean);
      continue;
    }
    if (base === 'schedule.csv') {
      const text = await file.text();
      result.scheduleRows = parseScheduleCsv(text);
      continue;
    }
    if (base === 'metadata.json') {
      try {
        result.metadataJson = JSON.parse(await file.text());
      } catch {
        result.metadataJson = undefined;
      }
      continue;
    }
    if (SUPPORTED_SUBTITLE_EXTENSIONS.includes(ext)) {
      result.subtitles.push(await toMediaFileRef(file, relativePath));
      continue;
    }
    if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext) && isThumbnailHint) {
      result.thumbnails.push(await toMediaFileRef(file, relativePath));
      continue;
    }
    if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
      result.images.push(await toMediaFileRef(file, relativePath));
      continue;
    }
    if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) {
      result.videos.push(await toMediaFileRef(file, relativePath));
      continue;
    }
    result.unmatched.push(await toMediaFileRef(file, relativePath));
  }

  return result;
}

/** Recursively flattens a `DataTransferItemList` (drag & drop) into `File[]` with paths preserved. */
export async function flattenDataTransferItems(items: DataTransferItemList): Promise<File[]> {
  const files: File[] = [];

  async function walk(entry: FileSystemEntry, path: string): Promise<void> {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, reject),
      );
      const fullPath = `${path}${file.name}`;
      Object.defineProperty(file, 'webkitRelativePath', { value: fullPath, configurable: true });
      files.push(file);
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const entries = await new Promise<FileSystemEntry[]>((resolve, reject) =>
        reader.readEntries(resolve, reject),
      );
      for (const child of entries) {
        await walk(child, `${path}${entry.name}/`);
      }
    }
  }

  const rootEntries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i += 1) {
    const entry = items[i].webkitGetAsEntry?.();
    if (entry) rootEntries.push(entry);
  }
  await Promise.all(rootEntries.map((entry) => walk(entry, '')));
  return files;
}

/** Computes a stable fingerprint used for duplicate detection across uploads/batches. */
export function fileFingerprint(file: Pick<MediaFileRef, 'name' | 'size'>): string {
  return `${file.name.toLowerCase()}::${file.size}`;
}

export function isDuplicateFile(a: MediaFileRef, b: MediaFileRef): boolean {
  return fileFingerprint(a) === fileFingerprint(b);
}
