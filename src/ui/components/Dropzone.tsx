import { useRef, useState } from 'react';
import { UploadCloud, FolderOpen, Files } from 'lucide-react';
import { flattenDataTransferItems } from '@shared/utils/fileUtils';

interface DropzoneProps {
  onFilesSelected: (files: File[], rootName: string) => void;
}

/** Drag-and-drop + folder/file picker surface for bulk content import. */
export function Dropzone({ onFilesSelected }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const items = event.dataTransfer.items;
    if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
      const files = await flattenDataTransferItems(items);
      onFilesSelected(files, files[0]?.webkitRelativePath?.split('/')[0] ?? 'Dropped files');
    } else {
      const files = Array.from(event.dataTransfer.files);
      onFilesSelected(files, 'Dropped files');
    }
  };

  const handleFolderInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const rootName = (files[0] as File & { webkitRelativePath?: string })?.webkitRelativePath?.split('/')[0] ?? 'Selected folder';
    onFilesSelected(files, rootName);
    event.target.value = '';
  };

  const handleFilesInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    onFilesSelected(files, 'Selected files');
    event.target.value = '';
  };

  return (
    <div
      className="card"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      style={{
        padding: 40,
        textAlign: 'center',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: isDragOver ? 'var(--color-primary)' : 'var(--color-border)',
        background: isDragOver ? 'rgba(109, 91, 255, 0.06)' : 'var(--color-surface)',
        transition: 'all 0.15s ease',
      }}
    >
      <UploadCloud size={40} color="var(--color-primary)" style={{ marginBottom: 10 }} />
      <p style={{ margin: '0 0 4px', fontWeight: 700 }}>Drag & drop videos, images, or a whole folder here</p>
      <p className="text-muted" style={{ margin: '0 0 18px', fontSize: 12 }}>
        Folders are auto-mapped: video/image files, thumbnail.jpg, subtitles, description.txt, tags.txt, schedule.csv, metadata.json
      </p>
      <div className="flex items-center justify-between" style={{ justifyContent: 'center', gap: 10 }}>
        <button className="btn btn-primary" onClick={() => filesInputRef.current?.click()}>
          <Files size={15} /> Select Files
        </button>
        <button className="btn btn-secondary" onClick={() => folderInputRef.current?.click()}>
          <FolderOpen size={15} /> Select Folder
        </button>
      </div>
      <input ref={filesInputRef} type="file" multiple hidden onChange={handleFilesInput} />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        hidden
        // @ts-expect-error webkitdirectory is a non-standard but widely supported attribute.
        webkitdirectory=""
        onChange={handleFolderInput}
      />
    </div>
  );
}
