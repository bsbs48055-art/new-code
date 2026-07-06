import { Moon, Sun, MonitorSmartphone } from 'lucide-react';
import { useTheme } from '@ui/hooks/useTheme';

const OPTIONS = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
  { value: 'system' as const, icon: MonitorSmartphone, label: 'System' },
];

/** Three-way light/dark/system theme switcher. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-1" style={{ background: 'var(--color-surface-alt)', borderRadius: 8, padding: 2 }}>
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          className="btn btn-icon"
          title={label}
          onClick={() => setTheme(value)}
          style={{
            background: theme === value ? 'var(--color-primary)' : 'transparent',
            color: theme === value ? 'var(--color-primary-contrast)' : 'var(--color-text-muted)',
          }}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
