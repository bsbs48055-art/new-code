import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@ui/state/toastStore';

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const COLORS = { success: 'var(--color-success)', error: 'var(--color-danger)', info: 'var(--color-info)' };

/** Renders transient toast notifications anchored to the bottom-right of the viewport. */
export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000 }}>
      {toasts.map((toast) => {
        const Icon = ICONS[toast.variant];
        return (
          <div
            key={toast.id}
            className="card flex items-center gap-2"
            style={{ padding: '10px 12px', minWidth: 240, maxWidth: 360, boxShadow: 'var(--shadow-lg)' }}
          >
            <Icon size={17} color={COLORS[toast.variant]} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, flex: 1 }}>{toast.message}</span>
            <button className="btn btn-ghost btn-icon" onClick={() => dismiss(toast.id)}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
