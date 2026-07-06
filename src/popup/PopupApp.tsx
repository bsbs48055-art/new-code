import { useLiveQuery } from 'dexie-react-hooks';
import { PanelRightOpen, UploadCloud, CheckCircle2, XCircle } from 'lucide-react';
import { db } from '@shared/db/db';
import { APP_NAME } from '@shared/constants';
import { PLATFORM_LABELS } from '@shared/types/index';
import { StatusBadge } from '@ui/components/Badge';
import { ProgressBar } from '@ui/components/ProgressBar';
import { ThemeToggle } from '@ui/components/ThemeToggle';
import { useTheme } from '@ui/hooks/useTheme';

async function openSidePanel(): Promise<void> {
  const currentWindow = await chrome.windows.getCurrent();
  if (currentWindow.id !== undefined) {
    await chrome.sidePanel.open({ windowId: currentWindow.id });
  }
  window.close();
}

function openOptionsPage(): void {
  chrome.runtime.openOptionsPage();
  window.close();
}

/** Compact popup: quick status snapshot plus a shortcut into the full side panel dashboard. */
export function PopupApp() {
  useTheme();
  const tasks = useLiveQuery(() => db.uploadTasks.orderBy('updatedAt').reverse().limit(5).toArray(), []) ?? [];
  const activeCount = useLiveQuery(
    () => db.uploadTasks.where('status').anyOf(['uploading', 'queued', 'paused']).count(),
    [],
  ) ?? 0;
  const completedCount = useLiveQuery(() => db.uploadTasks.where('status').equals('completed').count(), []) ?? 0;
  const failedCount = useLiveQuery(() => db.uploadTasks.where('status').equals('failed').count(), []) ?? 0;

  return (
    <div style={{ width: 340, padding: 14 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>{APP_NAME}</span>
        <ThemeToggle />
      </div>

      <div className="flex gap-2" style={{ marginBottom: 14 }}>
        <div className="card flex flex-col items-center" style={{ flex: 1, padding: 10 }}>
          <UploadCloud size={15} color="var(--color-primary)" />
          <strong style={{ fontSize: 16 }}>{activeCount}</strong>
          <span className="text-muted" style={{ fontSize: 10 }}>Active</span>
        </div>
        <div className="card flex flex-col items-center" style={{ flex: 1, padding: 10 }}>
          <CheckCircle2 size={15} color="var(--color-success)" />
          <strong style={{ fontSize: 16 }}>{completedCount}</strong>
          <span className="text-muted" style={{ fontSize: 10 }}>Done</span>
        </div>
        <div className="card flex flex-col items-center" style={{ flex: 1, padding: 10 }}>
          <XCircle size={15} color="var(--color-danger)" />
          <strong style={{ fontSize: 16 }}>{failedCount}</strong>
          <span className="text-muted" style={{ fontSize: 10 }}>Failed</span>
        </div>
      </div>

      <div className="flex flex-col gap-2" style={{ marginBottom: 14, maxHeight: 220, overflowY: 'auto' }}>
        {tasks.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 12, textAlign: 'center' }}>No uploads yet.</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="card" style={{ padding: 10 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                  {task.metadata.title || task.file.name}
                </span>
                <StatusBadge status={task.status} />
              </div>
              <div className="text-muted" style={{ fontSize: 10, marginBottom: 4 }}>{PLATFORM_LABELS[task.platform]}</div>
              <ProgressBar value={task.progress} />
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={openSidePanel}>
          <PanelRightOpen size={14} /> Open Dashboard
        </button>
        <button className="btn btn-secondary" onClick={openOptionsPage}>
          Settings
        </button>
      </div>
    </div>
  );
}
