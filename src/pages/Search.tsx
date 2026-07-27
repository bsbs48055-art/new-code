import { useState } from 'react';
import { PageHeader, EmptyState, Skeleton } from '@/components/common/PageHeader';
import { SearchFiltersPanel } from '@/components/search/SearchFiltersPanel';
import { ContentResultCard } from '@/components/search/ContentResultCard';
import { useSearchStore, useSettingsStore, useToastStore } from '@/store';
import { searchContent } from '@/api/research';
import { addHistory } from '@/services/ideas';
import { exportGenericRows } from '@/services/export';
import { Button } from '@/components/ui/button';
import type { ContentItem } from '@/types';
import { Download } from 'lucide-react';

export function SearchPage() {
  const { filters, setFilters, resetFilters } = useSearchStore();
  const settings = useSettingsStore((s) => s.settings);
  const push = useToastStore((s) => s.push);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async () => {
    if (!filters.keyword.trim() && !filters.category) {
      push({ title: 'Enter a keyword or pick a category', variant: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await searchContent({
        ...filters,
        country: filters.country || settings.defaultCountry,
        language: filters.language || settings.language,
      });
      setItems(res.items);
      setSearched(true);
      await addHistory({
        action: 'search',
        query: filters.keyword || filters.category,
        filters,
        resultCount: res.items.length,
      });
      if (settings.notifications) {
        push({ title: `Found ${res.items.length} results`, variant: 'success' });
      }
    } catch (err) {
      push({
        title: 'Search failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Search"
        description="Search by keyword, category, country, language, platform, date range, and engagement signals."
        actions={
          items.length ? (
            <Button
              variant="outline"
              onClick={() =>
                void exportGenericRows(
                  items.map((i) => ({
                    title: i.title,
                    platform: i.platform,
                    engagement: i.engagement ?? '',
                    growth: i.growth ?? '',
                    url: i.url ?? '',
                    source: i.source,
                  })),
                  'csv',
                  'search-results',
                )
              }
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          ) : null
        }
      />
      <SearchFiltersPanel
        filters={filters}
        onChange={setFilters}
        onSearch={() => void runSearch()}
        onReset={resetFilters}
        loading={loading}
      />
      <div className="mt-6 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : items.length ? (
          items.map((item, index) => <ContentResultCard key={item.id} item={item} index={index} />)
        ) : searched ? (
          <EmptyState title="No results" description="Try a broader keyword, different country, or another platform." />
        ) : (
          <EmptyState
            title="Ready to hunt"
            description="Use official YouTube, Reddit, News, Google Trends, and RSS sources to discover content opportunities."
          />
        )}
      </div>
    </div>
  );
}
