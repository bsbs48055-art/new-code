import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@shared/db/db';
import type { PlatformId, UploadStatus, UploadTask } from '@shared/types/index';
import { SearchAndFilter } from '@ui/components/SearchAndFilter';
import { TaskQueueTable } from '@ui/components/TaskQueueTable';

const ACTIVE_STATUSES: UploadStatus[] = ['queued', 'mapping', 'uploading', 'paused', 'processing', 'failed', 'scheduled'];
const EMPTY_TASKS: UploadTask[] = [];

/** Bulk Upload Queue page: every task that hasn't reached a terminal state, with search/filter and reordering. */
export function Queue() {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState<PlatformId | 'all'>('all');
  const [status, setStatus] = useState<UploadStatus | 'all'>('all');

  const tasks = useLiveQuery(() => db.uploadTasks.where('status').anyOf(ACTIVE_STATUSES).sortBy('priority'), []) ?? EMPTY_TASKS;

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => (platform === 'all' ? true : t.platform === platform))
      .filter((t) => (status === 'all' ? true : t.status === status))
      .filter((t) =>
        query.trim().length === 0
          ? true
          : `${t.metadata.title} ${t.file.name}`.toLowerCase().includes(query.toLowerCase()),
      )
      .reverse();
  }, [tasks, platform, status, query]);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Bulk Upload Queue</h2>
      <SearchAndFilter
        query={query}
        onQueryChange={setQuery}
        platform={platform}
        onPlatformChange={setPlatform}
        status={status}
        onStatusChange={setStatus}
        statusOptions={ACTIVE_STATUSES}
      />
      <TaskQueueTable tasks={filtered} emptyMessage="The queue is empty. Add content from the Upload page." />
    </div>
  );
}
