import type { ApiErrorBody } from '@/types';
import { loadSettings } from '@/services/storage';
import { getCached, setCache } from '@/services/db';

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = body?.code;
    this.details = body?.details;
  }
}

async function resolveBaseUrl(): Promise<string> {
  const settings = await loadSettings();
  return settings.apiBaseUrl.replace(/\/$/, '');
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  cacheKey?: string;
  cacheTtlMinutes?: number;
  signal?: AbortSignal;
}

/**
 * HTTP client for the Content Hunter Express backend.
 * Supports IndexedDB response caching for GET requests.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const settings = await loadSettings();
  const ttl = options.cacheTtlMinutes ?? settings.cacheTtlMinutes;

  if (method === 'GET' && options.cacheKey) {
    const cached = await getCached<T>(options.cacheKey);
    if (cached) return cached;
  }

  const base = await resolveBaseUrl();
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!response.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = undefined;
    }
    throw new ApiClientError(body?.error ?? `Request failed (${response.status})`, response.status, body);
  }

  const data = (await response.json()) as T;

  if (method === 'GET' && options.cacheKey) {
    await setCache(options.cacheKey, data, ttl);
  }

  return data;
}
