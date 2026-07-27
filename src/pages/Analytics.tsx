import { useState } from 'react';
import { PageHeader, Skeleton } from '@/components/common/PageHeader';
import { Input, Label, Badge } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendAreaChart, CountryBarChart } from '@/components/charts/TrendCharts';
import { COUNTRIES } from '@/utils/constants';
import { fetchAnalytics } from '@/api/research';
import { useSettingsStore, useToastStore } from '@/store';
import { addHistory } from '@/services/ideas';
import type { AnalyticsSnapshot } from '@/types';
import { formatNumber, formatPercent, scoreColor } from '@/utils/cn';

export function AnalyticsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const push = useToastStore((s) => s.push);
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState(settings.defaultCountry);
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const snap = await fetchAnalytics(keyword.trim(), country);
      setData(snap);
      await addHistory({ action: 'analytics', query: keyword, resultCount: 1 });
    } catch (err) {
      push({ title: 'Analytics failed', description: err instanceof Error ? err.message : '', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader title="Analytics" description="Search volume, trend curves, growth, competition, seasonality, and related queries." />
      <div className="glass-panel mb-6 grid gap-3 p-4 md:grid-cols-3">
        <div className="space-y-1.5 md:col-span-2">
          <Label>Keyword / Topic</Label>
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void load()} />
        </div>
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3">
          <Button onClick={() => void load()} disabled={loading}>{loading ? 'Loading…' : 'Analyze'}</Button>
        </div>
      </div>

      {loading ? <Skeleton className="h-72 w-full" /> : null}

      {data ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Search Volume</p><p className="text-2xl font-semibold">{formatNumber(data.searchVolume)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Growth %</p><p className="text-2xl font-semibold">{formatPercent(data.growth)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Competition</p><p className="text-2xl font-semibold">{data.competition}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Opportunity</p><p className={`text-2xl font-semibold ${scoreColor(data.opportunityScore)}`}>{data.opportunityScore}</p></CardContent></Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Trend Curve</CardTitle></CardHeader>
              <CardContent><TrendAreaChart data={data.trendCurve} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Interest By Time</CardTitle></CardHeader>
              <CardContent><TrendAreaChart data={data.interestByTime} color="#32ade6" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Interest By Country</CardTitle></CardHeader>
              <CardContent><CountryBarChart data={data.interestByCountry} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Seasonality</CardTitle></CardHeader>
              <CardContent><TrendAreaChart data={data.seasonality} color="#34c759" /></CardContent>
            </Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Related Queries</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">{data.relatedQueries.map((q) => <Badge key={q} variant="secondary">{q}</Badge>)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Related Topics</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">{data.relatedTopics.map((q) => <Badge key={q}>{q}</Badge>)}</CardContent>
            </Card>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">SEO Score</p><p className={`text-2xl font-semibold ${scoreColor(data.seoScore)}`}>{data.seoScore}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Content Difficulty</p><p className="text-2xl font-semibold">{data.difficulty}</p></CardContent></Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
