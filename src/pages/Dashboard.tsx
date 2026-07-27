import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, Search, Sparkles, TrendingUp, BarChart3, Hash } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/common/PageHeader';
import { listIdeas, listHistory } from '@/services/ideas';
import { fetchTrending } from '@/api/research';
import { useSettingsStore, useToastStore } from '@/store';
import { ContentResultCard } from '@/components/search/ContentResultCard';
import type { ContentItem, HistoryEntry, SavedIdea } from '@/types';
import { formatNumber } from '@/utils/cn';

export function DashboardPage() {
  const settings = useSettingsStore((s) => s.settings);
  const push = useToastStore((s) => s.push);
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [trending, setTrending] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [ideaRows, histRows] = await Promise.all([listIdeas(), listHistory(8)]);
        if (cancelled) return;
        setIdeas(ideaRows);
        setHistory(histRows);
        try {
          const trend = await fetchTrending({
            country: settings.defaultCountry,
            platform: settings.defaultPlatform === 'all' ? 'trends' : settings.defaultPlatform,
          });
          if (!cancelled) setTrending(trend.items.slice(0, 4));
        } catch (err) {
          push({
            title: 'Trending unavailable',
            description: err instanceof Error ? err.message : 'Start the backend and add API keys.',
            variant: 'error',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [settings.defaultCountry, settings.defaultPlatform, push]);

  const stats = [
    { label: 'Saved Ideas', value: ideas.length, icon: Bookmark, to: '/saved' },
    { label: 'Recent Searches', value: history.length, icon: Search, to: '/history' },
    { label: 'Trending Now', value: trending.length, icon: TrendingUp, to: '/trending' },
    { label: 'Favorites', value: ideas.filter((i) => i.favorite).length, icon: Sparkles, to: '/saved' },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title="Dashboard"
        description="Discover trends, keywords, and content opportunities from official APIs."
        actions={
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/search">
                <Search className="h-4 w-4" /> New Search
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/ai">
                <Sparkles className="h-4 w-4" /> AI Assistant
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={s.to}>
              <Card className="transition hover:shadow-lift">
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-semibold">{formatNumber(s.value)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Trending Snapshot</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/trending">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : trending.length ? (
              trending.map((item, index) => <ContentResultCard key={item.id} item={item} index={index} />)
            ) : (
              <p className="text-sm text-muted-foreground">
                No trending data yet. Configure API keys and start the backend server.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              { to: '/keywords', label: 'Explore Keywords', icon: Search },
              { to: '/hashtags', label: 'Explore Hashtags', icon: Hash },
              { to: '/analytics', label: 'Open Analytics', icon: BarChart3 },
              { to: '/ai', label: 'Generate Hooks & Titles', icon: Sparkles },
            ].map((a) => (
              <Button key={a.to} variant="secondary" className="justify-start" asChild>
                <Link to={a.to}>
                  <a.icon className="h-4 w-4" /> {a.label}
                </Link>
              </Button>
            ))}
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent activity</p>
              {history.length ? (
                history.slice(0, 5).map((h) => (
                  <div key={h.id} className="rounded-xl bg-muted/60 px-3 py-2 text-xs">
                    <p className="font-medium">{h.action}</p>
                    <p className="text-muted-foreground">{h.query || new Date(h.createdAt).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Your searches and AI runs will appear here.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
