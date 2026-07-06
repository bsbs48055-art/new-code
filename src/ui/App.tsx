import { HashRouter, Route, Routes } from 'react-router-dom';
import { Sidebar } from '@ui/components/Sidebar';
import { ThemeToggle } from '@ui/components/ThemeToggle';
import { ToastContainer } from '@ui/components/ToastContainer';
import { useTheme } from '@ui/hooks/useTheme';
import { Dashboard } from '@ui/pages/Dashboard';
import { Upload } from '@ui/pages/Upload';
import { Queue } from '@ui/pages/Queue';
import { History } from '@ui/pages/History';
import { Profiles } from '@ui/pages/Profiles';
import { Scheduler } from '@ui/pages/Scheduler';
import { Analytics } from '@ui/pages/Analytics';
import { SEOTools } from '@ui/pages/SEOTools';
import { AITools } from '@ui/pages/AITools';
import { Settings } from '@ui/pages/Settings';
import { APP_NAME } from '@shared/constants';

/** Root dashboard application, rendered inside the side panel (and reused conceptually by the popup). */
export function App() {
  useTheme();

  return (
    <HashRouter>
      <div className="flex" style={{ height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <div className="flex flex-col" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <header
            className="flex items-center justify-between"
            style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}
          >
            <span style={{ fontWeight: 700, fontSize: 13 }}>{APP_NAME}</span>
            <ThemeToggle />
          </header>
          <main className="scrollbar-thin" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/queue" element={<Queue />} />
              <Route path="/history" element={<History />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/scheduler" element={<Scheduler />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/seo" element={<SEOTools />} />
              <Route path="/ai" element={<AITools />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
      <ToastContainer />
    </HashRouter>
  );
}
