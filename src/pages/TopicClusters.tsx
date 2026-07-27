import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader, Skeleton, EmptyState } from '@/components/common/PageHeader';
import { Input, Label, Badge } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/utils/constants';
import { fetchTopicClusters } from '@/api/research';
import { useSettingsStore, useToastStore } from '@/store';
import { addHistory, saveIdea } from '@/services/ideas';
import type { TopicCluster } from '@/types';
import { scoreColor } from '@/utils/cn';
import { BookmarkPlus } from 'lucide-react';

export function TopicClustersPage() {
  const settings = useSettingsStore((s) => s.settings);
  const push = useToastStore((s) => s.push);
  const [seed, setSeed] = useState('');
  const [country, setCountry] = useState(settings.defaultCountry);
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!seed.trim()) return;
    setLoading(true);
    try {
      const data = await fetchTopicClusters(seed.trim(), country);
      setClusters(data);
      await addHistory({ action: 'topic_clusters', query: seed, resultCount: data.length });
    } catch (err) {
      push({ title: 'Cluster generation failed', description: err instanceof Error ? err.message : '', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader title="Topic Clusters" description="Group related topics into content pillars with opportunity and difficulty scores." />
      <div className="glass-panel mb-6 grid gap-3 p-4 md:grid-cols-3">
        <div className="space-y-1.5 md:col-span-2">
          <Label>Seed topic</Label>
          <Input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="e.g. personal finance" onKeyDown={(e) => e.key === 'Enter' && void load()} />
        </div>
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3">
          <Button onClick={() => void load()} disabled={loading}>{loading ? 'Clustering…' : 'Build Clusters'}</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : clusters.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {clusters.map((c, index) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle>{c.label}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void saveIdea({
                        title: c.label,
                        content: `${c.description}\n\nKeywords:\n${c.keywords.join(', ')}`,
                        type: 'cluster',
                        tags: c.keywords.slice(0, 6),
                        notes: '',
                        favorite: false,
                        metadata: { opportunityScore: c.opportunityScore, difficulty: c.difficulty },
                      }).then(() => push({ title: 'Cluster saved', variant: 'success' }))
                    }
                  >
                    <BookmarkPlus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex gap-4 text-sm">
                    <span>Score <strong>{c.score}</strong></span>
                    <span className={scoreColor(c.opportunityScore)}>Opportunity <strong>{c.opportunityScore}</strong></span>
                    <span>Difficulty <strong>{c.difficulty}</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.keywords.map((k) => <Badge key={k} variant="secondary">{k}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState title="No clusters yet" description="Enter a seed topic to generate related content pillars." />
      )}
    </div>
  );
}
