import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  TrendingUp,
  KeyRound,
  Hash,
  Network,
  Bookmark,
  Download,
  History,
  BarChart3,
  Sparkles,
  Settings,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { NAV_ITEMS, APP_NAME } from '@/utils/constants';
import { cn } from '@/utils/cn';
import { useUiStore } from '@/store';
import { Button } from '@/components/ui/button';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Search,
  TrendingUp,
  KeyRound,
  Hash,
  Network,
  Bookmark,
  Download,
  History,
  BarChart3,
  Sparkles,
  Settings,
  Info,
};

export function Sidebar() {
  const open = useUiStore((s) => s.sidebarOpen);
  const toggle = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        'glass-panel sticky top-3 z-20 flex h-[calc(100vh-1.5rem)] shrink-0 flex-col overflow-hidden transition-all duration-300',
        open ? 'w-64' : 'w-[72px]',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-4">
        <div className={cn('min-w-0', !open && 'sr-only')}>
          <p className="truncate text-sm font-semibold tracking-tight">{APP_NAME}</p>
          <p className="text-[11px] text-muted-foreground">Research Suite</p>
        </div>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle sidebar">
          {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
              title={item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className={cn('truncate', !open && 'sr-only')}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
