import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AI_FEATURES, COUNTRIES, LANGUAGES, PLATFORMS } from '@/utils/constants';
import { generateContent } from '@/api/ai';
import { useSettingsStore, useToastStore } from '@/store';
import { addHistory, saveIdea } from '@/services/ideas';
import type { AiFeature, Platform } from '@/types';
import { Sparkles, BookmarkPlus } from 'lucide-react';

export function AIAssistantPage() {
  const settings = useSettingsStore((s) => s.settings);
  const push = useToastStore((s) => s.push);
  const [feature, setFeature] = useState<AiFeature>('title_generator');
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState(settings.language);
  const [country, setCountry] = useState(settings.defaultCountry);
  const [platform, setPlatform] = useState<Platform>(settings.defaultPlatform);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const selected = AI_FEATURES.find((f) => f.id === feature);

  const run = async () => {
    if (!input.trim()) {
      push({ title: 'Enter a topic or brief', variant: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await generateContent(feature, input.trim(), { language, country, platform });
      setResult(res.result);
      await addHistory({ action: `ai_${feature}`, query: input, resultCount: 1 });
      if (settings.autoSave) {
        await saveIdea({
          title: `${selected?.label ?? feature}: ${input.slice(0, 48)}`,
          content: res.result,
          type: feature,
          tags: ['ai', feature],
          notes: '',
          favorite: false,
          source: 'ai',
        });
      }
      push({ title: 'AI response ready', variant: 'success' });
    } catch (err) {
      push({ title: 'AI request failed', description: err instanceof Error ? err.message : '', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="AI Assistant"
        description="Keyword expansion, outlines, hooks, captions, calendars, and more — powered by OpenAI via your secure backend."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          {AI_FEATURES.map((f, index) => (
            <motion.button
              key={f.id}
              type="button"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.3) }}
              onClick={() => setFeature(f.id as AiFeature)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                feature === f.id ? 'border-primary bg-primary/10' : 'border-border bg-card/50 hover:bg-muted'
              }`}
            >
              <p className="text-sm font-medium">{f.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{f.description}</p>
            </motion.button>
          ))}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{selected?.label}</CardTitle>
              <CardDescription>{selected?.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Topic / brief</Label>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe the niche, audience, or content goal…"
                  rows={5}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void run()} disabled={loading}>
                  <Sparkles className="h-4 w-4" />
                  {loading ? 'Generating…' : 'Generate'}
                </Button>
                {result ? (
                  <Button
                    variant="outline"
                    onClick={() =>
                      void saveIdea({
                        title: `${selected?.label}: ${input.slice(0, 40)}`,
                        content: result,
                        type: feature,
                        tags: ['ai', feature],
                        notes: '',
                        favorite: true,
                        source: 'ai',
                      }).then(() => push({ title: 'Saved to favorites', variant: 'success' }))
                    }
                  >
                    <BookmarkPlus className="h-4 w-4" /> Save
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {result ? (
            <Card>
              <CardHeader><CardTitle>Result</CardTitle></CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">{result}</pre>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-sm text-muted-foreground">
                Choose a feature, enter your brief, and generate. API keys stay on the Express backend — never bundled in the extension.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
