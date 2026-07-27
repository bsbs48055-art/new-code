import { useEffect, useState } from 'react';
import { PageHeader, EmptyState } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { listIdeas } from '@/services/ideas';
import { exportIdeas } from '@/services/export';
import { db } from '@/services/db';
import type { ExportFormat, ExportJob, SavedIdea } from '@/types';
import { useToastStore } from '@/store';
import { Download } from 'lucide-react';

const FORMATS: ExportFormat[] = ['csv', 'excel', 'json', 'txt', 'pdf'];

export function ExportsPage() {
  const push = useToastStore((s) => s.push);
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [jobs, setJobs] = useState<ExportJob[]>([]);

  const refresh = async () => {
    setIdeas(await listIdeas());
    setJobs(await db.exports.orderBy('createdAt').reverse().toArray());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const run = async (format: ExportFormat) => {
    if (!ideas.length) {
      push({ title: 'Nothing to export', description: 'Save ideas first.', variant: 'error' });
      return;
    }
    try {
      await exportIdeas(ideas, format);
      await refresh();
      push({ title: `Exported as ${format.toUpperCase()}`, variant: 'success' });
    } catch (err) {
      push({ title: 'Export failed', description: err instanceof Error ? err.message : '', variant: 'error' });
    }
  };

  return (
    <div className="page-shell">
      <PageHeader title="Exports" description="Export saved ideas to CSV, Excel, JSON, TXT, or PDF." />
      <div className="mb-6 flex flex-wrap gap-2">
        {FORMATS.map((f) => (
          <Button key={f} onClick={() => void run(f)} variant={f === 'pdf' ? 'default' : 'outline'}>
            <Download className="h-4 w-4" /> {f.toUpperCase()}
          </Button>
        ))}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{ideas.length} ideas ready to export.</p>
      {jobs.length ? (
        <div className="space-y-2">
          {jobs.map((j) => (
            <Card key={j.id}>
              <CardContent className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium">{j.name}</p>
                  <p className="text-muted-foreground">{j.format.toUpperCase()} · {j.itemCount} items</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(j.createdAt).toLocaleString()}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No exports yet" description="Choose a format above to download your research library." />
      )}
    </div>
  );
}
