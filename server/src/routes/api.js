import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errors.js';
import { searchYouTube, trendingYouTube } from '../services/youtube.js';
import { searchReddit, trendingReddit } from '../services/reddit.js';
import { searchNews, trendingNews } from '../services/news.js';
import { dailyTrends, buildKeywordInsight, buildHashtagInsight } from '../services/trends.js';
import { fetchRssItems } from '../services/rss.js';
import { openAiChat, opportunityFromSignals } from '../services/scoring.js';
import { audienceAnalysis, runAiFeature } from '../services/ai.js';
import { config, missingKeys } from '../config/index.js';

export const apiRouter = Router();

apiRouter.get(
  '/health',
  asyncHandler(async (_req, res) => {
    res.json({
      ok: true,
      version: '1.0.0',
      missingKeys: missingKeys(),
      timestamp: new Date().toISOString(),
    });
  }),
);

function sortItems(items, sortBy) {
  const copy = [...items];
  switch (sortBy) {
    case 'engagement':
      return copy.sort((a, b) => (b.engagement || 0) - (a.engagement || 0));
    case 'growth':
      return copy.sort((a, b) => (b.growth || 0) - (a.growth || 0));
    case 'popularity':
      return copy.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    case 'newest':
      return copy.sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
    default:
      return copy;
  }
}

apiRouter.get(
  '/search',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      keyword: z.string().optional().default(''),
      category: z.string().optional().default(''),
      country: z.string().optional().default('US'),
      language: z.string().optional().default('en'),
      platform: z.enum(['youtube', 'reddit', 'news', 'trends', 'rss', 'all']).optional().default('all'),
      sortBy: z.enum(['relevance', 'engagement', 'growth', 'popularity', 'newest']).optional().default('relevance'),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    });
    const filters = schema.parse(req.query);
    const tasks = [];
    const sources = [];

    const want = (p) => filters.platform === 'all' || filters.platform === p;

    if (want('youtube') && config.youtubeApiKey) {
      tasks.push(searchYouTube(filters).then((items) => ({ items, source: 'youtube' })));
    }
    if (want('reddit') && config.redditClientId) {
      tasks.push(searchReddit(filters).then((items) => ({ items, source: 'reddit' })));
    }
    if (want('news') && config.newsApiKey) {
      tasks.push(searchNews(filters).then((items) => ({ items, source: 'news' })));
    }
    if (want('rss')) {
      tasks.push(fetchRssItems(filters).then((items) => ({ items, source: 'rss' })));
    }
    if (want('trends') && filters.keyword) {
      tasks.push(
        buildKeywordInsight(filters.keyword, filters.country, filters.language).then((insight) => ({
          items: insight.relatedQueries.slice(0, 8).map((q, i) => ({
            id: `trend_q_${i}`,
            title: q,
            description: `Related trend query for ${filters.keyword}`,
            platform: 'trends',
            country: filters.country,
            language: filters.language,
            growth: insight.growth,
            popularity: Math.min(100, Math.round(insight.searchVolume / 500)),
            engagement: insight.opportunityScore,
            source: 'Google Trends',
          })),
          source: 'trends',
        })),
      );
    }

    const settled = await Promise.allSettled(tasks);
    let items = [];
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        items = items.concat(result.value.items);
        sources.push(result.value.source);
      } else {
        console.warn('Search source failed:', result.reason?.message || result.reason);
      }
    }

    if (!items.length && !tasks.length) {
      return res.status(503).json({
        error: 'No data sources configured. Add API keys to server/.env',
        code: 'NO_SOURCES',
        details: { missingKeys: missingKeys() },
      });
    }

    items = sortItems(items, filters.sortBy);
    res.json({ items, total: items.length, query: filters, sources });
  }),
);

apiRouter.get(
  '/trending',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      country: z.string().optional().default('US'),
      category: z.string().optional(),
      platform: z.string().optional().default('trends'),
    });
    const { country, category, platform } = schema.parse(req.query);
    let items = [];

    try {
      if (platform === 'youtube') items = await trendingYouTube({ country });
      else if (platform === 'reddit') items = await trendingReddit({ category });
      else if (platform === 'news') items = await trendingNews({ country, category });
      else if (platform === 'rss') items = await fetchRssItems({ category, maxResults: 16 });
      else items = await dailyTrends(country);
    } catch (err) {
      // Soft-fallback across sources when one platform fails
      console.warn('Primary trending source failed:', err.message);
      items = await dailyTrends(country);
    }

    res.json({ items, country, category, updatedAt: new Date().toISOString() });
  }),
);

apiRouter.get(
  '/keywords/explore',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      keyword: z.string().min(1),
      country: z.string().optional().default('US'),
      language: z.string().optional().default('en'),
    });
    const { keyword, country, language } = schema.parse(req.query);
    const insight = await buildKeywordInsight(keyword, country, language);
    res.json(insight);
  }),
);

apiRouter.get(
  '/hashtags/explore',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      hashtag: z.string().min(1),
      country: z.string().optional().default('US'),
    });
    const { hashtag, country } = schema.parse(req.query);
    res.json(await buildHashtagInsight(hashtag.replace(/^#/, ''), country));
  }),
);

apiRouter.get(
  '/clusters',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      seed: z.string().min(1),
      country: z.string().optional().default('US'),
    });
    const { seed, country } = schema.parse(req.query);

    let clusters;
    if (config.openaiApiKey) {
      const ai = await openAiChat(
        'Return ONLY valid JSON: {"clusters":[{"label":"","keywords":[""],"score":0,"opportunityScore":0,"difficulty":0,"description":""}]} with 6 clusters.',
        `Seed topic: ${seed}. Country: ${country}. Create creator-focused topic clusters.`,
      );
      try {
        const parsed = JSON.parse(ai.text.replace(/```json|```/g, '').trim());
        clusters = (parsed.clusters || []).map((c, i) => ({
          id: `cluster_${i}`,
          label: c.label,
          keywords: c.keywords || [],
          score: Number(c.score) || 70,
          opportunityScore: Number(c.opportunityScore) || 65,
          difficulty: Number(c.difficulty) || 45,
          description: c.description || '',
        }));
      } catch {
        clusters = null;
      }
    }

    if (!clusters) {
      const insight = await buildKeywordInsight(seed, country, 'en');
      clusters = insight.relatedTopics.slice(0, 6).map((label, i) => ({
        id: `cluster_${i}`,
        label,
        keywords: insight.relatedQueries.slice(i, i + 5),
        score: 70 - i * 3,
        opportunityScore: opportunityFromSignals({
          volume: 60 - i * 4,
          growth: insight.growth,
          competition: insight.competition + i * 3,
        }),
        difficulty: Math.min(95, insight.difficulty + i * 4),
        description: `Content pillar derived from trends around ${seed}.`,
      }));
    }

    res.json({ clusters });
  }),
);

apiRouter.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      keyword: z.string().min(1),
      country: z.string().optional().default('US'),
    });
    const { keyword, country } = schema.parse(req.query);
    const insight = await buildKeywordInsight(keyword, country, 'en');
    res.json({
      keyword: insight.keyword,
      searchVolume: insight.searchVolume,
      growth: insight.growth,
      competition: insight.competition,
      trendCurve: insight.trendCurve,
      interestByCountry: insight.interestByCountry,
      interestByTime: insight.interestByTime,
      relatedQueries: insight.relatedQueries,
      relatedTopics: insight.relatedTopics,
      seasonality: insight.seasonality,
      opportunityScore: insight.opportunityScore,
      difficulty: insight.difficulty,
      seoScore: insight.seoScore,
    });
  }),
);

apiRouter.post(
  '/ai/generate',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      feature: z.string().min(1),
      input: z.string().min(1),
      language: z.string().optional(),
      country: z.string().optional(),
      platform: z.string().optional(),
      context: z.record(z.unknown()).optional(),
    });
    const body = schema.parse(req.body);
    const result = await runAiFeature(body);
    res.json(result);
  }),
);

apiRouter.post(
  '/ai/audience',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      topic: z.string().min(1),
      country: z.string().optional().default('US'),
    });
    const { topic, country } = schema.parse(req.body);
    res.json(await audienceAnalysis(topic, country));
  }),
);
