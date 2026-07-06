import {
  LayoutDashboard,
  UploadCloud,
  ListChecks,
  History as HistoryIcon,
  Users,
  CalendarClock,
  BarChart3,
  Search as SearchIcon,
  Sparkles,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useUiStore } from '@ui/state/uiStore';
import { APP_NAME } from '@shared/constants';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/upload', label: 'Upload', icon: UploadCloud },
  { to: '/queue', label: 'Bulk Queue', icon: ListChecks },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/profiles', label: 'Profiles', icon: Users },
  { to: '/scheduler', label: 'Scheduler', icon: CalendarClock },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/seo', label: 'SEO Tools', icon: SearchIcon },
  { to: '/ai', label: 'AI Tools', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

/** Primary left-hand navigation for the dashboard shell. */
export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <aside
      className="card"
      style={{
        width: sidebarCollapsed ? 64 : 220,
        transition: 'width 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 10px',
        borderRadius: 0,
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        flexShrink: 0,
      }}
    >
      <div className="flex items-center justify-between" style={{ padding: '4px 6px 18px' }}>
        {!sidebarCollapsed && (
          <span style={{ fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden' }}>{APP_NAME}</span>
        )}
        <button className="btn btn-ghost btn-icon" onClick={toggleSidebar} title="Toggle sidebar">
          {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className="flex flex-col gap-1" style={{ flex: 1 }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2${isActive ? ' nav-active' : ''}`
            }
            style={({ isActive }) => ({
              padding: '9px 10px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? 'var(--color-primary-contrast)' : 'var(--color-text)',
              background: isActive ? 'var(--color-primary)' : 'transparent',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            })}
            title={label}
          >
            <Icon size={17} style={{ flexShrink: 0 }} />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
