import { config } from '../config/index.js';
import { assertConfigured } from '../middleware/errors.js';

/**
 * News API — headlines and everything search (official newsapi.org).
 */
export async function searchNews({ keyword, category, country, language, dateFrom, dateTo, maxResults = 12 }) {
  assertConfigured(config.newsApiKey, 'NEWS_API_KEY is not configured on the server.');
  const params = new URLSearchParams({
    apiKey: config.newsApiKey,
    pageSize: String(maxResults),
    language: language || 'en',
    sortBy: 'popularity',
  });
  const q = [keyword, category].filter(Boolean).join(' ');
  if (q) params.set('q', q);
  if (dateFrom) params.set('from', dateFrom);
  if (dateTo) params.set('to', dateTo);

  const endpoint = q
    ? `https://newsapi.org/v2/everything?${params}`
    : `https://newsapi.org/v2/top-headlines?${new URLSearchParams({
        apiKey: config.newsApiKey,
        country: (country || 'us').toLowerCase(),
        pageSize: String(maxResults),
        category: mapNewsCategory(category),
      })}`;

  const res = await fetch(endpoint);
  if (!res.ok) {
    const err = new Error(`News API failed (${res.status})`);
    err.status = res.status;
    err.details = await res.text();
    throw err;
  }
  const data = await res.json();
  return (data.articles || []).map((a, idx) => ({
    id: `news_${Buffer.from(a.url || String(idx)).toString('base64url').slice(0, 24)}`,
    title: a.title || 'Untitled',
    description: a.description || '',
    url: a.url,
    platform: 'news',
    category,
    country,
    language,
    publishedAt: a.publishedAt,
    thumbnail: a.urlToImage || undefined,
    author: a.author || a.source?.name,
    popularity: 55,
    engagement: 45,
    source: 'News API',
  }));
}

export async function trendingNews({ country, category, maxResults = 16 }) {
  return searchNews({ country, category, maxResults });
}

function mapNewsCategory(category) {
  const allowed = new Set([
    'business',
    'entertainment',
    'general',
    'health',
    'science',
    'sports',
    'technology',
  ]);
  if (!category) return 'general';
  if (allowed.has(category)) return category;
  if (['finance', 'investing', 'crypto', 'marketing'].includes(category)) return 'business';
  if (['football', 'basketball', 'cricket', 'fitness', 'gym'].includes(category)) return 'sports';
  if (['artificial-intelligence', 'programming', 'coding', 'gadgets'].includes(category)) return 'technology';
  return 'general';
}
