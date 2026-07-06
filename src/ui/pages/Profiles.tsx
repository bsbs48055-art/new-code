import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { db } from '@shared/db/db';
import { profileRepository } from '@shared/db/repositories/profileRepository';
import type { ContentMetadataDefaults, PlatformId, PublishingProfile } from '@shared/types/index';
import { PLATFORM_LABELS } from '@shared/types/index';
import { useToastStore } from '@ui/state/toastStore';

const ALL_PLATFORMS: PlatformId[] = ['youtube', 'facebook', 'tiktok'];

const EMPTY_DEFAULTS: ContentMetadataDefaults = {
  privacyStatus: 'public',
  audience: 'unspecified',
};

/** Profile Manager: named, reusable publishing presets (e.g. "Gaming", "Shorts", "Tutorials"). */
export function Profiles() {
  const profiles = useLiveQuery(() => db.profiles.orderBy('updatedAt').reverse().toArray(), []) ?? [];
  const push = useToastStore((s) => s.push);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [platforms, setPlatforms] = useState<PlatformId[]>(['youtube']);
  const [defaults, setDefaults] = useState<ContentMetadataDefaults>(EMPTY_DEFAULTS);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPlatforms(['youtube']);
    setDefaults(EMPTY_DEFAULTS);
  };

  const startEdit = (profile: PublishingProfile) => {
    setEditingId(profile.id);
    setName(profile.name);
    setDescription(profile.description ?? '');
    setPlatforms(profile.platforms);
    setDefaults(profile.defaults);
  };

  const save = async () => {
    if (!name.trim()) {
      push('Give the profile a name first.', 'error');
      return;
    }
    if (editingId) {
      await profileRepository.update(editingId, { name, description, platforms, defaults });
      push(`Profile "${name}" updated.`, 'success');
    } else {
      await profileRepository.create({ name, description, platforms, defaults });
      push(`Profile "${name}" created.`, 'success');
    }
    resetForm();
  };

  const remove = async (id: string, profileName: string) => {
    await profileRepository.remove(id);
    push(`Profile "${profileName}" deleted.`, 'info');
    if (editingId === id) resetForm();
  };

  const togglePlatform = (p: PlatformId) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
      <div>
        <h2 style={{ marginTop: 0 }}>Publishing Profiles</h2>
        <div className="flex flex-col gap-3">
          {profiles.length === 0 && (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <p className="text-muted" style={{ margin: 0 }}>
                No profiles yet. Create one (e.g. "Gaming", "Shorts", "Tutorials") to reuse titles, tags, privacy, and playlists across uploads.
              </p>
            </div>
          )}
          {profiles.map((profile) => (
            <div key={profile.id} className="card" style={{ padding: 16 }}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontWeight: 700 }}>{profile.name}</div>
                  {profile.description && <div className="text-muted" style={{ fontSize: 12 }}>{profile.description}</div>}
                </div>
                <div className="flex items-center gap-1">
                  <button className="btn btn-ghost btn-icon" onClick={() => startEdit(profile)} title="Edit">
                    <Pencil size={15} />
                  </button>
                  <button className="btn btn-ghost btn-icon" onClick={() => remove(profile.id, profile.name)} title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="flex gap-1" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                {profile.platforms.map((p) => (
                  <span key={p} className="badge badge-queued">
                    {PLATFORM_LABELS[p]}
                  </span>
                ))}
                {profile.defaults.privacyStatus && <span className="badge badge-scheduled">{profile.defaults.privacyStatus}</span>}
              </div>
              {profile.defaults.tags && profile.defaults.tags.length > 0 && (
                <div className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>
                  Tags: {profile.defaults.tags.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 18, position: 'sticky', top: 0 }}>
        <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Profile' : 'New Profile'}</h3>
        <div className="field">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gaming Highlights" />
        </div>
        <div className="field">
          <label>Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes" />
        </div>
        <div className="field">
          <label>Platforms</label>
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
        <div className="field">
          <label>Default title template</label>
          <input
            value={defaults.titleTemplate ?? ''}
            onChange={(e) => setDefaults((d) => ({ ...d, titleTemplate: e.target.value }))}
            placeholder="e.g. {filename} — Episode"
          />
        </div>
        <div className="field">
          <label>Default description template</label>
          <textarea
            rows={3}
            value={defaults.descriptionTemplate ?? ''}
            onChange={(e) => setDefaults((d) => ({ ...d, descriptionTemplate: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Default tags (comma separated)</label>
          <input
            value={defaults.tags?.join(', ') ?? ''}
            onChange={(e) => setDefaults((d) => ({ ...d, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) }))}
          />
        </div>
        <div className="field">
          <label>Default hashtags (comma separated)</label>
          <input
            value={defaults.hashtags?.join(', ') ?? ''}
            onChange={(e) => setDefaults((d) => ({ ...d, hashtags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) }))}
          />
        </div>
        <div className="field">
          <label>Default privacy</label>
          <select
            value={defaults.privacyStatus ?? 'public'}
            onChange={(e) => setDefaults((d) => ({ ...d, privacyStatus: e.target.value as ContentMetadataDefaults['privacyStatus'] }))}
          >
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="flex gap-2" style={{ marginTop: 6 }}>
          <button className="btn btn-primary" onClick={save}>
            <Plus size={15} /> {editingId ? 'Save Changes' : 'Create Profile'}
          </button>
          {editingId && (
            <button className="btn btn-ghost" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
