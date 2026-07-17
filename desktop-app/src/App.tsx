import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Upload from './pages/Upload';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import { useAppStore } from './state/store';

export default function App() {
  const init = useAppStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
