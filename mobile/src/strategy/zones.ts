import type { Candle, OrderBlock, FairValueGap, Zone } from '../types';

function bodySize(c: Candle): number {
  return Math.abs(c.close - c.open);
}

function isBullish(c: Candle): boolean {
  return c.close >= c.open;
}

function isBearish(c: Candle): boolean {
  return c.close < c.open;
}

/**
 * Order block = last opposite-direction candle before a strong impulsive move.
 */
export function detectOrderBlocks(candles: Candle[], lookback = 40): OrderBlock[] {
  const blocks: OrderBlock[] = [];
  const start = Math.max(2, candles.length - lookback);
  for (let i = start; i < candles.length - 1; i++) {
    const impulse = candles[i];
    const prev = candles[i - 1];
    const impulseBody = bodySize(impulse);
    const avgBody =
      candles.slice(Math.max(0, i - 10), i).reduce((s, c) => s + bodySize(c), 0) /
      Math.min(10, i);

    if (impulseBody < avgBody * 1.5) continue;

    // Bullish impulse → last bearish candle before it is bullish OB
    if (isBullish(impulse) && isBearish(prev)) {
      blocks.push({
        type: 'bullish',
        high: Math.max(prev.open, prev.close),
        low: Math.min(prev.open, prev.close, prev.low),
        index: i - 1,
        time: prev.time,
      });
    }
    // Bearish impulse → last bullish candle before it is bearish OB
    if (isBearish(impulse) && isBullish(prev)) {
      blocks.push({
        type: 'bearish',
        high: Math.max(prev.open, prev.close, prev.high),
        low: Math.min(prev.open, prev.close),
        index: i - 1,
        time: prev.time,
      });
    }
  }
  return blocks;
}

/**
 * Fair Value Gap: 3-candle imbalance where candle1 and candle3 don't overlap.
 */
export function detectFairValueGaps(candles: Candle[], lookback = 40): FairValueGap[] {
  const gaps: FairValueGap[] = [];
  const start = Math.max(2, candles.length - lookback);
  for (let i = start; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c3 = candles[i];
    // Bullish FVG: c1.high < c3.low
    if (c1.high < c3.low) {
      gaps.push({
        type: 'bullish',
        high: c3.low,
        low: c1.high,
        index: i - 1,
        time: candles[i - 1].time,
      });
    }
    // Bearish FVG: c1.low > c3.high
    if (c1.low > c3.high) {
      gaps.push({
        type: 'bearish',
        high: c1.low,
        low: c3.high,
        index: i - 1,
        time: candles[i - 1].time,
      });
    }
  }
  return gaps;
}

export function priceInZone(price: number, zone: { high: number; low: number }, buffer = 0): boolean {
  const top = Math.max(zone.high, zone.low) + buffer;
  const bottom = Math.min(zone.high, zone.low) - buffer;
  return price <= top && price >= bottom;
}

/** Most recent relevant zone for the given bias near current price */
export function findActiveZone(
  candles: Candle[],
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
  pip: number,
): Zone | null {
  if (bias === 'NEUTRAL') return null;
  const price = candles[candles.length - 1].close;
  const obs = detectOrderBlocks(candles);
  const fvgs = detectFairValueGaps(candles);
  const wanted = bias === 'BULLISH' ? 'bullish' : 'bearish';

  const candidates: Zone[] = [
    ...obs
      .filter((o) => o.type === wanted)
      .map((o) => ({ kind: 'order_block' as const, type: o.type, high: o.high, low: o.low, index: o.index })),
    ...fvgs
      .filter((f) => f.type === wanted)
      .map((f) => ({ kind: 'fvg' as const, type: f.type, high: f.high, low: f.low, index: f.index })),
  ].sort((a, b) => b.index - a.index);

  for (const z of candidates) {
    if (priceInZone(price, z, pip * 3)) return z;
  }
  // Also accept if price recently tapped the zone (last 3 candles)
  for (const z of candidates.slice(0, 5)) {
    for (let i = candles.length - 3; i < candles.length; i++) {
      if (i < 0) continue;
      const c = candles[i];
      if (priceInZone(c.low, z, pip * 2) || priceInZone(c.high, z, pip * 2)) return z;
    }
  }
  return null;
}
