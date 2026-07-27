import { apiRequest } from '@/api/client';
import type { AiFeature, AiRequest, AiResponse } from '@/types';

export async function runAiFeature(request: AiRequest): Promise<AiResponse> {
  return apiRequest<AiResponse>('/api/ai/generate', {
    method: 'POST',
    body: request,
  });
}

export async function expandKeywords(keyword: string, language: string, country: string) {
  return runAiFeature({
    feature: 'keyword_expansion',
    input: keyword,
    language,
    country,
  });
}

export async function generateContent(feature: AiFeature, input: string, extras?: Partial<AiRequest>) {
  return runAiFeature({
    feature,
    input,
    ...extras,
  });
}
