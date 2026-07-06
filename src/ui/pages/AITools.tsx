import { useState } from 'react';
import { Sparkles, Copy, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PlatformId } from '@shared/types/index';
import { PLATFORM_LABELS } from '@shared/types/index';
import { aiClient, AiNotConfiguredError, type ContentContext } from '@shared/utils/aiClient';
import { useSettings } from '@ui/hooks/useSettings';
import { useToastStore } from '@ui/state/toastStore';

type GeneratorKey = 'titles' | 'description' | 'tags' | 'hashtags' | 'thumbnails' | 'hooks' | 'caption' | 'analysis';

const GENERATORS: { key: GeneratorKey; label: string }[] = [
  { key: 'titles', label: 'Title Generator' },
  { key: 'description', label: 'Description Generator' },
  { key: 'tags', label: 'Tag Generator' },
  { key: 'hashtags', label: 'Hashtag Generator' },
  { key: 'thumbnails', label: 'Thumbnail Idea Generator' },
  { key: 'hooks', label: 'Hook Generator' },
  { key: 'caption', label: 'Caption Generator' },
  { key: 'analysis', label: 'Content Analysis' },
];

/** AI Tools page: pluggable AI-assisted content generation, using a user-supplied API key. */
export function AITools() {
  const { settings } = useSettings();
  const push = useToastStore((s) => s.push);

  const [platform, setPlatform] = useState<PlatformId>('youtube');
  const [topic, setTopic] = useState('');
  const [existingTitle, setExistingTitle] = useState('');
  const [existingDescription, setExistingDescription] = useState('');
  const [loading, setLoading] = useState<GeneratorKey | null>(null);
  const [results, setResults] = useState<Partial<Record<GeneratorKey, string[]>>>({});

  const ctx: ContentContext = { platform, topic, existingTitle, existingDescription };

  const run = async (key: GeneratorKey) => {
    if (!topic.trim()) {
      push('Describe your content topic first.', 'error');
      return;
    }
    setLoading(key);
    try {
      let output: string[];
      switch (key) {
        case 'titles':
          output = await aiClient.generateTitles(ctx);
          break;
        case 'description':
          output = [await aiClient.generateDescription(ctx)];
          break;
        case 'tags':
          output = await aiClient.generateTags(ctx);
          break;
        case 'hashtags':
          output = await aiClient.generateHashtags(ctx);
          break;
        case 'thumbnails':
          output = await aiClient.generateThumbnailIdeas(ctx);
          break;
        case 'hooks':
          output = await aiClient.generateHooks(ctx);
          break;
        case 'caption':
          output = [await aiClient.generateCaption(ctx)];
          break;
        case 'analysis':
          output = [await aiClient.analyzeContent(ctx)];
          break;
      }
      setResults((prev) => ({ ...prev, [key]: output }));
    } catch (error) {
      if (error instanceof AiNotConfiguredError) {
        push(error.message, 'error');
      } else {
        push(error instanceof Error ? error.message : String(error), 'error');
      }
    } finally {
      setLoading(null);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => push('Copied to clipboard.', 'success'));
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>AI Tools</h2>

      {!settings.aiProvider.hasApiKey && (
        <div className="card" style={{ padding: 14, marginBottom: 16, borderColor: 'var(--color-warning)' }}>
          <p style={{ margin: 0, fontSize: 13 }}>
            No AI API key configured. Add one in <Link to="/settings">Settings → AI Tools</Link> to enable these generators
            (any OpenAI-compatible endpoint works).
          </p>
        </div>
      )}

      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: '1 1 160px' }}>
            <label>Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value as PlatformId)}>
              {(Object.keys(PLATFORM_LABELS) as PlatformId[]).map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: '2 1 300px' }}>
            <label>Content topic</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Beginner guitar tutorial for pop songs" />
          </div>
        </div>
        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Existing title (optional)</label>
            <input value={existingTitle} onChange={(e) => setExistingTitle(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Existing description (optional)</label>
            <input value={existingDescription} onChange={(e) => setExistingDescription(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {GENERATORS.map(({ key, label }) => (
          <div key={key} className="card" style={{ padding: 16 }}>
            <div className="flex items-center justify-between">
              <h4 style={{ margin: 0, fontSize: 14 }}>{label}</h4>
              <button className="btn btn-secondary" onClick={() => run(key)} disabled={loading === key}>
                {loading === key ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} Generate
              </button>
            </div>
            {results[key] && (
              <div className="flex flex-col gap-2" style={{ marginTop: 10 }}>
                {results[key]!.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2" style={{ fontSize: 13, background: 'var(--color-surface-alt)', padding: '8px 10px', borderRadius: 8 }}>
                    <span style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{item}</span>
                    <button className="btn btn-ghost btn-icon" onClick={() => copy(item)} title="Copy">
                      <Copy size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
