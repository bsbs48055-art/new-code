import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { PlatformId } from '@shared/types/index';
import { PLATFORM_LABELS } from '@shared/types/index';
import { PLATFORM_LIMITS, charactersRemaining, computeSeoScore, suggestHashtags, extractKeywords } from '@shared/utils/seoUtils';

/** SEO Tools page: offline character counters, keyword/hashtag suggestions, and a heuristic SEO score. */
export function SEOTools() {
  const [platform, setPlatform] = useState<PlatformId>('youtube');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
  const limits = PLATFORM_LIMITS[platform];

  const hashtagSuggestions = useMemo(() => suggestHashtags({ title, description, tags }), [title, description, tags]);
  const keywordSuggestions = useMemo(() => extractKeywords(`${title} ${description}`, 12), [title, description]);
  const seoResult = useMemo(
    () => computeSeoScore(platform, { title, description, tags, hashtags: hashtagSuggestions }),
    [platform, title, description, tags, hashtagSuggestions],
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
      <div>
        <h2 style={{ marginTop: 0 }}>SEO Tools</h2>
        <div className="card" style={{ padding: 18 }}>
          <div className="field">
            <label>Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value as PlatformId)} style={{ width: 200 }}>
              {(Object.keys(PLATFORM_LABELS) as PlatformId[]).map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Title ({charactersRemaining(title, limits.title)} characters remaining)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={limits.title} />
          </div>
          <div className="field">
            <label>Description ({charactersRemaining(description, limits.description)} characters remaining)</label>
            <textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={limits.description} />
          </div>
          <div className="field">
            <label>Tags / keywords (comma separated)</label>
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
          </div>
        </div>

        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Suggested keywords (from your text)</h3>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {keywordSuggestions.length === 0 ? (
              <span className="text-muted" style={{ fontSize: 13 }}>Start typing a title or description to see keyword suggestions.</span>
            ) : (
              keywordSuggestions.map((kw) => (
                <span key={kw} className="badge badge-queued">{kw}</span>
              ))
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Suggested hashtags</h3>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {hashtagSuggestions.length === 0 ? (
              <span className="text-muted" style={{ fontSize: 13 }}>No hashtags suggested yet.</span>
            ) : (
              hashtagSuggestions.map((tag) => (
                <span key={tag} className="badge badge-scheduled">{tag}</span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 18, position: 'sticky', top: 0 }}>
        <h3 style={{ marginTop: 0 }}>SEO Score</h3>
        <div style={{ fontSize: 40, fontWeight: 800, color: seoResult.score >= 70 ? 'var(--color-success)' : seoResult.score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
          {seoResult.score}
          <span style={{ fontSize: 16, color: 'var(--color-text-muted)' }}>/100</span>
        </div>
        <div className="flex flex-col gap-2" style={{ marginTop: 12 }}>
          {seoResult.findings.map((finding) => (
            <div key={finding.label} className="flex items-start gap-2" style={{ fontSize: 12 }}>
              {finding.passed ? (
                <CheckCircle2 size={15} color="var(--color-success)" style={{ flexShrink: 0, marginTop: 1 }} />
              ) : (
                <XCircle size={15} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 1 }} />
              )}
              <div>
                <div style={{ fontWeight: 600 }}>{finding.label}</div>
                <div className="text-muted">{finding.hint}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
