import { useState } from 'react';
import { PageHeader, Skeleton } from '@/components/common/PageHeader';
import { Input, Label, Badge } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendAreaChart, CountryBarChart } from '@/components/charts/TrendCharts';
import { COUNTRIES, LANGUAGES } from '@/utils/constants';
import { exploreKeyword } from '@/api/research';
import { expandKeywords } from '@/api/ai';
import { useSettingsStore, useToastStore } from '@/store';
import { addHistory, saveIdea } from '@/services/ideas';
import type { KeywordInsight } from '@/types';
import { formatNumber, formatPercent, scoreColor } from '@/utils/cn';
import { BookmarkPlus, Sparkles } from 'lucide-react';

export function KeywordExplorerPage() {
  const settings = useSettingsStore((s) => s.settings);
  const push = useToastStore((s) => s.push);
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState(settings.defaultCountry);
  const [language, setLanguage] = useState(settings.language);
  const [insight, setInsight] = useState<KeywordInsight | null>(null);
  const [expanded, setExpanded] = useState('');
  const [loading, setLoading] = useState(false);

  const explore = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const data = await exploreKeyword(keyword.trim(), country, language);
      setInsight(data);
      await addHistory({ action: 'keyword_explore', query: keyword, resultCount: 1 });
    } catch (err) {
      push({ title: 'Keyword explore failed', description: err instanceof Error ? err.message : '', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const expand = async () => {
    try {
      const res = await expandKeywords(keyword || insight?.keyword || '', language, country);
      setExpanded(res.result);
      if (settings.autoSave) {
        await saveIdea({
          title: `Keyword expansion: ${keyword}`,
          content: res.result,
          type: 'keyword_expansion',
          tags: ['ai', 'keywords'],
          notes: '',
          favorite: false,
          source: 'ai',
        });
      }
      push({ title: 'Keywords expanded', variant: 'success' });
    } catch (err) {
      push({ title: 'AI expansion failed', description: err instanceof Error ? err.message : '', variant: 'error' });
    }
  };

  return (
    <div className="page-shell">
      <PageHeader title="Keyword Explorer" description="Search volume, competition, opportunity score, related queries, and trend curves." />
      <div className="glass-panel mb-6 grid gap-3 p-4 md:grid-cols-4">
        <div className="space-y-1.5 md:col-span-2">
          <Label>Keyword</Label>
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. home workout" onKeyDown={(e) => e.key === 'Enter' && void explore()} />
        </div>
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-4 flex flex-wrap gap-2">
          <Button onClick={() => void explore()} disabled={loading}>{loading ? 'Analyzing…' : 'Explore'}</Button>
          <Button variant="outline" onClick={() => void expand()} disabled={!keyword && !insight}>
            <Sparkles className="h-4 w-4" /> AI Expand
          </Button>
        </div>
      </div>

      {loading ? <Skeleton className="h-72 w-full" /> : null}

      {insight ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Search Volume', value: formatNumber(insight.searchVolume) },
              { label: 'Growth', value: formatPercent(insight.growth) },
              { label: 'Competition', value: `${insight.competition}` },
              { label: 'Opportunity', value: `${insight.opportunityScore}`, className: scoreColor(insight.opportunityScore) },
            ].map((m) => (
              <Card key={m.label}>
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className={`mt-1 text-2xl font-semibold ${m.className ?? ''}`}>{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Trend Curve</CardTitle></CardHeader>
              <CardContent><TrendAreaChart data={insight.trendCurve} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Interest By Country</CardTitle></CardHeader>
              <CardContent><CountryBarChart data={insight.interestByCountry} /></CardContent>
            </Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Related Queries</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {insight.relatedQueries.map((q) => <Badge key={q} variant="secondary">{q}</Badge>)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Related Topics</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void saveIdea({
                      title: `Keyword: ${insight.keyword}`,
                      content: JSON.stringify(insight, null, 2),
                      type: 'keyword',
                      tags: ['keyword', insight.keyword],
                      notes: '',
                      favorite: false,
                    }).then(() => push({ title: 'Saved to ideas', variant: 'success' }))
                  }
                >
                  <BookmarkPlus className="h-4 w-4" /> Save
                </Button>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {insight.relatedTopics.map((q) => <Badge key={q}>{q}</Badge>)}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">SEO Score</p><p className={`text-2xl font-semibold ${scoreColor(insight.seoScore)}`}>{insight.seoScore}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Difficulty</p><p className="text-2xl font-semibold">{insight.difficulty}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Seasonality points</p><p className="text-2xl font-semibold">{insight.seasonality.length}</p></CardContent></Card>
          </div>
        </div>
      ) : null}

      {expanded ? (
        <Card className="mt-4">
          <CardHeader><CardTitle>AI Keyword Expansion</CardTitle></CardHeader>
          <CardContent><pre className="whitespace-pre-wrap text-sm leading-relaxed">{expanded}</pre></CardContent>
        </Card>
      ) : null}
    </div>
  );
}
