/**
 * Manages the client-side "staging area" for content being prepared for
 * upload: turning dropped files / folder imports into editable items with
 * metadata, before they're handed off to the background queue.
 */

import { useCallback, useState } from 'react';
import type { ContentMetadata, FolderImportResult, MediaFileRef, MediaKind, MediaProbeResult, ThumbnailSelection } from '@shared/types/index';
import { generateId } from '@shared/utils/id';
import { detectMediaKindFromExtension, fileToMediaFileRef } from '@shared/utils/fileUtils';
import { probeMediaFile } from '@shared/utils/mediaProbe';
import { getBlob } from '@shared/db/blobStore';

export interface StagedItem {
  id: string;
  mediaKind: MediaKind;
  file: MediaFileRef;
  metadata: ContentMetadata;
  thumbnail?: ThumbnailSelection;
  probe?: MediaProbeResult;
}

function emptyMetadata(title: string, overrides?: Partial<ContentMetadata>): ContentMetadata {
  return {
    title,
    description: '',
    privacyStatus: 'public',
    audience: 'unspecified',
    ...overrides,
  };
}

export function useStagedUploads() {
  const [items, setItems] = useState<StagedItem[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);

  const probeInBackground = useCallback(async (itemId: string, fileRef: MediaFileRef) => {
    const blob = await getBlob(fileRef.blobKey);
    if (!blob) return;
    const probe = await probeMediaFile(blob instanceof File ? blob : new File([blob], fileRef.name, { type: fileRef.mimeType }));
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, probe } : item)));
  }, []);

  const addFromFolderImport = useCallback(
    (result: FolderImportResult) => {
      setBatchId(result.batchId);
      const overrides: Partial<ContentMetadata> = {
        description: result.descriptionText,
        tags: result.tags,
      };
      const pickThumbnail = (): ThumbnailSelection | undefined => {
        if (result.thumbnails.length === 0) return undefined;
        if (result.thumbnails.length === 1) return { strategy: 'custom', blobKey: result.thumbnails[0].blobKey };
        const randomIndex = Math.floor(Math.random() * result.thumbnails.length);
        return { strategy: 'random-from-folder', blobKey: result.thumbnails[randomIndex].blobKey };
      };

      const scheduleByFileName = new Map((result.scheduleRows ?? []).map((row) => [row.fileName.toLowerCase(), row]));

      const newItems: StagedItem[] = [...result.videos, ...result.images].map((fileRef) => {
        const scheduleRow = scheduleByFileName.get(fileRef.name.toLowerCase());
        const titleBase = fileRef.name.replace(/\.[^/.]+$/, '');
        return {
          id: generateId('staged'),
          mediaKind: result.videos.includes(fileRef) ? 'video' : 'image',
          file: fileRef,
          metadata: emptyMetadata(scheduleRow?.title ?? titleBase, overrides),
          thumbnail: pickThumbnail(),
        };
      });

      setItems((prev) => [...prev, ...newItems]);
      newItems.forEach((item) => void probeInBackground(item.id, item.file));
      return newItems;
    },
    [probeInBackground],
  );

  const addFromFlatFiles = useCallback(
    async (files: File[]) => {
      const newItems: StagedItem[] = [];
      for (const file of files) {
        const kind = detectMediaKindFromExtension(file.name);
        if (kind === 'unknown') continue;
        const fileRef = await fileToMediaFileRef(file);
        newItems.push({
          id: generateId('staged'),
          mediaKind: kind,
          file: fileRef,
          metadata: emptyMetadata(file.name.replace(/\.[^/.]+$/, '')),
        });
      }
      setItems((prev) => [...prev, ...newItems]);
      newItems.forEach((item) => void probeInBackground(item.id, item.file));
      return newItems;
    },
    [probeInBackground],
  );

  const updateItem = useCallback((id: string, patch: Partial<Pick<StagedItem, 'metadata' | 'thumbnail'>>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch, metadata: { ...item.metadata, ...patch.metadata } } : item)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setBatchId(null);
  }, []);

  const applyToAll = useCallback((patch: Partial<ContentMetadata>) => {
    setItems((prev) => prev.map((item) => ({ ...item, metadata: { ...item.metadata, ...patch } })));
  }, []);

  return { items, batchId, addFromFolderImport, addFromFlatFiles, updateItem, removeItem, clear, applyToAll };
}
