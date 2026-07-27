import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { ToastContainer } from '@/components/common/ToastContainer';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store';
import { APP_NAME } from '@/utils/constants';
import { Skeleton } from '@/components/common/PageHeader';

const DashboardPage = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.DashboardPage })));
const SearchPage = lazy(() => import('@/pages/Search').then((m) => ({ default: m.SearchPage })));
const TrendingPage = lazy(() => import('@/pages/Trending').then((m) => ({ default: m.TrendingPage })));
const KeywordExplorerPage = lazy(() =>
  import('@/pages/KeywordExplorer').then((m) => ({ default: m.KeywordExplorerPage })),
);
const HashtagExplorerPage = lazy(() =>
  import('@/pages/HashtagExplorer').then((m) => ({ default: m.HashtagExplorerPage })),
);
const TopicClustersPage = lazy(() =>
  import('@/pages/TopicClusters').then((m) => ({ default: m.TopicClustersPage })),
);
const SavedIdeasPage = lazy(() => import('@/pages/SavedIdeas').then((m) => ({ default: m.SavedIdeasPage })));
const ExportsPage = lazy(() => import('@/pages/Exports').then((m) => ({ default: m.ExportsPage })));
const HistoryPage = lazy(() => import('@/pages/History').then((m) => ({ default: m.HistoryPage })));
const AnalyticsPage = lazy(() => import('@/pages/Analytics').then((m) => ({ default: m.AnalyticsPage })));
const AIAssistantPage = lazy(() => import('@/pages/AIAssistant').then((m) => ({ default: m.AIAssistantPage })));
const SettingsPage = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.SettingsPage })));
const AboutPage = lazy(() => import('@/pages/About').then((m) => ({ default: m.AboutPage })));

function PageFallback() {
  return (
    <div className="page-shell space-y-3">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function DashboardApp() {
  const { loaded } = useAppBootstrap();
  useTheme();
  const user = useAuthStore((s) => s.user);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="flex min-h-screen gap-3 p-3">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass-panel mb-3 flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">
                {user ? `Signed in as ${user.displayName}` : 'Local research mode'}
              </p>
            </div>
            <ThemeToggle />
          </header>
          <main className="glass-panel min-h-0 flex-1 overflow-y-auto">
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/trending" element={<TrendingPage />} />
                <Route path="/keywords" element={<KeywordExplorerPage />} />
                <Route path="/hashtags" element={<HashtagExplorerPage />} />
                <Route path="/clusters" element={<TopicClustersPage />} />
                <Route path="/saved" element={<SavedIdeasPage />} />
                <Route path="/exports" element={<ExportsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/ai" element={<AIAssistantPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
        <ToastContainer />
      </div>
    </HashRouter>
  );
}
