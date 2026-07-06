import { useLiveQuery } from 'dexie-react-hooks';
import { UploadCloud, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { db } from '@shared/db/db';
import { PLATFORM_LABELS, type PlatformId } from '@shared/types/index';
import { StatCard } from '@ui/components/StatCard';
import { ActivityLogPanel } from '@ui/components/ActivityLogPanel';
import { TaskQueueTable } from '@ui/components/TaskQueueTable';
import { useAuthStates } from '@ui/hooks/useAuthStates';
import { Link } from 'react-router-dom';

function isToday(timestamp: number): boolean {
  const d = new Date(timestamp);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

/** Landing page: at-a-glance KPIs, platform connection status, live queue, and activity log. */
export function Dashboard() {
  const tasks = useLiveQuery(() => db.uploadTasks.toArray(), []) ?? [];
  const authStates = useAuthStates();

  const active = tasks.filter((t) => ['uploading', 'queued', 'paused', 'mapping', 'processing'].includes(t.status));
  const completedToday = tasks.filter((t) => t.status === 'completed' && t.completedAt && isToday(t.completedAt));
  const failed = tasks.filter((t) => t.status === 'failed');
  const scheduled = tasks.filter((t) => t.status === 'scheduled');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
        <StatCard label="Active in queue" value={active.length} icon={<UploadCloud size={16} />} accentColor="var(--color-primary)" />
        <StatCard label="Completed today" value={completedToday.length} icon={<CheckCircle2 size={16} />} accentColor="var(--color-success)" />
        <StatCard label="Failed uploads" value={failed.length} icon={<XCircle size={16} />} accentColor="var(--color-danger)" />
        <StatCard label="Scheduled" value={scheduled.length} icon={<Clock size={16} />} accentColor="var(--color-accent)" />
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0, fontSize: 15 }}>Connected Platforms</h3>
        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          {authStates.map((state) => (
            <div
              key={state.platform}
              className="flex items-center justify-between"
              style={{
                flex: '1 1 200px',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{PLATFORM_LABELS[state.platform as PlatformId]}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>
                  {state.connected ? state.accountLabel ?? 'Connected' : 'Not connected'}
                </div>
              </div>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: state.connected ? 'var(--color-success)' : 'var(--color-text-muted)',
                }}
              />
            </div>
          ))}
        </div>
        {authStates.every((s) => !s.connected) && (
          <p className="text-muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
            No platforms connected yet. Go to <Link to="/settings">Settings</Link> to connect Facebook, YouTube, or TikTok.
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="flex flex-col gap-2">
          <h3 style={{ margin: '0 0 4px' }}>Live Queue</h3>
          <TaskQueueTable tasks={active.slice(0, 8)} emptyMessage="Nothing is uploading right now. Head to Upload to add content." />
        </div>
        <ActivityLogPanel limit={12} />
      </div>
    </div>
  );
}
