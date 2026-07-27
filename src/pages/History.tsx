import { useEffect, useState } from 'react';
import { PageHeader, EmptyState } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { clearHistory, listHistory } from '@/services/ideas';
import type { HistoryEntry } from '@/types';
import { useToastStore } from '@/store';
import { Trash2 } from 'lucide-react';

export function HistoryPage() {
  const push = useToastStore((s) => s.push);
  const [rows, setRows] = useState<HistoryEntry[]>([]);

  const refresh = async () => setRows(await listHistory(200));

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="page-shell">
      <PageHeader
        title="History"
        description="Local history of searches, trending lookups, keyword explores, and AI runs."
        actions={
          <Button
            variant="destructive"
            onClick={() =>
              void clearHistory()
                .then(refresh)
                .then(() => push({ title: 'History cleared', variant: 'success' }))
            }
          >
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        }
      />
      {rows.length ? (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium capitalize">{r.action.replaceAll('_', ' ')}</p>
                  <p className="text-sm text-muted-foreground">{r.query || '—'}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.resultCount != null ? `${r.resultCount} results · ` : ''}
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No history" description="Your research activity will appear here automatically." />
      )}
    </div>
  );
}
