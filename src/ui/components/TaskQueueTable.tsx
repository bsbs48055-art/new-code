import { Pause, Play, X, RotateCcw, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import type { UploadTask } from '@shared/types/index';
import { PLATFORM_LABELS } from '@shared/types/index';
import { sendToBackground } from '@shared/messaging';
import { MESSAGE_TYPES } from '@shared/constants';
import { formatDurationShort } from '@shared/utils/dateUtils';
import { StatusBadge, PlatformTag } from '@ui/components/Badge';
import { ProgressBar } from '@ui/components/ProgressBar';
import { useToastStore } from '@ui/state/toastStore';

interface TaskQueueTableProps {
  tasks: UploadTask[];
  emptyMessage?: string;
}

/** Table of upload tasks with per-row pause/resume/cancel/retry/reorder controls. */
export function TaskQueueTable({ tasks, emptyMessage = 'No tasks to show.' }: TaskQueueTableProps) {
  const push = useToastStore((s) => s.push);

  const act = async (type: string, taskId: string, extra?: Record<string, unknown>) => {
    try {
      await sendToBackground(type, { taskId, ...extra });
    } catch (error) {
      push(`Action failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
            {['Content', 'Platform', 'Status', 'Progress', 'ETA', 'Actions'].map((h) => (
              <th key={h} className="text-muted" style={{ padding: '10px 14px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '10px 14px', maxWidth: 240 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.metadata.title || task.file.name}
                </div>
                <div className="text-muted" style={{ fontSize: 11 }}>
                  {task.file.name} · {(task.file.size / (1024 * 1024)).toFixed(1)} MB
                </div>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <PlatformTag platform={task.platform} label={PLATFORM_LABELS[task.platform]} />
              </td>
              <td style={{ padding: '10px 14px' }}>
                <StatusBadge status={task.status} />
                {task.error && (
                  <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4, maxWidth: 200 }}>{task.error}</div>
                )}
              </td>
              <td style={{ padding: '10px 14px', width: 140 }}>
                <ProgressBar value={task.progress} />
                <div className="text-muted" style={{ fontSize: 11, marginTop: 3 }}>{task.progress}%</div>
              </td>
              <td className="text-muted" style={{ padding: '10px 14px' }}>
                {task.status === 'uploading' && task.estimatedSecondsRemaining !== undefined
                  ? formatDurationShort(task.estimatedSecondsRemaining)
                  : '—'}
              </td>
              <td style={{ padding: '10px 14px' }}>
                <div className="flex items-center gap-1">
                  {task.status === 'uploading' && (
                    <button className="btn btn-ghost btn-icon" title="Pause" onClick={() => act(MESSAGE_TYPES.PAUSE_TASK, task.id)}>
                      <Pause size={15} />
                    </button>
                  )}
                  {(task.status === 'paused' || task.status === 'failed') && (
                    <button className="btn btn-ghost btn-icon" title="Resume" onClick={() => act(MESSAGE_TYPES.RESUME_TASK, task.id)}>
                      <Play size={15} />
                    </button>
                  )}
                  {task.status === 'failed' && (
                    <button className="btn btn-ghost btn-icon" title="Retry from scratch" onClick={() => act(MESSAGE_TYPES.RETRY_TASK, task.id)}>
                      <RotateCcw size={15} />
                    </button>
                  )}
                  {!['completed', 'canceled'].includes(task.status) && (
                    <button className="btn btn-ghost btn-icon" title="Cancel" onClick={() => act(MESSAGE_TYPES.CANCEL_TASK, task.id)}>
                      <X size={15} />
                    </button>
                  )}
                  {task.status === 'queued' && (
                    <>
                      <button
                        className="btn btn-ghost btn-icon"
                        title="Increase priority"
                        onClick={() => act(MESSAGE_TYPES.REORDER_TASK, task.id, { priority: task.priority + 1 })}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        title="Decrease priority"
                        onClick={() => act(MESSAGE_TYPES.REORDER_TASK, task.id, { priority: task.priority - 1 })}
                      >
                        <ArrowDown size={15} />
                      </button>
                    </>
                  )}
                  {task.platformContentUrl && (
                    <a href={task.platformContentUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-icon" title="View published content">
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
