import Parser from 'rss-parser';
import { config } from '../config/index.js';

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'ContentHunterAIPro/1.0 (+https://localhost)' },
});

/**
 * Fetch configured public RSS feeds. Only feeds you explicitly allowlist
 * in RSS_FEEDS are requested — no arbitrary site scraping.
 */
export async function fetchRssItems({ keyword, category, maxResults = 12 }) {
  const feeds = config.rssFeeds.length
    ? config.rssFeeds
    : ['https://feeds.bbci.co.uk/news/technology/rss.xml'];

  const results = [];
  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of feed.items || []) {
        const hay = `${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''}`.toLowerCase();
        const needle = [keyword, category].filter(Boolean).join(' ').toLowerCase();
        if (needle && !hay.includes(needle.split(' ')[0])) continue;
        results.push({
          id: `rss_${Buffer.from(item.link || item.guid || item.title || Math.random().toString()).toString('base64url').slice(0, 20)}`,
          title: item.title || 'Untitled',
          description: item.contentSnippet || '',
          url: item.link,
          platform: 'rss',
          category,
          publishedAt: item.isoDate || item.pubDate,
          author: item.creator || feed.title,
          popularity: 40,
          engagement: 30,
          source: `RSS: ${feed.title || url}`,
        });
      }
    } catch (err) {
      console.warn(`RSS fetch failed for ${url}:`, err.message);
    }
  }
  return results.slice(0, maxResults);
}
