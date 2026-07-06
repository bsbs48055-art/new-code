import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { db } from '@shared/db/db';
import { analyticsRepository } from '@shared/db/repositories/analyticsRepository';
import { sendToBackground } from '@shared/messaging';
import { MESSAGE_TYPES } from '@shared/constants';
import { PLATFORM_LABELS, type AnalyticsSnapshot, type PlatformId, type UploadTask } from '@shared/types/index';
import { StatCard } from '@ui/components/StatCard';
import { formatInTimeZone } from '@shared/utils/dateUtils';
import { useToastStore } from '@ui/state/toastStore';

const EMPTY_TASKS: UploadTask[] = [];
const EMPTY_SNAPSHOTS: AnalyticsSnapshot[] = [];

/** Analytics page: performance dashboard pulling real stats from each platform's official API. */
export function Analytics() {
  const [platform, setPlatform] = useState<PlatformId | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const push = useToastStore((s) => s.push);

  const publishedTasks = useLiveQuery(
    () => db.uploadTasks.where('status').equals('completed').and((t) => Boolean(t.platformContentId)).toArray(),
    [],
  ) ?? EMPTY_TASKS;
  const snapshots = useLiveQuery(() => db.analytics.toArray(), []) ?? EMPTY_SNAPSHOTS;

  const latestByContent = useMemo(() => {
    const map = new Map<string, AnalyticsSnapshot>();
    for (const snap of snapshots) {
      const existing = map.get(snap.contentId);
      if (!existing || existing.capturedAt < snap.capturedAt) map.set(snap.contentId, snap);
    }
    return Array.from(map.values()).filter((s) => (platform === 'all' ? true : s.platform === platform));
  }, [snapshots, platform]);

  const chartData = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const snap of snapshots) {
      if (platform !== 'all' && snap.platform !== platform) continue;
      const day = new Date(snap.capturedAt).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + (snap.views ?? 0));
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, views]) => ({ day, views }));
  }, [snapshots, platform]);

  const totals = useMemo(
    () => ({
      views: latestByContent.reduce((sum, s) => sum + (s.views ?? 0), 0),
      likes: latestByContent.reduce((sum, s) => sum + (s.likes ?? 0), 0),
      comments: latestByContent.reduce((sum, s) => sum + (s.comments ?? 0), 0),
    }),
    [latestByContent],
  );

  const refreshAll = async () => {
    setRefreshing(true);
    let updated = 0;
    for (const task of publishedTasks) {
      try {
        const response = await sendToBackground<{ taskId: string }, { ok: boolean; snapshot?: AnalyticsSnapshot }>(
          MESSAGE_TYPES.FETCH_ANALYTICS,
          { taskId: task.id },
        );
        if (response.ok && response.snapshot) {
          await analyticsRepository.upsertMany([response.snapshot]);
          updated += 1;
        }
      } catch {
        // Continue refreshing remaining tasks even if one platform call fails.
      }
    }
    setRefreshing(false);
    push(`Refreshed analytics for ${updated} item(s).`, updated > 0 ? 'success' : 'info');
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 style={{ marginTop: 0 }}>Analytics</h2>
        <div className="flex items-center gap-2">
          <select value={platform} onChange={(e) => setPlatform(e.target.value as PlatformId | 'all')} style={{ width: 160 }}>
            <option value="all">All platforms</option>
            {(Object.keys(PLATFORM_LABELS) as PlatformId[]).map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={refreshAll} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} /> {refreshing ? 'Refreshing…' : 'Refresh Analytics'}
          </button>
        </div>
      </div>

      <div className="flex gap-3" style={{ marginBottom: 16 }}>
        <StatCard label="Total views" value={totals.views.toLocaleString()} />
        <StatCard label="Total likes" value={totals.likes.toLocaleString()} />
        <StatCard label="Total comments" value={totals.comments.toLocaleString()} />
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16, height: 260 }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>Views over time</h3>
        {chartData.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 13 }}>
            No analytics captured yet. Click "Refresh Analytics" after publishing content.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" fontSize={11} stroke="var(--color-text-muted)" />
              <YAxis fontSize={11} stroke="var(--color-text-muted)" />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
              <Line type="monotone" dataKey="views" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Title', 'Platform', 'Views', 'Likes', 'Comments', 'Captured'].map((h) => (
                <th key={h} className="text-muted" style={{ padding: '10px 14px', fontSize: 11, textAlign: 'left' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {latestByContent.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted" style={{ padding: 20, textAlign: 'center' }}>
                  No published content with analytics yet.
                </td>
              </tr>
            ) : (
              latestByContent.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 14px' }}>{s.title}</td>
                  <td style={{ padding: '10px 14px' }}>{PLATFORM_LABELS[s.platform]}</td>
                  <td style={{ padding: '10px 14px' }}>{s.views?.toLocaleString() ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{s.likes?.toLocaleString() ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{s.comments?.toLocaleString() ?? '—'}</td>
                  <td className="text-muted" style={{ padding: '10px 14px' }}>{formatInTimeZone(s.capturedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
