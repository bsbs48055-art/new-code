import type { Candle, SwingPoint, StructureEvent } from '../types';

const LOOKBACK = 5;

export function detectSwingPoints(candles: Candle[], lookback = LOOKBACK): SwingPoint[] {
  const swings: SwingPoint[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const c = candles[i];
    let isHigh = true;
    let isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].high >= c.high || candles[i + j].high >= c.high) isHigh = false;
      if (candles[i - j].low <= c.low || candles[i + j].low <= c.low) isLow = false;
    }
    if (isHigh) {
      swings.push({ index: i, price: c.high, type: 'high', time: c.time });
    } else if (isLow) {
      swings.push({ index: i, price: c.low, type: 'low', time: c.time });
    }
  }
  return swings;
}

/**
 * Detect Break of Structure / Change of Character from recent swings.
 * BOS/CHoCH are events over the last `eventWindow` candles against the most
 * recent confirmed swing before that window. A later pullback does not erase
 * a valid structure break.
 *
 * Bullish BOS only requires a prior swing high; bearish BOS only a prior swing low.
 */
export function detectStructure(
  candles: Candle[],
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
  eventWindow = 40,
): { event: StructureEvent; lastSwingHigh: SwingPoint | null; lastSwingLow: SwingPoint | null } {
  const swings = detectSwingPoints(candles);
  const highs = swings.filter((s) => s.type === 'high');
  const lows = swings.filter((s) => s.type === 'low');
  const lastSwingHigh = highs.length ? highs[highs.length - 1] : null;
  const lastSwingLow = lows.length ? lows[lows.length - 1] : null;

  if (!lastSwingHigh && !lastSwingLow) {
    return { event: 'NONE', lastSwingHigh, lastSwingLow };
  }

  const end = candles.length - 1;
  const start = Math.max(0, end - eventWindow);

  const priorHigh =
    [...highs].reverse().find((s) => s.index < start) ??
    (highs.length > 1 ? highs[highs.length - 2] : lastSwingHigh);
  const priorLow =
    [...lows].reverse().find((s) => s.index < start) ??
    (lows.length > 1 ? lows[lows.length - 2] : lastSwingLow);

  let brokeHigh = false;
  let brokeLow = false;
  for (let i = start; i <= end; i++) {
    const c = candles[i];
    if (priorHigh && c.close > priorHigh.price) brokeHigh = true;
    if (priorLow && c.close < priorLow.price) brokeLow = true;
  }

  const price = candles[end].close;
  if (lastSwingHigh && price > lastSwingHigh.price) brokeHigh = true;
  if (lastSwingLow && price < lastSwingLow.price) brokeLow = true;

  if (bias === 'BULLISH') {
    if (brokeHigh) return { event: 'BOS', lastSwingHigh, lastSwingLow };
    if (brokeLow) return { event: 'CHoCH', lastSwingHigh, lastSwingLow };
  } else if (bias === 'BEARISH') {
    if (brokeLow) return { event: 'BOS', lastSwingHigh, lastSwingLow };
    if (brokeHigh) return { event: 'CHoCH', lastSwingHigh, lastSwingLow };
  } else {
    if (brokeHigh || brokeLow) return { event: 'CHoCH', lastSwingHigh, lastSwingLow };
  }

  return { event: 'NONE', lastSwingHigh, lastSwingLow };
}
