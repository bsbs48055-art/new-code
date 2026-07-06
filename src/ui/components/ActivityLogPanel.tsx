import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { db } from '@shared/db/db';
import { formatInTimeZone } from '@shared/utils/dateUtils';
import { PLATFORM_LABELS } from '@shared/types/index';

const LEVEL_ICON = { success: CheckCircle2, warning: AlertTriangle, error: XCircle, info: Info };
const LEVEL_COLOR = {
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-danger)',
  info: 'var(--color-info)',
};

/** Scrollable feed of recent activity log entries (uploads, connections, errors). */
export function ActivityLogPanel({ limit = 50 }: { limit?: number }) {
  const entries = useLiveQuery(() => db.logs.orderBy('timestamp').reverse().limit(limit).toArray(), [limit]);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>Activity Log</h3>
        <span className="text-muted" style={{ fontSize: 12 }}>{entries?.length ?? 0} entries</span>
      </div>
      <div className="flex flex-col gap-2 scrollbar-thin" style={{ maxHeight: 340, overflowY: 'auto' }}>
        {!entries || entries.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 13 }}>No activity yet. Connect a platform or start an upload to see it here.</p>
        ) : (
          entries.map((entry) => {
            const Icon = LEVEL_ICON[entry.level];
            return (
              <div key={entry.id} className="flex items-start gap-2" style={{ fontSize: 13 }}>
                <Icon size={15} color={LEVEL_COLOR[entry.level]} style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div>{entry.message}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    {formatInTimeZone(entry.timestamp)}
                    {entry.platform ? ` · ${PLATFORM_LABELS[entry.platform]}` : ''}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
