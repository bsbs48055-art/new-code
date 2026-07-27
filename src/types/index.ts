/** Shared domain types for Content Hunter AI Pro */

export type ThemeMode = 'light' | 'dark' | 'system';

export type Platform =
  | 'youtube'
  | 'reddit'
  | 'news'
  | 'trends'
  | 'rss'
  | 'all';

export type SortBy =
  | 'relevance'
  | 'engagement'
  | 'growth'
  | 'popularity'
  | 'newest';

export type ExportFormat = 'csv' | 'excel' | 'json' | 'txt' | 'pdf';

export type AiFeature =
  | 'keyword_expansion'
  | 'topic_clustering'
  | 'trend_analysis'
  | 'audience_analysis'
  | 'seo_score'
  | 'content_difficulty'
  | 'opportunity_score'
  | 'related_questions'
  | 'content_calendar'
  | 'headline_generator'
  | 'title_generator'
  | 'description_generator'
  | 'hashtag_generator'
  | 'script_ideas'
  | 'thumbnail_ideas'
  | 'hook_generator'
  | 'cta_generator'
  | 'blog_outline'
  | 'youtube_outline'
  | 'tiktok_ideas'
  | 'facebook_post'
  | 'instagram_caption';

export interface Country {
  code: string;
  name: string;
  region: string;
}

export interface Language {
  code: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  group: string;
}

export interface SearchFilters {
  keyword: string;
  category: string;
  country: string;
  language: string;
  platform: Platform;
  sortBy: SortBy;
  dateFrom?: string;
  dateTo?: string;
  minEngagement?: number;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  url?: string;
  platform: Platform;
  category?: string;
  country?: string;
  language?: string;
  publishedAt?: string;
  engagement?: number;
  growth?: number;
  popularity?: number;
  thumbnail?: string;
  author?: string;
  tags?: string[];
  hashtags?: string[];
  metrics?: Record<string, number>;
  source: string;
}

export interface KeywordInsight {
  keyword: string;
  searchVolume: number;
  growth: number;
  competition: number;
  opportunityScore: number;
  difficulty: number;
  seoScore: number;
  relatedQueries: string[];
  relatedTopics: string[];
  interestByCountry: Array<{ country: string; value: number }>;
  interestByTime: TrendPoint[];
  seasonality: TrendPoint[];
  trendCurve: TrendPoint[];
}

export interface HashtagInsight {
  hashtag: string;
  posts: number;
  growth: number;
  competition: number;
  opportunityScore: number;
  related: string[];
  platforms: Platform[];
}

export interface TopicCluster {
  id: string;
  label: string;
  keywords: string[];
  score: number;
  opportunityScore: number;
  difficulty: number;
  description: string;
}

export interface AudienceInsight {
  summary: string;
  demographics: Array<{ label: string; value: number }>;
  interests: string[];
  painPoints: string[];
  contentPreferences: string[];
  recommendedFormats: string[];
}

export interface SavedIdea {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  notes: string;
  folderId?: string;
  collectionId?: string;
  favorite: boolean;
  source?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  action: string;
  query?: string;
  filters?: Partial<SearchFilters>;
  resultCount?: number;
  createdAt: string;
}

export interface ExportJob {
  id: string;
  name: string;
  format: ExportFormat;
  itemCount: number;
  createdAt: string;
  payloadPreview?: string;
}

export interface AppSettings {
  theme: ThemeMode;
  language: string;
  defaultCountry: string;
  defaultPlatform: Platform;
  autoSave: boolean;
  notifications: boolean;
  apiBaseUrl: string;
  openaiModel: string;
  cacheTtlMinutes: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: string;
}

export interface AiRequest {
  feature: AiFeature;
  input: string;
  context?: Record<string, unknown>;
  language?: string;
  country?: string;
  platform?: Platform;
}

export interface AiResponse {
  feature: AiFeature;
  result: string;
  structured?: Record<string, unknown>;
  tokensUsed?: number;
  model: string;
  createdAt: string;
}

export interface AnalyticsSnapshot {
  keyword: string;
  searchVolume: number;
  growth: number;
  competition: number;
  trendCurve: TrendPoint[];
  interestByCountry: Array<{ country: string; value: number }>;
  interestByTime: TrendPoint[];
  relatedQueries: string[];
  relatedTopics: string[];
  seasonality: TrendPoint[];
  opportunityScore: number;
  difficulty: number;
  seoScore: number;
}

export interface ApiErrorBody {
  error: string;
  code?: string;
  details?: unknown;
}
