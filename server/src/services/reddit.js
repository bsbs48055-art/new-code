import { config } from '../config/index.js';
import { assertConfigured } from '../middleware/errors.js';

let cachedToken = { value: '', expiresAt: 0 };

async function getRedditToken() {
  assertConfigured(
    config.redditClientId && config.redditClientSecret,
    'REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are required.',
  );
  if (cachedToken.value && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const basic = Buffer.from(`${config.redditClientId}:${config.redditClientSecret}`).toString('base64');
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': config.redditUserAgent,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const err = new Error(`Reddit auth failed (${res.status})`);
    err.status = res.status;
    err.details = await res.text();
    throw err;
  }
  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

/**
 * Reddit official OAuth API — search and subreddit hot listings.
 */
export async function searchReddit({ keyword, category, maxResults = 12 }) {
  const token = await getRedditToken();
  const q = [keyword, category].filter(Boolean).join(' ');
  const params = new URLSearchParams({
    q,
    sort: 'relevance',
    limit: String(maxResults),
    type: 'link',
  });
  const res = await fetch(`https://oauth.reddit.com/search?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': config.redditUserAgent,
    },
  });
  if (!res.ok) {
    const err = new Error(`Reddit search failed (${res.status})`);
    err.status = res.status;
    err.details = await res.text();
    throw err;
  }
  const data = await res.json();
  return (data.data?.children || []).map((child) => {
    const p = child.data || {};
    return {
      id: `rd_${p.id}`,
      title: p.title || 'Untitled',
      description: p.selftext?.slice(0, 280) || '',
      url: p.url?.startsWith('http') ? p.url : `https://www.reddit.com${p.permalink}`,
      platform: 'reddit',
      category,
      publishedAt: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : undefined,
      author: p.author,
      engagement: Math.min(100, Math.round(Math.log10((p.ups || 0) + 1) * 20)),
      popularity: Math.min(100, Math.round(Math.log10((p.num_comments || 0) + 1) * 22)),
      growth: Math.min(70, Math.round((p.upvote_ratio || 0.5) * 70)),
      tags: p.subreddit ? [p.subreddit] : [],
      source: 'Reddit API',
    };
  });
}

export async function trendingReddit({ category, maxResults = 16 }) {
  const token = await getRedditToken();
  const sub = category ? category.replace(/[^a-z0-9_]/gi, '') || 'popular' : 'popular';
  const res = await fetch(`https://oauth.reddit.com/r/${sub}/hot?limit=${maxResults}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': config.redditUserAgent,
    },
  });
  if (!res.ok) {
    // Fallback to /r/popular when custom category subreddit is invalid
    const fallback = await fetch(`https://oauth.reddit.com/r/popular/hot?limit=${maxResults}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': config.redditUserAgent,
      },
    });
    if (!fallback.ok) {
      const err = new Error(`Reddit trending failed (${fallback.status})`);
      err.status = fallback.status;
      err.details = await fallback.text();
      throw err;
    }
    const data = await fallback.json();
    return mapHot(data, category);
  }
  const data = await res.json();
  return mapHot(data, category);
}

function mapHot(data, category) {
  return (data.data?.children || []).map((child) => {
    const p = child.data || {};
    return {
      id: `rd_hot_${p.id}`,
      title: p.title || 'Untitled',
      description: p.selftext?.slice(0, 280) || '',
      url: `https://www.reddit.com${p.permalink}`,
      platform: 'reddit',
      category,
      publishedAt: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : undefined,
      author: p.author,
      engagement: Math.min(100, Math.round(Math.log10((p.ups || 0) + 1) * 20)),
      popularity: Math.min(100, Math.round(Math.log10((p.num_comments || 0) + 1) * 22)),
      growth: Math.min(80, Math.round((p.upvote_ratio || 0.5) * 80)),
      tags: p.subreddit ? [p.subreddit] : [],
      source: 'Reddit API',
    };
  });
}
