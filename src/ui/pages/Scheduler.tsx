import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarClock, X } from 'lucide-react';
import { db } from '@shared/db/db';
import { PLATFORM_LABELS, type UploadTask } from '@shared/types/index';
import { formatInTimeZone, getLocalTimeZone, zonedLocalInputToEpoch } from '@shared/utils/dateUtils';
import { sendToBackground } from '@shared/messaging';
import { MESSAGE_TYPES } from '@shared/constants';
import { uploadRepository } from '@shared/db/repositories/uploadRepository';
import { useToastStore } from '@ui/state/toastStore';

const EMPTY_TASKS: UploadTask[] = [];

/** Scheduler page: calendar-style list of upcoming scheduled/recurring uploads with reschedule support. */
export function Scheduler() {
  const tasks = useLiveQuery(() => db.uploadTasks.where('status').equals('scheduled').sortBy('scheduledFor'), []) ?? EMPTY_TASKS;
  const push = useToastStore((s) => s.push);
  const timeZone = getLocalTimeZone();

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof tasks>();
    for (const task of tasks) {
      const dateLabel = task.scheduledFor
        ? new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeZone }).format(new Date(task.scheduledFor))
        : 'Unscheduled';
      if (!groups.has(dateLabel)) groups.set(dateLabel, []);
      groups.get(dateLabel)!.push(task);
    }
    return Array.from(groups.entries());
  }, [tasks, timeZone]);

  const reschedule = async (taskId: string, localValue: string) => {
    const epoch = zonedLocalInputToEpoch(localValue, timeZone);
    await uploadRepository.update(taskId, { scheduledFor: epoch });
    push('Reschedule saved.', 'success');
  };

  const cancel = async (taskId: string) => {
    await sendToBackground(MESSAGE_TYPES.CANCEL_TASK, { taskId });
    push('Scheduled upload canceled.', 'info');
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 style={{ marginTop: 0 }}>Scheduler</h2>
        <span className="text-muted" style={{ fontSize: 12 }}>Time zone: {timeZone}</span>
      </div>

      {grouped.length === 0 && (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <CalendarClock size={28} color="var(--color-text-muted)" style={{ marginBottom: 8 }} />
          <p className="text-muted" style={{ margin: 0 }}>
            No scheduled uploads. Schedule content for later from the Upload page.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {grouped.map(([dateLabel, items]) => (
          <div key={dateLabel}>
            <h4 className="text-muted" style={{ margin: '0 0 8px', fontSize: 12, textTransform: 'uppercase' }}>{dateLabel}</h4>
            <div className="flex flex-col gap-2">
              {items.map((task) => (
                <div key={task.id} className="card flex items-center justify-between" style={{ padding: 14 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{task.metadata.title || task.file.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {PLATFORM_LABELS[task.platform]} · {task.scheduledFor ? formatInTimeZone(task.scheduledFor, timeZone) : '—'}
                      {task.recurrence && task.recurrence.frequency !== 'none' ? ` · Repeats ${task.recurrence.frequency}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      style={{ width: 200 }}
                      defaultValue={task.scheduledFor ? new Date(task.scheduledFor).toISOString().slice(0, 16) : ''}
                      onBlur={(e) => e.target.value && reschedule(task.id, e.target.value)}
                    />
                    <button className="btn btn-ghost btn-icon" onClick={() => cancel(task.id)} title="Cancel">
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
