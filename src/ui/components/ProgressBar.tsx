/** Simple horizontal progress bar used for upload progress. */
export function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ background: 'var(--color-surface-alt)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.min(Math.max(value, 0), 100)}%`,
          height: '100%',
          background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
          transition: 'width 0.25s ease',
        }}
      />
    </div>
  );
}
