import { Trash2 } from 'lucide-react';
import { useAppStore } from '../state/store';

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function Logs() {
  const logs = useAppStore((s) => s.logs);
  const clearLogs = useAppStore((s) => s.clearLogs);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">A live, local record of everything this app has done &mdash; connections, uploads, and errors.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => clearLogs()}>
          <Trash2 size={15} /> Clear
        </button>
      </div>

      <div className="card">
        {logs.length === 0 ? (
          <div className="empty-state">
            <p>No activity yet.</p>
          </div>
        ) : (
          <div className="log-list">
            {logs.map((entry) => (
              <div key={entry.id} className="log-row">
                <span className="log-time">{formatTime(entry.timestamp)}</span>
                <span className={`log-level log-level-${entry.level}`}>{entry.level}</span>
                <span className="log-message">
                  {entry.message}
                  {entry.detail && <span className="log-detail">{entry.detail}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
