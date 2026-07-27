import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

function requiredHint(name) {
  return process.env[name] || '';
}

export const config = {
  port: Number(process.env.PORT || 8787),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  openaiApiKey: requiredHint('OPENAI_API_KEY'),
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  youtubeApiKey: requiredHint('YOUTUBE_API_KEY'),
  newsApiKey: requiredHint('NEWS_API_KEY'),
  redditClientId: requiredHint('REDDIT_CLIENT_ID'),
  redditClientSecret: requiredHint('REDDIT_CLIENT_SECRET'),
  redditUserAgent: process.env.REDDIT_USER_AGENT || 'ContentHunterAIPro/1.0',
  rssFeeds: (process.env.RSS_FEEDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

export function missingKeys() {
  const missing = [];
  if (!config.openaiApiKey) missing.push('OPENAI_API_KEY');
  if (!config.youtubeApiKey) missing.push('YOUTUBE_API_KEY');
  if (!config.newsApiKey) missing.push('NEWS_API_KEY');
  if (!config.redditClientId || !config.redditClientSecret) missing.push('REDDIT_CLIENT_ID/SECRET');
  return missing;
}
