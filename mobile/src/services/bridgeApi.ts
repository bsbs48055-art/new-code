import type {
  Candle,
  PriceQuote,
  SignalResult,
  Position,
  PlaceOrderRequest,
  BridgeHealth,
  Timeframe,
  AppSettings,
} from '../types';
import { generateDemoCandles, demoQuote } from './demoData';
import { generateSignal } from '../strategy';

export class BridgeError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'BridgeError';
    this.status = status;
  }
}

async function request<T>(
  baseUrl: string,
  apiKey: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        ...(options.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new BridgeError(text || `HTTP ${res.status}`, res.status);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof BridgeError) throw e;
    if ((e as Error).name === 'AbortError') {
      throw new BridgeError('Bridge request timed out');
    }
    throw new BridgeError((e as Error).message || 'Bridge unreachable');
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchHealth(settings: AppSettings): Promise<BridgeHealth> {
  if (settings.demoMode) {
    return {
      ok: true,
      mt5Connected: true,
      demo: true,
      message: 'Demo mode — simulated broker',
      lastCheck: Date.now(),
    };
  }
  try {
    const data = await request<{
      ok: boolean;
      mt5_connected: boolean;
      message: string;
    }>(settings.bridgeUrl, settings.apiKey, '/health');
    return {
      ok: data.ok,
      mt5Connected: data.mt5_connected,
      demo: false,
      message: data.message,
      lastCheck: Date.now(),
    };
  } catch (e) {
    return {
      ok: false,
      mt5Connected: false,
      demo: false,
      message: (e as Error).message,
      lastCheck: Date.now(),
    };
  }
}

export async function fetchPrice(settings: AppSettings): Promise<PriceQuote> {
  if (settings.demoMode) {
    const candles = generateDemoCandles(settings.symbol, 300);
    const last = candles[candles.length - 1].close;
    const q = demoQuote(settings.symbol, last);
    return { symbol: settings.symbol, bid: q.bid, ask: q.ask, time: Date.now() };
  }
  const data = await request<{ symbol: string; bid: number; ask: number; time?: number }>(
    settings.bridgeUrl,
    settings.apiKey,
    `/price?symbol=${encodeURIComponent(settings.symbol)}`,
  );
  return {
    symbol: data.symbol,
    bid: data.bid,
    ask: data.ask,
    time: data.time ?? Date.now(),
  };
}

export async function fetchCandles(settings: AppSettings, count = 300): Promise<Candle[]> {
  if (settings.demoMode) {
    return generateDemoCandles(settings.symbol, count);
  }
  const data = await request<{
    candles: Array<{ time: number; open: number; high: number; low: number; close: number; volume?: number }>;
  }>(
    settings.bridgeUrl,
    settings.apiKey,
    `/candles?symbol=${encodeURIComponent(settings.symbol)}&timeframe=${settings.timeframe}&count=${count}`,
  );
  return data.candles.map((c) => ({
    time: typeof c.time === 'number' && c.time < 1e12 ? c.time * 1000 : c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
}

export async function fetchSignal(settings: AppSettings, candles?: Candle[]): Promise<SignalResult> {
  if (settings.demoMode) {
    const c = candles ?? generateDemoCandles(settings.symbol, 300);
    return generateSignal(c, {
      symbol: settings.symbol,
      timeframe: settings.timeframe,
      rsiPeriod: settings.rsiPeriod,
      emaFast: settings.emaFast,
      emaSlow: settings.emaSlow,
    });
  }
  return request<SignalResult>(settings.bridgeUrl, settings.apiKey, '/signal', {
    method: 'POST',
    body: JSON.stringify({
      symbol: settings.symbol,
      timeframe: settings.timeframe,
      rsi_period: settings.rsiPeriod,
      ema_fast: settings.emaFast,
      ema_slow: settings.emaSlow,
    }),
  });
}

export async function fetchPositions(settings: AppSettings): Promise<Position[]> {
  if (settings.demoMode) {
    return [];
  }
  const data = await request<{ positions: Position[] }>(
    settings.bridgeUrl,
    settings.apiKey,
    '/positions',
  );
  return data.positions;
}

export async function placeOrder(
  settings: AppSettings,
  order: PlaceOrderRequest,
): Promise<{ ticket: number; message: string }> {
  if (settings.demoMode) {
    return {
      ticket: Math.floor(Math.random() * 1_000_000) + 10000,
      message: 'Demo order accepted (not sent to broker)',
    };
  }
  return request(settings.bridgeUrl, settings.apiKey, '/place_order', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export async function closeOrder(
  settings: AppSettings,
  ticket: number,
): Promise<{ ok: boolean; message: string }> {
  if (settings.demoMode) {
    return { ok: true, message: 'Demo position closed' };
  }
  return request(settings.bridgeUrl, settings.apiKey, '/close_order', {
    method: 'POST',
    body: JSON.stringify({ ticket }),
  });
}

export function timeframeToMinutes(tf: Timeframe): number {
  const map: Record<Timeframe, number> = {
    M5: 5,
    M15: 15,
    M30: 30,
    H1: 60,
    H4: 240,
  };
  return map[tf];
}
