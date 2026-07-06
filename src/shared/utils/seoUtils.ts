/**
 * Rule-based SEO helpers that work fully offline (no AI/API dependency):
 * character counters, keyword/hashtag suggestions extracted from the
 * content itself, and a heuristic SEO score. These complement (but do not
 * require) the optional AI-powered generators in `aiClient.ts`.
 */

import type { PlatformId } from '@shared/types/index';

export const PLATFORM_LIMITS: Record<PlatformId, { title: number; description: number; tags: number; hashtagsInText?: number }> = {
  youtube: { title: 100, description: 5000, tags: 500 },
  facebook: { title: 255, description: 63206, tags: 0 },
  tiktok: { title: 2200, description: 2200, tags: 0, hashtagsInText: 100 },
};

const STOP_WORDS = new Set(
  'a an the and or but of to in on for with is are was were be been being this that these those it its as at by from your you we our i'.split(
    ' ',
  ),
);

/** Extracts candidate keywords from free text by frequency, ignoring stop words. */
export function extractKeywords(text: string, limit = 15): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9#\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const frequency = new Map<string, number>();
  for (const word of words) frequency.set(word, (frequency.get(word) ?? 0) + 1);

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/** Suggests hashtags derived from the title/description/tags, deduplicated and normalized. */
export function suggestHashtags(input: { title: string; description: string; tags?: string[] }, limit = 12): string[] {
  const keywordSource = `${input.title} ${input.description} ${(input.tags ?? []).join(' ')}`;
  const keywords = extractKeywords(keywordSource, limit * 2);
  const hashtags = keywords.map((word) => `#${word.replace(/[^a-z0-9]/g, '')}`).filter((tag) => tag.length > 1);
  return Array.from(new Set(hashtags)).slice(0, limit);
}

export interface SeoScoreResult {
  score: number;
  maxScore: number;
  findings: { label: string; passed: boolean; hint: string }[];
}

/** Computes a heuristic 0-100 SEO score for a piece of content on a given platform. */
export function computeSeoScore(
  platform: PlatformId,
  content: { title: string; description: string; tags?: string[]; hashtags?: string[] },
): SeoScoreResult {
  const limits = PLATFORM_LIMITS[platform];
  const findings: SeoScoreResult['findings'] = [];

  const titleLength = content.title.trim().length;
  findings.push({
    label: 'Title length',
    passed: titleLength >= 15 && titleLength <= limits.title,
    hint: `Aim for 15-${limits.title} characters (currently ${titleLength}).`,
  });

  const descLength = content.description.trim().length;
  findings.push({
    label: 'Description length',
    passed: descLength >= 100,
    hint: `Aim for 100+ characters with context and keywords (currently ${descLength}).`,
  });

  findings.push({
    label: 'Has tags/keywords',
    passed: (content.tags?.length ?? 0) >= 3,
    hint: 'Add at least 3-5 relevant tags/keywords.',
  });

  findings.push({
    label: 'Has hashtags',
    passed: (content.hashtags?.length ?? 0) >= 2,
    hint: 'Add 2-8 relevant hashtags for discoverability.',
  });

  findings.push({
    label: 'Title contains a keyword from description',
    passed: extractKeywords(content.description, 20).some((kw) => content.title.toLowerCase().includes(kw)),
    hint: 'Reuse a key phrase from your description in the title.',
  });

  findings.push({
    label: 'No title ALL CAPS spam',
    passed: content.title !== content.title.toUpperCase() || content.title.length < 5,
    hint: 'Avoid writing the entire title in capital letters.',
  });

  const passedCount = findings.filter((f) => f.passed).length;
  return { score: Math.round((passedCount / findings.length) * 100), maxScore: 100, findings };
}

export function charactersRemaining(text: string, limit: number): number {
  return limit - text.length;
}
