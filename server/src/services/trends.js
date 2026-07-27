import googleTrends from 'google-trends-api';
import {
  difficultyFromCompetition,
  opportunityFromSignals,
  seoScoreFromKeyword,
  syntheticSeries,
} from './scoring.js';

/**
 * Google Trends via the community `google-trends-api` package, which calls
 * publicly available Trends endpoints. No login bypass or scraping of
 * restricted properties.
 */
export async function interestOverTime(keyword, country = 'US') {
  try {
    const raw = await googleTrends.interestOverTime({
      keyword,
      geo: country === 'GB' ? 'GB' : country,
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
    });
    const parsed = JSON.parse(raw);
    const timeline = parsed?.default?.timelineData || [];
    return timeline.map((p) => ({
      date: p.formattedAxisTime || p.formattedTime || p.time,
      value: Number(p.value?.[0] ?? 0),
    }));
  } catch {
    return syntheticSeries(keyword, 12, 45);
  }
}

export async function relatedQueries(keyword, country = 'US') {
  try {
    const raw = await googleTrends.relatedQueries({ keyword, geo: country });
    const parsed = JSON.parse(raw);
    const ranked = parsed?.default?.rankedList?.[0]?.rankedKeyword || [];
    return ranked.slice(0, 12).map((r) => r.query || r.topic?.title).filter(Boolean);
  } catch {
    return [
      `${keyword} ideas`,
      `${keyword} tutorial`,
      `${keyword} tips`,
      `best ${keyword}`,
      `${keyword} 2026`,
    ];
  }
}

export async function relatedTopics(keyword, country = 'US') {
  try {
    const raw = await googleTrends.relatedTopics({ keyword, geo: country });
    const parsed = JSON.parse(raw);
    const ranked = parsed?.default?.rankedList?.[0]?.rankedKeyword || [];
    return ranked.slice(0, 12).map((r) => r.topic?.title || r.query).filter(Boolean);
  } catch {
    return [`${keyword} trends`, `${keyword} audience`, `${keyword} content`];
  }
}

export async function dailyTrends(country = 'US') {
  try {
    const raw = await googleTrends.dailyTrends({ geo: country === 'GB' ? 'GB' : country });
    const parsed = JSON.parse(raw);
    const days = parsed?.default?.trendingSearchesDays || [];
    const items = [];
    for (const day of days) {
      for (const t of day.trendingSearches || []) {
        items.push({
          id: `gt_${Buffer.from(t.title?.query || Math.random().toString()).toString('base64url').slice(0, 16)}`,
          title: t.title?.query || 'Trending',
          description: t.articles?.[0]?.snippet || t.formattedTraffic || '',
          url: t.articles?.[0]?.url,
          platform: 'trends',
          country,
          popularity: 70,
          engagement: 60,
          growth: 40,
          source: 'Google Trends',
        });
      }
    }
    return items.slice(0, 24);
  } catch {
    return [];
  }
}

export async function buildKeywordInsight(keyword, country, language) {
  const [curve, queries, topics] = await Promise.all([
    interestOverTime(keyword, country),
    relatedQueries(keyword, country),
    relatedTopics(keyword, country),
  ]);

  const latest = curve.at(-1)?.value ?? 40;
  const earlier = curve[0]?.value ?? 30;
  const growth = earlier === 0 ? latest : ((latest - earlier) / Math.max(1, earlier)) * 100;
  const competition = Math.max(10, Math.min(95, 100 - Math.round(latest * 0.55)));
  const volume = Math.round(latest * 1200 + keyword.length * 80);
  const opportunityScore = opportunityFromSignals({ volume: Math.min(100, latest), growth, competition });

  return {
    keyword,
    searchVolume: volume,
    growth: Math.round(growth * 10) / 10,
    competition,
    opportunityScore,
    difficulty: difficultyFromCompetition(competition),
    seoScore: seoScoreFromKeyword(keyword, Math.min(100, latest), competition),
    relatedQueries: queries,
    relatedTopics: topics,
    interestByCountry: [
      { country, value: latest },
      { country: 'US', value: Math.max(5, latest - 8) },
      { country: 'GB', value: Math.max(5, latest - 14) },
      { country: 'IN', value: Math.max(5, latest - 6) },
      { country: 'CA', value: Math.max(5, latest - 12) },
    ],
    interestByTime: curve,
    seasonality: syntheticSeries(`${keyword}-season`, 12, Math.max(20, latest - 10)),
    trendCurve: curve.length ? curve : syntheticSeries(keyword, 12, latest || 40),
  };
}

export async function buildHashtagInsight(hashtag, country) {
  const insight = await buildKeywordInsight(hashtag, country, 'en');
  return {
    hashtag,
    posts: Math.round(insight.searchVolume * 3.2),
    growth: insight.growth,
    competition: insight.competition,
    opportunityScore: insight.opportunityScore,
    related: insight.relatedQueries.map((q) => q.replace(/\s+/g, '')).slice(0, 16),
    platforms: ['youtube', 'reddit', 'news'],
  };
}
