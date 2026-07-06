import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@shared/db/db';
import type { PlatformId, UploadStatus, UploadTask } from '@shared/types/index';
import { SearchAndFilter } from '@ui/components/SearchAndFilter';
import { TaskQueueTable } from '@ui/components/TaskQueueTable';

const TERMINAL_STATUSES: UploadStatus[] = ['completed', 'failed', 'canceled'];
const EMPTY_TASKS: UploadTask[] = [];

/** History page: completed / failed / canceled uploads, searchable and filterable. */
export function History() {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState<PlatformId | 'all'>('all');
  const [status, setStatus] = useState<UploadStatus | 'all'>('all');

  const tasks = useLiveQuery(() => db.uploadTasks.where('status').anyOf(TERMINAL_STATUSES).reverse().sortBy('completedAt'), []) ?? EMPTY_TASKS;

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => (platform === 'all' ? true : t.platform === platform))
      .filter((t) => (status === 'all' ? true : t.status === status))
      .filter((t) =>
        query.trim().length === 0
          ? true
          : `${t.metadata.title} ${t.file.name}`.toLowerCase().includes(query.toLowerCase()),
      );
  }, [tasks, platform, status, query]);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const failedCount = tasks.filter((t) => t.status === 'failed').length;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>History</h2>
      <p className="text-muted" style={{ marginTop: -8, fontSize: 13 }}>
        {completedCount} completed · {failedCount} failed queue
      </p>
      <SearchAndFilter
        query={query}
        onQueryChange={setQuery}
        platform={platform}
        onPlatformChange={setPlatform}
        status={status}
        onStatusChange={setStatus}
        statusOptions={TERMINAL_STATUSES}
      />
      <TaskQueueTable tasks={filtered} emptyMessage="No completed, failed, or canceled uploads yet." />
    </div>
  );
}
