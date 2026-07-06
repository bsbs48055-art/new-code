import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UploadCloud, ScrollText, Settings as SettingsIcon } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/accounts', label: 'Accounts', icon: Users },
  { to: '/upload', label: 'Upload', icon: UploadCloud },
  { to: '/logs', label: 'Activity Log', icon: ScrollText },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">TM</div>
        <div>
          <div className="brand-title">TikTok Multi Uploader</div>
          <div className="brand-subtitle">by Faizan Automation</div>
        </div>
      </div>

      <nav className="nav-list">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        Publishes only through TikTok&rsquo;s official Content Posting API.
        <br />
        No passwords are ever seen by this app.
      </div>
    </aside>
  );
}
