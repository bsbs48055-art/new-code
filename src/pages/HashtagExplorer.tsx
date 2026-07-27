import { useState } from 'react';
import { PageHeader, Skeleton } from '@/components/common/PageHeader';
import { Input, Label, Badge } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/utils/constants';
import { exploreHashtag } from '@/api/research';
import { generateContent } from '@/api/ai';
import { useSettingsStore, useToastStore } from '@/store';
import { addHistory, saveIdea } from '@/services/ideas';
import type { HashtagInsight } from '@/types';
import { formatNumber, formatPercent, scoreColor } from '@/utils/cn';
import { Hash, Sparkles, BookmarkPlus } from 'lucide-react';

export function HashtagExplorerPage() {
  const settings = useSettingsStore((s) => s.settings);
  const push = useToastStore((s) => s.push);
  const [hashtag, setHashtag] = useState('');
  const [country, setCountry] = useState(settings.defaultCountry);
  const [insight, setInsight] = useState<HashtagInsight | null>(null);
  const [generated, setGenerated] = useState('');
  const [loading, setLoading] = useState(false);

  const explore = async () => {
    if (!hashtag.trim()) return;
    setLoading(true);
    try {
      const data = await exploreHashtag(hashtag.trim(), country);
      setInsight(data);
      await addHistory({ action: 'hashtag_explore', query: hashtag, resultCount: 1 });
    } catch (err) {
      push({ title: 'Hashtag explore failed', description: err instanceof Error ? err.message : '', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    try {
      const res = await generateContent('hashtag_generator', hashtag || insight?.hashtag || '', {
        country,
        language: settings.language,
      });
      setGenerated(res.result);
      if (settings.autoSave) {
        await saveIdea({
          title: `Hashtags for ${hashtag}`,
          content: res.result,
          type: 'hashtags',
          tags: ['hashtags'],
          notes: '',
          favorite: false,
          source: 'ai',
        });
      }
    } catch (err) {
      push({ title: 'Hashtag generation failed', description: err instanceof Error ? err.message : '', variant: 'error' });
    }
  };

  return (
    <div className="page-shell">
      <PageHeader title="Hashtag Explorer" description="Analyze hashtag potential and generate platform-ready tag sets." />
      <div className="glass-panel mb-6 grid gap-3 p-4 md:grid-cols-3">
        <div className="space-y-1.5 md:col-span-2">
          <Label>Hashtag</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" value={hashtag} onChange={(e) => setHashtag(e.target.value)} placeholder="fitnessmotivation" onKeyDown={(e) => e.key === 'Enter' && void explore()} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3 flex gap-2">
          <Button onClick={() => void explore()} disabled={loading}>{loading ? 'Loading…' : 'Explore'}</Button>
          <Button variant="outline" onClick={() => void generate()}><Sparkles className="h-4 w-4" /> Generate Hashtags</Button>
        </div>
      </div>

      {loading ? <Skeleton className="h-48 w-full" /> : null}

      {insight ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Posts signal</p>
              <p className="text-2xl font-semibold">{formatNumber(insight.posts)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Growth</p>
              <p className="text-2xl font-semibold">{formatPercent(insight.growth)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Opportunity</p>
              <p className={`text-2xl font-semibold ${scoreColor(insight.opportunityScore)}`}>{insight.opportunityScore}</p>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Related Hashtags</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void saveIdea({
                    title: `#${insight.hashtag}`,
                    content: insight.related.map((h) => `#${h}`).join(' '),
                    type: 'hashtag',
                    tags: insight.related.slice(0, 8),
                    notes: '',
                    favorite: false,
                  }).then(() => push({ title: 'Saved', variant: 'success' }))
                }
              >
                <BookmarkPlus className="h-4 w-4" /> Save
              </Button>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {insight.related.map((h) => <Badge key={h}>#{h}</Badge>)}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {generated ? (
        <Card className="mt-4">
          <CardHeader><CardTitle>AI Hashtag Pack</CardTitle></CardHeader>
          <CardContent><pre className="whitespace-pre-wrap text-sm">{generated}</pre></CardContent>
        </Card>
      ) : null}
    </div>
  );
}
