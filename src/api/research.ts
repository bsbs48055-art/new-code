import { apiRequest } from '@/api/client';
import type {
  AnalyticsSnapshot,
  ContentItem,
  HashtagInsight,
  KeywordInsight,
  SearchFilters,
  TopicCluster,
  AudienceInsight,
} from '@/types';

export interface SearchResponse {
  items: ContentItem[];
  total: number;
  query: SearchFilters;
  sources: string[];
}

export interface TrendingResponse {
  items: ContentItem[];
  country: string;
  category?: string;
  updatedAt: string;
}

export async function searchContent(filters: SearchFilters): Promise<SearchResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && v !== '') params.set(k, String(v));
  });
  return apiRequest<SearchResponse>(`/api/search?${params.toString()}`, {
    cacheKey: `search:${params.toString()}`,
  });
}

export async function fetchTrending(params: {
  country: string;
  category?: string;
  platform?: string;
}): Promise<TrendingResponse> {
  const q = new URLSearchParams(params as Record<string, string>);
  return apiRequest<TrendingResponse>(`/api/trending?${q.toString()}`, {
    cacheKey: `trending:${q.toString()}`,
  });
}

export async function exploreKeyword(keyword: string, country: string, language: string): Promise<KeywordInsight> {
  const q = new URLSearchParams({ keyword, country, language });
  return apiRequest<KeywordInsight>(`/api/keywords/explore?${q.toString()}`, {
    cacheKey: `keyword:${q.toString()}`,
  });
}

export async function exploreHashtag(hashtag: string, country: string): Promise<HashtagInsight> {
  const clean = hashtag.replace(/^#/, '');
  const q = new URLSearchParams({ hashtag: clean, country });
  return apiRequest<HashtagInsight>(`/api/hashtags/explore?${q.toString()}`, {
    cacheKey: `hashtag:${q.toString()}`,
  });
}

export async function fetchTopicClusters(seed: string, country: string): Promise<TopicCluster[]> {
  const q = new URLSearchParams({ seed, country });
  const res = await apiRequest<{ clusters: TopicCluster[] }>(`/api/clusters?${q.toString()}`, {
    cacheKey: `clusters:${q.toString()}`,
  });
  return res.clusters;
}

export async function fetchAnalytics(keyword: string, country: string): Promise<AnalyticsSnapshot> {
  const q = new URLSearchParams({ keyword, country });
  return apiRequest<AnalyticsSnapshot>(`/api/analytics?${q.toString()}`, {
    cacheKey: `analytics:${q.toString()}`,
  });
}

export async function fetchAudience(topic: string, country: string): Promise<AudienceInsight> {
  return apiRequest<AudienceInsight>('/api/ai/audience', {
    method: 'POST',
    body: { topic, country },
  });
}

export async function healthCheck(baseUrl?: string): Promise<{ ok: boolean; version: string }> {
  const base = (baseUrl ?? '').replace(/\/$/, '') || undefined;
  if (base) {
    const res = await fetch(`${base}/api/health`);
    if (!res.ok) throw new Error('Backend unreachable');
    return res.json();
  }
  return apiRequest('/api/health');
}
