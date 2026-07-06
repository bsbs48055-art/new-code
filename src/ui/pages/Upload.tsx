import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { UploadCloud, Wand2 } from 'lucide-react';
import { db } from '@shared/db/db';
import type { PlatformId, RecurrenceRule } from '@shared/types/index';
import { PLATFORM_LABELS } from '@shared/types/index';
import { MESSAGE_TYPES } from '@shared/constants';
import { sendToBackground } from '@shared/messaging';
import { getLocalTimeZone, zonedLocalInputToEpoch } from '@shared/utils/dateUtils';
import { mapFolderImport } from '@shared/utils/fileUtils';
import type { EnqueueTaskInput } from '@background/uploadEngine/taskFactory';
import { Dropzone } from '@ui/components/Dropzone';
import { UploadItemCard } from '@ui/components/UploadItemCard';
import { useStagedUploads } from '@ui/hooks/useStagedUploads';
import { useToastStore } from '@ui/state/toastStore';

const ALL_PLATFORMS: PlatformId[] = ['youtube', 'facebook', 'tiktok'];

/** Upload page: drag & drop / folder import, per-item metadata editing, and bulk enqueue into the queue. */
export function Upload() {
  const { items, batchId, addFromFolderImport, addFromFlatFiles, updateItem, removeItem, clear, applyToAll } = useStagedUploads();
  const profiles = useLiveQuery(() => db.profiles.toArray(), []) ?? [];
  const push = useToastStore((s) => s.push);

  const [platforms, setPlatforms] = useState<PlatformId[]>(['youtube']);
  const [profileId, setProfileId] = useState<string>('');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledLocal, setScheduledLocal] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceRule['frequency']>('none');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applyTitleTemplate, setApplyTitleTemplate] = useState('');

  const timeZone = getLocalTimeZone();

  const onFilesSelected = async (files: File[], rootName: string) => {
    if (files.length === 0) return;
    const looksLikeFolder = files.some((f) => (f as File & { webkitRelativePath?: string }).webkitRelativePath?.includes('/'));
    if (looksLikeFolder) {
      const result = await mapFolderImport(files, rootName);
      const added = addFromFolderImport(result).length;
      push(
        `Imported "${rootName}": ${added} media file(s) mapped` +
          (result.unmatched.length ? `, ${result.unmatched.length} unmatched file(s) ignored.` : '.'),
        'success',
      );
    } else {
      const added = await addFromFlatFiles(files);
      if (added.length === 0) push('No supported video/image files found in selection.', 'error');
      else push(`Added ${added.length} file(s) to the staging area.`, 'success');
    }
  };

  const togglePlatform = (p: PlatformId) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const applyTitles = () => {
    if (!applyTitleTemplate.trim()) return;
    applyToAll({ title: applyTitleTemplate });
    push('Title template applied to all staged items.', 'info');
  };

  const totalSize = useMemo(() => items.reduce((sum, i) => sum + i.file.size, 0), [items]);

  const enqueueAll = async () => {
    if (items.length === 0) {
      push('Add at least one file before uploading.', 'error');
      return;
    }
    if (platforms.length === 0) {
      push('Select at least one destination platform.', 'error');
      return;
    }
    if (scheduleMode === 'later' && !scheduledLocal) {
      push('Pick a date/time for the scheduled upload.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const scheduledFor = scheduleMode === 'later' ? zonedLocalInputToEpoch(scheduledLocal, timeZone) : undefined;

      const recurrenceRule: RecurrenceRule | undefined =
        recurrence !== 'none' && scheduledFor ? { frequency: recurrence, interval: 1 } : undefined;

      const inputs: EnqueueTaskInput[] = [];
      for (const item of items) {
        for (const platform of platforms) {
          inputs.push({
            platform,
            mediaKind: item.mediaKind,
            file: item.file,
            metadata: item.metadata,
            probe: item.probe,
            thumbnail: item.thumbnail,
            profileId: profileId || undefined,
            batchId: batchId ?? undefined,
            scheduledFor,
            recurrence: recurrenceRule,
            skipIfDuplicate: skipDuplicates,
          });
        }
      }

      const result = await sendToBackground<EnqueueTaskInput[], { created: unknown[]; skippedDuplicates: number }>(
        MESSAGE_TYPES.ENQUEUE_TASKS,
        inputs,
      );

      push(
        `Enqueued ${result.created.length} upload(s)${result.skippedDuplicates ? `, skipped ${result.skippedDuplicates} duplicate(s)` : ''}.`,
        'success',
      );
      clear();
    } catch (error) {
      push(`Failed to enqueue uploads: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Upload</h2>

      <Dropzone onFilesSelected={onFilesSelected} />

      {items.length > 0 && (
        <>
          <div className="card" style={{ padding: 18, marginTop: 16 }}>
            <h3 style={{ marginTop: 0, fontSize: 14 }}>Publish Settings ({items.length} item{items.length > 1 ? 's' : ''}, {(totalSize / (1024 * 1024)).toFixed(1)} MB total)</h3>
            <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
              <div className="field" style={{ minWidth: 220 }}>
                <label>Destination platforms</label>
                <div className="flex gap-2">
                  {ALL_PLATFORMS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={platforms.includes(p) ? 'btn btn-primary' : 'btn btn-secondary'}
                      onClick={() => togglePlatform(p)}
                    >
                      {PLATFORM_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field" style={{ minWidth: 200 }}>
                <label>Publishing profile</label>
                <select value={profileId} onChange={(e) => setProfileId(e.target.value)}>
                  <option value="">None</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ minWidth: 200 }}>
                <label>When</label>
                <select value={scheduleMode} onChange={(e) => setScheduleMode(e.target.value as 'now' | 'later')}>
                  <option value="now">Upload now</option>
                  <option value="later">Schedule later</option>
                </select>
              </div>
              {scheduleMode === 'later' && (
                <>
                  <div className="field" style={{ minWidth: 200 }}>
                    <label>Date & time ({timeZone})</label>
                    <input type="datetime-local" value={scheduledLocal} onChange={(e) => setScheduledLocal(e.target.value)} />
                  </div>
                  <div className="field" style={{ minWidth: 160 }}>
                    <label>Repeat</label>
                    <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as RecurrenceRule['frequency'])}>
                      <option value="none">Does not repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
              />
              <span style={{ fontSize: 13 }}>Skip files that look like duplicates of an existing upload</span>
            </div>
            <div className="flex items-center gap-2" style={{ marginTop: 12 }}>
              <input
                value={applyTitleTemplate}
                onChange={(e) => setApplyTitleTemplate(e.target.value)}
                placeholder="Apply a title to every staged item…"
                style={{ maxWidth: 320 }}
              />
              <button className="btn btn-secondary" onClick={applyTitles}>
                <Wand2 size={14} /> Apply to all
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3" style={{ marginTop: 16 }}>
            {items.map((item) => (
              <UploadItemCard
                key={item.id}
                item={item}
                onChange={(patch) => updateItem(item.id, patch)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={clear}>
              Clear all
            </button>
            <button className="btn btn-primary" onClick={enqueueAll} disabled={submitting}>
              <UploadCloud size={16} /> {submitting ? 'Queuing…' : `Add ${items.length} item(s) to queue`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
