import { useEffect, useState } from 'react';
import { FileQuestion } from 'lucide-react';
import { getBlob } from '@shared/db/blobStore';
import type { MediaFileRef } from '@shared/types/index';

/** Renders a lazily-loaded video/image preview for a staged file, sourced from the local blob store. */
export function MediaPreview({ file, kind }: { file: MediaFileRef; kind: 'video' | 'image' }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    getBlob(file.blobKey).then((blob) => {
      if (blob) {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      }
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.blobKey]);

  const style: React.CSSProperties = {
    width: 96,
    height: 96,
    objectFit: 'cover',
    borderRadius: 8,
    background: 'var(--color-surface-alt)',
    flexShrink: 0,
  };

  if (!url) {
    return (
      <div className="flex items-center justify-center" style={style}>
        <FileQuestion size={22} color="var(--color-text-muted)" />
      </div>
    );
  }

  return kind === 'video' ? (
    <video src={url} style={style} muted preload="metadata" />
  ) : (
    <img src={url} alt={file.name} style={style} />
  );
}
