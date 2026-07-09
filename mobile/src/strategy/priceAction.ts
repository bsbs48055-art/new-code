import type { Candle, PriceActionPattern } from '../types';

function isBullish(c: Candle): boolean {
  return c.close >= c.open;
}

function isBearish(c: Candle): boolean {
  return c.close < c.open;
}

function body(c: Candle): number {
  return Math.abs(c.close - c.open);
}

function range(c: Candle): number {
  return c.high - c.low;
}

/**
 * Detect engulfing or pin bar on the latest completed candle (index -1 or -2).
 */
export function detectPriceAction(candles: Candle[]): PriceActionPattern {
  if (candles.length < 2) return 'NONE';
  // Use last closed candle relative to previous
  const curr = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  // Bullish engulfing
  if (
    isBearish(prev) &&
    isBullish(curr) &&
    curr.close >= prev.open &&
    curr.open <= prev.close &&
    body(curr) > body(prev) * 0.9
  ) {
    return 'BULLISH_ENGULFING';
  }

  // Bearish engulfing
  if (
    isBullish(prev) &&
    isBearish(curr) &&
    curr.close <= prev.open &&
    curr.open >= prev.close &&
    body(curr) > body(prev) * 0.9
  ) {
    return 'BEARISH_ENGULFING';
  }

  const r = range(curr);
  if (r > 0) {
    const upperWick = curr.high - Math.max(curr.open, curr.close);
    const lowerWick = Math.min(curr.open, curr.close) - curr.low;
    const b = body(curr);

    // Bullish pin: long lower wick, small body near high
    if (lowerWick >= r * 0.6 && b <= r * 0.3 && upperWick <= r * 0.25) {
      return 'BULLISH_PIN';
    }
    // Bearish pin: long upper wick, small body near low
    if (upperWick >= r * 0.6 && b <= r * 0.3 && lowerWick <= r * 0.25) {
      return 'BEARISH_PIN';
    }
  }

  return 'NONE';
}

export function priceActionSupportsBuy(pa: PriceActionPattern): boolean {
  return pa === 'BULLISH_ENGULFING' || pa === 'BULLISH_PIN';
}

export function priceActionSupportsSell(pa: PriceActionPattern): boolean {
  return pa === 'BEARISH_ENGULFING' || pa === 'BEARISH_PIN';
}
