/**
 * Pluggable AI content-assistant client. Talks to any OpenAI-compatible
 * chat-completions endpoint (OpenAI, Azure OpenAI, a self-hosted
 * OpenAI-compatible gateway, etc.) using credentials the user supplies in
 * Settings. The extension ships with **no** bundled API key — every
 * generator call fails clearly if one hasn't been configured, rather than
 * returning fabricated data.
 */

import { aiKeyStore, settingsRepository } from '@shared/db/settingsRepository';
import { logger } from '@shared/utils/logger';

export class AiNotConfiguredError extends Error {
  constructor() {
    super('AI provider is not configured. Add an API key in Settings → AI Tools.');
    this.name = 'AiNotConfiguredError';
  }
}

async function callChatCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
  const settings = await settingsRepository.get();
  const apiKey = await aiKeyStore.getApiKey();
  if (!apiKey) throw new AiNotConfiguredError();

  const response = await fetch(settings.aiProvider.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: settings.aiProvider.model,
      temperature: 0.8,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    logger.error('AI provider request failed', { status: response.status, bodyText });
    throw new Error(`AI provider request failed (${response.status}). Check your API key and endpoint in Settings.`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('AI provider returned an empty response.');
  return content;
}

function splitNumberedList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s\-*\d.)]+/, '').trim())
    .filter(Boolean);
}

export interface ContentContext {
  topic: string;
  platform: 'youtube' | 'facebook' | 'tiktok';
  existingTitle?: string;
  existingDescription?: string;
  tone?: string;
}

export const aiClient = {
  async generateTitles(ctx: ContentContext, count = 5): Promise<string[]> {
    const text = await callChatCompletion(
      `You are an expert social media copywriter specializing in ${ctx.platform} content. Generate concise, high-CTR, non-clickbait titles.`,
      `Generate ${count} distinct title options (one per line, no numbering) for a ${ctx.platform} post about: "${ctx.topic}". Tone: ${ctx.tone ?? 'engaging and authentic'}.`,
    );
    return splitNumberedList(text).slice(0, count);
  },

  async generateDescription(ctx: ContentContext): Promise<string> {
    return callChatCompletion(
      `You are an expert social media copywriter specializing in ${ctx.platform} content.`,
      `Write one compelling description for a ${ctx.platform} post about: "${ctx.topic}". Title: "${ctx.existingTitle ?? ''}". Include a call to action. Keep formatting simple.`,
    );
  },

  async generateTags(ctx: ContentContext, count = 15): Promise<string[]> {
    const text = await callChatCompletion(
      `You generate concise SEO tags/keywords for ${ctx.platform} content, one per line, no hashtags, no numbering.`,
      `Generate ${count} SEO tags for a ${ctx.platform} post about: "${ctx.topic}".`,
    );
    return splitNumberedList(text).slice(0, count);
  },

  async generateHashtags(ctx: ContentContext, count = 10): Promise<string[]> {
    const text = await callChatCompletion(
      `You generate relevant, non-spammy hashtags for ${ctx.platform} content, one per line, each starting with #.`,
      `Generate ${count} hashtags for a ${ctx.platform} post about: "${ctx.topic}".`,
    );
    return splitNumberedList(text)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag.replace(/\s+/g, '')}`))
      .slice(0, count);
  },

  async generateThumbnailIdeas(ctx: ContentContext, count = 5): Promise<string[]> {
    const text = await callChatCompletion(
      'You are a thumbnail design director. Describe visually compelling thumbnail concepts in one sentence each.',
      `Suggest ${count} thumbnail concepts (one per line) for a ${ctx.platform} post about: "${ctx.topic}".`,
    );
    return splitNumberedList(text).slice(0, count);
  },

  async generateHooks(ctx: ContentContext, count = 5): Promise<string[]> {
    const text = await callChatCompletion(
      'You write scroll-stopping opening hooks (first 1-2 sentences) for short-form video content.',
      `Write ${count} distinct opening hooks (one per line) for a ${ctx.platform} video about: "${ctx.topic}".`,
    );
    return splitNumberedList(text).slice(0, count);
  },

  async generateCaption(ctx: ContentContext): Promise<string> {
    return callChatCompletion(
      `You write short, punchy captions for ${ctx.platform} posts.`,
      `Write one caption (2-3 sentences max) for a ${ctx.platform} post about: "${ctx.topic}".`,
    );
  },

  async analyzeContent(ctx: ContentContext): Promise<string> {
    return callChatCompletion(
      'You are a content strategist. Provide a concise, actionable critique.',
      `Analyze this ${ctx.platform} content and suggest concrete improvements:\n\nTitle: ${ctx.existingTitle ?? '(none)'}\nDescription: ${ctx.existingDescription ?? '(none)'}\nTopic: ${ctx.topic}`,
    );
  },
};
