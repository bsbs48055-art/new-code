import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UploadCloud, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../state/store';

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const accounts = useAppStore((s) => s.accounts);
  const uploadJobs = useAppStore((s) => s.uploadJobs);
  const logs = useAppStore((s) => s.logs);
  const settings = useAppStore((s) => s.settings);

  const stats = useMemo(() => {
    const allTargets = uploadJobs.flatMap((j) => j.targets);
    const success = allTargets.filter((t) => t.status === 'success').length;
    const failed = allTargets.filter((t) => t.status === 'failed').length;
    return { totalVideos: uploadJobs.length, totalPosts: allTargets.length, success, failed };
  }, [uploadJobs]);

  const configured = Boolean(settings?.tiktokClientKey && settings.hasTikTokClientSecret);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Overview of your connected TikTok accounts and recent publishing activity.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/upload')}>
          <UploadCloud size={16} /> New Upload
        </button>
      </div>

      {!configured && (
        <div className="banner banner-warning">
          <strong>Setup needed:</strong> add your TikTok Developer app&rsquo;s Client Key and Client Secret in{' '}
          <span className="link" onClick={() => navigate('/settings')}>
            Settings
          </span>{' '}
          before you can connect accounts and upload videos.
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-label">Connected accounts</div>
          <div className="stat-card-value">{accounts.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Videos queued</div>
          <div className="stat-card-value">{stats.totalVideos}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Successful posts</div>
          <div className="stat-card-value">{stats.success}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Failed posts</div>
          <div className="stat-card-value">{stats.failed}</div>
        </div>
      </div>

      <div className="field-row">
        <div className="card">
          <h2 className="card-title">Connected accounts</h2>
          <p className="card-subtitle">The TikTok accounts this app can currently publish to.</p>
          {accounts.length === 0 ? (
            <div className="empty-state">
              <Users />
              <p>No accounts connected yet.</p>
              <button className="btn btn-secondary" onClick={() => navigate('/accounts')}>
                Connect a TikTok account
              </button>
            </div>
          ) : (
            <div className="account-grid">
              {accounts.slice(0, 4).map((account) => (
                <div key={account.id} className="account-card">
                  <div className="account-header">
                    <div className="avatar">
                      {account.avatarUrl ? <img src={account.avatarUrl} alt="" /> : account.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="account-name">{account.displayName}</div>
                      <div className="account-meta">Connected {timeAgo(account.connectedAt)}</div>
                    </div>
                  </div>
                  {account.isUnaudited ? (
                    <span className="badge badge-warning">
                      <AlertTriangle size={11} /> Private only
                    </span>
                  ) : (
                    <span className="badge badge-success">
                      <CheckCircle2 size={11} /> Ready
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Recent activity</h2>
          <p className="card-subtitle">The latest events from the automation engine.</p>
          {logs.length === 0 ? (
            <div className="empty-state">
              <p>Nothing has happened yet.</p>
            </div>
          ) : (
            <div className="log-list">
              {logs.slice(0, 8).map((entry) => (
                <div key={entry.id} className="log-row">
                  <span className="log-time">{timeAgo(entry.timestamp)}</span>
                  <span className={`log-level log-level-${entry.level}`}>{entry.level}</span>
                  <span className="log-message">{entry.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
