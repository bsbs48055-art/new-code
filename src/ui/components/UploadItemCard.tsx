import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { StagedItem } from '@ui/hooks/useStagedUploads';
import type { ContentMetadata } from '@shared/types/index';
import { MediaPreview } from '@ui/components/MediaPreview';
import { formatDurationShort } from '@shared/utils/dateUtils';

interface UploadItemCardProps {
  item: StagedItem;
  onChange: (patch: Partial<Pick<StagedItem, 'metadata' | 'thumbnail'>>) => void;
  onRemove: () => void;
}

/** Editable card for a single staged file: metadata form, thumbnail, and probed technical info. */
export function UploadItemCard({ item, onChange, onRemove }: UploadItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  const setField = <K extends keyof ContentMetadata>(field: K, value: ContentMetadata[K]) => {
    onChange({ metadata: { ...item.metadata, [field]: value } });
  };

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="flex items-start gap-3">
        <MediaPreview file={item.file} kind={item.mediaKind === 'image' ? 'image' : 'video'} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center justify-between">
            <input
              value={item.metadata.title}
              onChange={(e) => setField('title', e.target.value)}
              style={{ fontWeight: 700, fontSize: 14, border: 'none', padding: '4px 0', background: 'transparent' }}
              placeholder="Title"
            />
            <div className="flex items-center gap-1">
              <button className="btn btn-ghost btn-icon" onClick={() => setExpanded((v) => !v)} title="Edit details">
                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              <button className="btn btn-ghost btn-icon" onClick={onRemove} title="Remove">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <div className="text-muted" style={{ fontSize: 11 }}>
            {item.file.name} · {(item.file.size / (1024 * 1024)).toFixed(1)} MB
            {item.probe?.durationSeconds ? ` · ${formatDurationShort(item.probe.durationSeconds)}` : ''}
            {item.probe?.width && item.probe?.height ? ` · ${item.probe.width}×${item.probe.height}` : ''}
            {item.probe?.estimatedFps ? ` · ~${item.probe.estimatedFps}fps` : ''}
          </div>

          {expanded && (
            <div style={{ marginTop: 10 }}>
              <div className="field">
                <label>Description</label>
                <textarea rows={3} value={item.metadata.description} onChange={(e) => setField('description', e.target.value)} />
              </div>
              <div className="flex gap-3">
                <div className="field" style={{ flex: 1 }}>
                  <label>Tags (comma separated)</label>
                  <input
                    value={item.metadata.tags?.join(', ') ?? ''}
                    onChange={(e) => setField('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
                  />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Hashtags (comma separated)</label>
                  <input
                    value={item.metadata.hashtags?.join(', ') ?? ''}
                    onChange={(e) => setField('hashtags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="field" style={{ flex: 1 }}>
                  <label>Category</label>
                  <input value={item.metadata.category ?? ''} onChange={(e) => setField('category', e.target.value)} placeholder="e.g. Gaming" />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Playlist ID (YouTube)</label>
                  <input value={item.metadata.playlistId ?? ''} onChange={(e) => setField('playlistId', e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="field" style={{ flex: 1 }}>
                  <label>Privacy</label>
                  <select value={item.metadata.privacyStatus} onChange={(e) => setField('privacyStatus', e.target.value as ContentMetadata['privacyStatus'])}>
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Audience</label>
                  <select value={item.metadata.audience} onChange={(e) => setField('audience', e.target.value as ContentMetadata['audience'])}>
                    <option value="unspecified">Unspecified</option>
                    <option value="made_for_kids">Made for kids</option>
                    <option value="not_made_for_kids">Not made for kids</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="field" style={{ flex: 1 }}>
                  <label>Location</label>
                  <input value={item.metadata.location ?? ''} onChange={(e) => setField('location', e.target.value)} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Language</label>
                  <input value={item.metadata.language ?? ''} onChange={(e) => setField('language', e.target.value)} placeholder="en" />
                </div>
              </div>
              {item.probe?.container && (
                <p className="text-muted" style={{ fontSize: 11 }}>
                  {item.probe.container} · {item.probe.videoCodecGuess ?? 'codec unknown'}
                  {item.probe.estimatedBitrateKbps ? ` · ~${item.probe.estimatedBitrateKbps} kbps` : ''}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
