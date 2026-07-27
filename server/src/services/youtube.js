import { config } from '../config/index.js';
import { assertConfigured } from '../middleware/errors.js';

/**
 * YouTube Data API v3 — search and trending via official endpoints only.
 */
export async function searchYouTube({ keyword, category, country, language, maxResults = 12 }) {
  assertConfigured(config.youtubeApiKey, 'YOUTUBE_API_KEY is not configured on the server.');
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: String(maxResults),
    q: [keyword, category].filter(Boolean).join(' '),
    regionCode: country || 'US',
    relevanceLanguage: language || 'en',
    order: 'relevance',
    key: config.youtubeApiKey,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!res.ok) {
    const err = new Error(`YouTube search failed (${res.status})`);
    err.status = res.status;
    err.details = await res.text();
    throw err;
  }
  const data = await res.json();
  return (data.items || []).map((item) => ({
    id: `yt_${item.id?.videoId || item.etag}`,
    title: item.snippet?.title || 'Untitled',
    description: item.snippet?.description || '',
    url: item.id?.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : undefined,
    platform: 'youtube',
    category,
    country,
    language,
    publishedAt: item.snippet?.publishedAt,
    thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
    author: item.snippet?.channelTitle,
    popularity: 50,
    engagement: 40,
    source: 'YouTube Data API',
  }));
}

export async function trendingYouTube({ country, maxResults = 16 }) {
  assertConfigured(config.youtubeApiKey, 'YOUTUBE_API_KEY is not configured on the server.');
  const params = new URLSearchParams({
    part: 'snippet,statistics',
    chart: 'mostPopular',
    regionCode: country || 'US',
    maxResults: String(maxResults),
    key: config.youtubeApiKey,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
  if (!res.ok) {
    const err = new Error(`YouTube trending failed (${res.status})`);
    err.status = res.status;
    err.details = await res.text();
    throw err;
  }
  const data = await res.json();
  return (data.items || []).map((item) => {
    const views = Number(item.statistics?.viewCount || 0);
    const likes = Number(item.statistics?.likeCount || 0);
    return {
      id: `yt_trend_${item.id}`,
      title: item.snippet?.title || 'Untitled',
      description: item.snippet?.description || '',
      url: `https://www.youtube.com/watch?v=${item.id}`,
      platform: 'youtube',
      country,
      publishedAt: item.snippet?.publishedAt,
      thumbnail: item.snippet?.thumbnails?.medium?.url,
      author: item.snippet?.channelTitle,
      popularity: Math.min(100, Math.round(Math.log10(views + 1) * 12)),
      engagement: Math.min(100, Math.round(Math.log10(likes + 1) * 18)),
      growth: Math.min(80, Math.round(Math.log10(views + 1) * 8)),
      metrics: { views, likes },
      source: 'YouTube Data API',
    };
  });
}
