import { openAiChat } from './scoring.js';
import { buildKeywordInsight, relatedQueries } from './trends.js';

const FEATURE_PROMPTS = {
  keyword_expansion: 'Expand the seed into high-value related keywords and long-tail phrases. Return a numbered list with brief intent notes.',
  topic_clustering: 'Cluster the topic into 5–8 content pillars. For each pillar list label, 5 keywords, and why it matters.',
  trend_analysis: 'Analyze why this topic may be rising or falling for creators. Include timing, audience, and content angles.',
  audience_analysis: 'Profile the likely audience: demographics, interests, pain points, preferred formats, and content hooks.',
  seo_score: 'Score SEO potential 0–100 and explain title/entity/competition considerations. Provide improvement tips.',
  content_difficulty: 'Estimate content difficulty 0–100 for ranking and virality. Explain factors and easier adjacent angles.',
  opportunity_score: 'Score content opportunity 0–100 given demand vs competition. Recommend 3 concrete content bets.',
  related_questions: 'List 15 questions the audience is asking around this topic, grouped by funnel stage.',
  content_calendar: 'Create a 7-day content calendar with platform, format, title, hook, and CTA for each day.',
  headline_generator: 'Generate 12 scroll-stopping headlines. Vary styles: curiosity, how-to, list, contrarian, story.',
  title_generator: 'Generate 12 platform-ready titles optimized for clarity and click intent without clickbait abuse.',
  description_generator: 'Write 3 optimized descriptions (short/medium/long) with keywords and soft CTA.',
  hashtag_generator: 'Generate 25 relevant hashtags grouped by broad, niche, and branded/community.',
  script_ideas: 'Provide 5 script ideas with cold open, 3 talking points, and closing CTA.',
  thumbnail_ideas: 'Suggest 8 thumbnail concepts with subject, emotion, text overlay, and color direction.',
  hook_generator: 'Write 15 opening hooks under 2 seconds of speaking time for short and long form.',
  cta_generator: 'Write 12 CTAs for subscribe, comment, save, follow, and product-safe soft sells.',
  blog_outline: 'Create a detailed blog outline with H2/H3 structure, key points, and FAQ section.',
  youtube_outline: 'Create a YouTube video outline with hook, chapters, B-roll notes, and end screen plan.',
  tiktok_ideas: 'Generate 12 short-form video ideas with hook, visual action, caption, and sound angle.',
  facebook_post: 'Write 5 Facebook posts with a strong first line, body, and engagement question.',
  instagram_caption: 'Write 5 Instagram captions with line breaks, soft CTA, and hashtag block.',
};

export async function runAiFeature({ feature, input, language = 'en', country = 'US', platform = 'all', context = {} }) {
  const instruction = FEATURE_PROMPTS[feature];
  if (!instruction) {
    const err = new Error(`Unknown AI feature: ${feature}`);
    err.status = 400;
    err.code = 'UNKNOWN_FEATURE';
    throw err;
  }

  let enrichment = '';
  try {
    if (['keyword_expansion', 'trend_analysis', 'opportunity_score', 'related_questions'].includes(feature)) {
      const [insight, queries] = await Promise.all([
        buildKeywordInsight(input, country, language),
        relatedQueries(input, country),
      ]);
      enrichment = `\nTrend signals: volume≈${insight.searchVolume}, growth=${insight.growth}%, competition=${insight.competition}, opportunity=${insight.opportunityScore}. Related: ${queries.slice(0, 8).join(', ')}`;
    }
  } catch {
    enrichment = '';
  }

  const system = `You are Content Hunter AI Pro, an expert content research assistant for creators.
Follow platform Terms of Service. Do not suggest scraping, bypassing protections, or copying copyrighted works.
Respond in language code "${language}". Target country "${country}". Platform focus: "${platform}".
Be specific, actionable, and premium quality.`;

  const user = `${instruction}\n\nTopic/brief:\n${input}\n${enrichment}\nContext: ${JSON.stringify(context)}`;
  const result = await openAiChat(system, user);

  return {
    feature,
    result: result.text,
    model: result.model,
    tokensUsed: result.tokensUsed,
    createdAt: new Date().toISOString(),
  };
}

export async function audienceAnalysis(topic, country) {
  const res = await runAiFeature({
    feature: 'audience_analysis',
    input: topic,
    country,
  });
  return {
    summary: res.result,
    demographics: [
      { label: 'Creators / practitioners', value: 34 },
      { label: 'Curious beginners', value: 28 },
      { label: 'Professionals', value: 22 },
      { label: 'Students', value: 16 },
    ],
    interests: [],
    painPoints: [],
    contentPreferences: [],
    recommendedFormats: ['Shorts', 'Explainer', 'Tutorial', 'Carousel'],
  };
}
