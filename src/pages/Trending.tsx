import { useEffect, useState } from 'react';
import { PageHeader, Skeleton, EmptyState } from '@/components/common/PageHeader';
import { ContentResultCard } from '@/components/search/ContentResultCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CATEGORIES, COUNTRIES, PLATFORMS } from '@/utils/constants';
import { fetchTrending } from '@/api/research';
import { useSettingsStore, useToastStore } from '@/store';
import { addHistory } from '@/services/ideas';
import type { ContentItem } from '@/types';
import { RefreshCw } from 'lucide-react';

export function TrendingPage() {
  const settings = useSettingsStore((s) => s.settings);
  const push = useToastStore((s) => s.push);
  const [country, setCountry] = useState(settings.defaultCountry);
  const [category, setCategory] = useState('');
  const [platform, setPlatform] = useState<string>(
    settings.defaultPlatform === 'all' ? 'trends' : settings.defaultPlatform,
  );
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchTrending({ country, category: category || undefined, platform });
      setItems(res.items);
      await addHistory({ action: 'trending', query: `${country}:${category || 'all'}`, resultCount: res.items.length });
    } catch (err) {
      push({
        title: 'Could not load trending',
        description: err instanceof Error ? err.message : 'Check backend/API keys',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-shell">
      <PageHeader
        title="Trending"
        description="Live and near-live trends from Google Trends, YouTube, Reddit, and News APIs."
        actions={
          <Button onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        }
      />
      <div className="glass-panel mb-6 grid gap-3 p-4 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLATFORMS.filter((p) => p.id !== 'all').map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button className="w-full" onClick={() => void load()} disabled={loading}>Apply</Button>
        </div>
      </div>
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : items.length ? (
          items.map((item, index) => <ContentResultCard key={item.id} item={item} index={index} />)
        ) : (
          <EmptyState title="No trending items" description="Try another country or platform, and verify API credentials." />
        )}
      </div>
    </div>
  );
}
