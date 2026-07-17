import { useMemo, useState } from 'react';
import { FileVideo, UploadCloud, XCircle, CheckCircle2, Loader2, Clock, ExternalLink } from 'lucide-react';
import { useAppStore } from '../state/store';
import type { PrivacyLevel, UploadStatus } from '../../electron/types';

const PRIVACY_LABELS: Record<PrivacyLevel, string> = {
  PUBLIC_TO_EVERYONE: 'Public',
  MUTUAL_FOLLOW_FRIENDS: 'Friends (mutual follows)',
  FOLLOWER_OF_CREATOR: 'Followers',
  SELF_ONLY: 'Only me (private)',
};

const STATUS_META: Record<UploadStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  queued: { label: 'Queued', className: 'badge-muted', icon: Clock },
  uploading: { label: 'Uploading', className: 'badge-warning', icon: Loader2 },
  processing: { label: 'Processing', className: 'badge-warning', icon: Loader2 },
  success: { label: 'Posted', className: 'badge-success', icon: CheckCircle2 },
  failed: { label: 'Failed', className: 'badge-danger', icon: XCircle },
  canceled: { label: 'Canceled', className: 'badge-muted', icon: XCircle },
};

export default function Upload() {
  const accounts = useAppStore((s) => s.accounts);
  const uploadJobs = useAppStore((s) => s.uploadJobs);
  const settings = useAppStore((s) => s.settings);

  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [videoSize, setVideoSize] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('SELF_ONLY');
  const [disableComment, setDisableComment] = useState(false);
  const [disableDuet, setDisableDuet] = useState(false);
  const [disableStitch, setDisableStitch] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = Boolean(settings?.tiktokClientKey && settings.hasTikTokClientSecret);

  async function handlePickVideo() {
    const result = await window.api.uploads.pickVideo();
    if (result.canceled || !result.path) return;
    setVideoPath(result.path);
    setVideoName(result.fileName ?? null);
    setVideoSize(result.sizeBytes ?? null);
  }

  function toggleAccount(accountId: string) {
    setSelectedAccountIds((prev) => (prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]));
  }

  async function handleSubmit() {
    setError(null);
    if (!videoPath) {
      setError('Choose a video file first.');
      return;
    }
    if (selectedAccountIds.length === 0) {
      setError('Select at least one connected account.');
      return;
    }
    setSubmitting(true);
    try {
      await window.api.uploads.start({
        videoPath,
        title,
        privacyLevel,
        disableComment,
        disableDuet,
        disableStitch,
        accountIds: selectedAccountIds,
      });
      setVideoPath(null);
      setVideoName(null);
      setVideoSize(null);
      setTitle('');
      setSelectedAccountIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const sizeLabel = useMemo(() => {
    if (!videoSize) return null;
    const mb = videoSize / (1024 * 1024);
    return mb > 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
  }, [videoSize]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Upload</h1>
          <p className="page-subtitle">
            Pick one video, write a caption, choose which connected accounts should post it, and this app publishes
            to each one sequentially through TikTok&rsquo;s official Content Posting API.
          </p>
        </div>
      </div>

      {!configured && (
        <div className="banner banner-warning">Finish setup in Settings before you can upload.</div>
      )}
      {accounts.length === 0 && configured && (
        <div className="banner banner-info">Connect at least one TikTok account on the Accounts page first.</div>
      )}
      {error && <div className="banner banner-warning">{error}</div>}

      <div className="field-row">
        <div className="card">
          <h2 className="card-title">1. Video &amp; caption</h2>
          <div className="form-group">
            <label className="form-label">Video file</label>
            <div className="picker-row">
              <div className="file-chip">
                <FileVideo size={16} />
                <span>{videoName ?? 'No file selected'}</span>
              </div>
              <button className="btn btn-secondary" onClick={handlePickVideo}>
                Browse&hellip;
              </button>
            </div>
            {sizeLabel && <div className="form-hint">{sizeLabel}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Caption / description</label>
            <textarea
              className="textarea"
              placeholder="Write a caption with #hashtags and @mentions…"
              value={title}
              maxLength={2200}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="form-hint">{title.length}/2200 characters</div>
          </div>

          <div className="form-group">
            <label className="form-label">Privacy</label>
            <select className="input" value={privacyLevel} onChange={(e) => setPrivacyLevel(e.target.value as PrivacyLevel)}>
              {Object.entries(PRIVACY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <div className="form-hint">
              If an account&rsquo;s app audit status doesn&rsquo;t allow the level you pick, TikTok automatically
              restricts that post to “Only me” &mdash; this is enforced by TikTok, not by this app.
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-row">
              <input type="checkbox" checked={disableComment} onChange={(e) => setDisableComment(e.target.checked)} />
              Turn off comments
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={disableDuet} onChange={(e) => setDisableDuet(e.target.checked)} />
              Turn off duets
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={disableStitch} onChange={(e) => setDisableStitch(e.target.checked)} />
              Turn off stitches
            </label>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">2. Choose accounts</h2>
          <p className="card-subtitle">Pick every account this video should be posted to.</p>
          {accounts.length === 0 ? (
            <div className="empty-state">
              <p>No connected accounts yet.</p>
            </div>
          ) : (
            <div className="account-select-list">
              {accounts.map((account) => (
                <label
                  key={account.id}
                  className={`account-select-item${selectedAccountIds.includes(account.id) ? ' selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAccountIds.includes(account.id)}
                    onChange={() => toggleAccount(account.id)}
                  />
                  {account.displayName}
                </label>
              ))}
            </div>
          )}

          <div className="form-group" style={{ marginTop: 20 }}>
            <button
              className="btn btn-primary"
              disabled={submitting || !configured || accounts.length === 0}
              onClick={handleSubmit}
              style={{ width: '100%' }}
            >
              {submitting ? <span className="spinner" /> : <UploadCloud size={16} />}
              Upload to {selectedAccountIds.length || 0} account{selectedAccountIds.length === 1 ? '' : 's'}
            </button>
            <div className="form-hint">
              Accounts are posted to one at a time with a short pause in between (configurable in Settings) to keep
              activity looking natural.
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Upload queue &amp; history</h2>
        {uploadJobs.length === 0 ? (
          <div className="empty-state">
            <p>Nothing uploaded yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Video</th>
                <th>Account</th>
                <th>Status</th>
                <th>Progress</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {uploadJobs.flatMap((job) =>
                job.targets.map((target) => {
                  const meta = STATUS_META[target.status];
                  const Icon = meta.icon;
                  return (
                    <tr key={`${job.id}:${target.accountId}`}>
                      <td>{job.videoFileName}</td>
                      <td>{target.accountName}</td>
                      <td>
                        <span className={`badge ${meta.className}`}>
                          <Icon size={11} className={target.status === 'uploading' ? 'spin' : ''} />
                          {meta.label}
                        </span>
                        {target.error && <div className="form-hint">{target.error}</div>}
                      </td>
                      <td style={{ width: 160 }}>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${target.progress}%` }} />
                        </div>
                      </td>
                      <td>
                        {target.postUrl && (
                          <button className="btn btn-secondary" onClick={() => window.api.app.openExternal(target.postUrl!)}>
                            <ExternalLink size={12} /> View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
