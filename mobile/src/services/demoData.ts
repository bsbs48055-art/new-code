import type { Candle } from '../types';
import { pipSize } from '../strategy/indicators';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE_PRICES: Record<string, number> = {
  EURUSD: 1.05,
  GBPUSD: 1.22,
  USDJPY: 145.0,
  AUDUSD: 0.62,
  XAUUSD: 2200,
};

/**
 * Demo OHLC series engineered so `generateSignal()` returns BUY:
 * bullish EMAs + BOS + FVG/OB zone + RSI<=45 + bullish pin.
 */
export function generateDemoCandles(
  symbol: string,
  count = 300,
  seed = 42,
  timeframeMinutes = 15,
): Candle[] {
  const rand = mulberry32(seed);
  const pip = pipSize(symbol);
  let price = BASE_PRICES[symbol] ?? 1.05;
  const now = Date.now();
  const stepMs = timeframeMinutes * 60 * 1000;
  const out: Candle[] = [];

  const add = (open: number, high: number, low: number, close: number) => {
    out.push({
      time: now - (count - out.length) * stepMs,
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
      volume: 100 + Math.floor(rand() * 50),
    });
    price = close;
  };

  // Strong grind for EMA cushion (≈1.5 pips/bar)
  const setup = 50;
  for (let i = 0; i < count - setup; i++) {
    const open = price;
    const close = price + pip * 1.5;
    add(open, close + pip * 0.5, open - pip * 0.3, close);
  }

  // Swing high with flanks
  for (let i = 0; i < 5; i++) {
    add(price, price + pip * 3, price - pip, price + pip * 3);
  }
  const sh = price + pip * 6;
  add(price, sh, price - pip * 2, price + pip * 3);
  for (let i = 0; i < 5; i++) {
    add(price, price + pip, price - pip * 1.5 - pip, price - pip * 1.5);
  }

  // BOS — close above swing high
  add(price, sh + pip * 12, price - pip, sh + pip * 10);

  // Dump 8 × 4 pips → RSI into buy window, price still above EMA50
  for (let i = 0; i < 8; i++) {
    const open = price;
    const close = price - pip * 4;
    add(open, open + pip * 0.3, close - pip, close);
  }

  // OB + small impulse + FVG at the lows (no large bounce)
  const obHigh = price + pip * 0.5;
  const obLow = price - pip * 4;
  add(obHigh, obHigh + pip * 0.2, obLow, obLow + pip * 0.4);
  add(obLow + pip * 0.4, price + pip * 3, obLow, price + pip * 2.5);
  add(price + pip * 0.3, price + pip * 3.5, price, price + pip * 2.5);

  // Micro pullback into zone
  add(price, price + pip * 0.2, price - pip * 1.5, price - pip);

  while (out.length < count - 1) {
    add(price + pip * 0.2, price + pip * 0.3, price - pip * 0.3, price - pip * 0.1);
  }

  // Bullish pin at OB/FVG
  add(price - pip * 0.2, price + pip * 0.3, obLow - pip * 5, price + pip * 0.1);

  return out.slice(0, count);
}

export function demoQuote(symbol: string, lastClose: number): { bid: number; ask: number } {
  const pip = pipSize(symbol);
  const spread = pip * 1.2;
  return { bid: lastClose - spread / 2, ask: lastClose + spread / 2 };
}
