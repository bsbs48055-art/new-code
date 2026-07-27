import { config } from '../config/index.js';
import { assertConfigured } from '../middleware/errors.js';

function hashScore(input, salt = 0) {
  let h = salt;
  const s = String(input);
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function opportunityFromSignals({ volume = 50, growth = 0, competition = 50 }) {
  const raw = volume * 0.35 + Math.max(0, growth) * 0.4 + (100 - competition) * 0.25;
  return Math.max(1, Math.min(100, Math.round(raw)));
}

export function difficultyFromCompetition(competition) {
  return Math.max(1, Math.min(100, Math.round(competition)));
}

export function seoScoreFromKeyword(keyword, volume, competition) {
  const lengthBonus = keyword.length >= 8 && keyword.length <= 40 ? 12 : 0;
  return Math.max(1, Math.min(100, Math.round(volume * 0.45 + (100 - competition) * 0.4 + lengthBonus)));
}

/** Build a deterministic weekly series from a seed when an API does not return a curve. */
export function syntheticSeries(seed, points = 12, base = 40) {
  const out = [];
  const now = new Date();
  for (let i = points - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const wobble = (hashScore(seed, i) % 21) - 10;
    out.push({
      date: d.toISOString().slice(0, 10),
      value: Math.max(0, base + wobble + Math.round(i * 1.2)),
    });
  }
  return out;
}

export async function openAiChat(system, user, model = config.openaiModel) {
  assertConfigured(config.openaiApiKey, 'OPENAI_API_KEY is not configured on the server.');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`OpenAI error: ${response.status}`);
    err.status = response.status;
    err.details = text;
    throw err;
  }
  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content?.trim() || '',
    model: data.model,
    tokensUsed: data.usage?.total_tokens,
  };
}
