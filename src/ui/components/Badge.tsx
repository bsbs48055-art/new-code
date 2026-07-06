import type { UploadStatus } from '@shared/types/index';

/** Colored pill used to display an upload task's current status. */
export function StatusBadge({ status }: { status: UploadStatus }) {
  const labels: Record<UploadStatus, string> = {
    queued: 'Queued',
    mapping: 'Mapping',
    uploading: 'Uploading',
    paused: 'Paused',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    canceled: 'Canceled',
    scheduled: 'Scheduled',
  };
  return <span className={`badge badge-${status}`}>{labels[status]}</span>;
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#ff0000',
  facebook: '#1877f2',
  tiktok: '#111111',
};

/** Small colored dot + label identifying a platform. */
export function PlatformTag({ platform, label }: { platform: string; label: string }) {
  return (
    <span className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600 }}>
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: PLATFORM_COLORS[platform] ?? '#888',
        }}
      />
      {label}
    </span>
  );
}
