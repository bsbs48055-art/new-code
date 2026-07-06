import { Search } from 'lucide-react';
import type { PlatformId, UploadStatus } from '@shared/types/index';
import { PLATFORM_LABELS } from '@shared/types/index';

interface SearchAndFilterProps {
  query: string;
  onQueryChange: (value: string) => void;
  platform: PlatformId | 'all';
  onPlatformChange: (value: PlatformId | 'all') => void;
  status?: UploadStatus | 'all';
  onStatusChange?: (value: UploadStatus | 'all') => void;
  statusOptions?: UploadStatus[];
  placeholder?: string;
}

/** Reusable search input + platform/status filter row used on Queue/History pages. */
export function SearchAndFilter({
  query,
  onQueryChange,
  platform,
  onPlatformChange,
  status,
  onStatusChange,
  statusOptions,
  placeholder = 'Search by title or filename…',
}: SearchAndFilterProps) {
  return (
    <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-muted)' }} />
        <input style={{ paddingLeft: 32 }} value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder={placeholder} />
      </div>
      <select value={platform} onChange={(e) => onPlatformChange(e.target.value as PlatformId | 'all')} style={{ width: 160 }}>
        <option value="all">All platforms</option>
        {(Object.keys(PLATFORM_LABELS) as PlatformId[]).map((p) => (
          <option key={p} value={p}>
            {PLATFORM_LABELS[p]}
          </option>
        ))}
      </select>
      {statusOptions && onStatusChange && (
        <select value={status} onChange={(e) => onStatusChange(e.target.value as UploadStatus | 'all')} style={{ width: 160 }}>
          <option value="all">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
