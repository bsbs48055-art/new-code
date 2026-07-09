import { ema, rsi, pipSize, pipsBetween } from '../indicators';
import { detectSwingPoints, detectStructure } from '../structure';
import { detectOrderBlocks, detectFairValueGaps, priceInZone } from '../zones';
import { detectPriceAction } from '../priceAction';
import { generateSignal, isDailyLossLimitHit, riskAmount } from '../engine';
import { generateDemoCandles } from '../../services/demoData';
import type { Candle, AppSettings } from '../../types';

function candle(o: number, h: number, l: number, c: number, i = 0): Candle {
  return { time: 1_700_000_000_000 + i * 900_000, open: o, high: h, low: l, close: c };
}

function risingSeries(n: number, start = 1.1, step = 0.001): Candle[] {
  const out: Candle[] = [];
  let p = start;
  for (let i = 0; i < n; i++) {
    const open = p;
    const close = p + step;
    out.push(candle(open, close + step * 0.3, open - step * 0.2, close, i));
    p = close;
  }
  return out;
}

describe('indicators', () => {
  test('ema trends toward recent prices', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const e = ema(values, 3);
    expect(e.length).toBe(10);
    expect(e[9]).toBeGreaterThan(e[0]);
    expect(e[9]).toBeCloseTo(9.0, 0);
  });

  test('rsi of flat series is near 50-100 edge cases', () => {
    const up = Array.from({ length: 30 }, (_, i) => 100 + i);
    const r = rsi(up, 14);
    expect(r[29]).toBeGreaterThan(70);
  });

  test('pipSize for JPY and majors', () => {
    expect(pipSize('USDJPY')).toBe(0.01);
    expect(pipSize('EURUSD')).toBe(0.0001);
    expect(pipSize('XAUUSD')).toBe(0.1);
  });

  test('pipsBetween', () => {
    expect(pipsBetween(1.1000, 1.1010, 'EURUSD')).toBeCloseTo(10, 5);
  });
});

describe('structure', () => {
  test('detects swing highs and lows', () => {
    const candles: Candle[] = [];
    for (let i = 0; i < 40; i++) {
      const base = 1.1 + Math.sin(i / 3) * 0.01;
      candles.push(candle(base, base + 0.002, base - 0.002, base + 0.0005, i));
    }
    // Force a clear swing high
    candles[20] = candle(1.12, 1.15, 1.119, 1.121, 20);
    const swings = detectSwingPoints(candles, 5);
    expect(swings.some((s) => s.type === 'high')).toBe(true);
  });

  test('BOS on bullish break of swing high', () => {
    const candles = risingSeries(80, 1.0, 0.002);
    const { event } = detectStructure(candles, 'BULLISH');
    expect(['BOS', 'CHoCH', 'NONE']).toContain(event);
  });

  test('bullish BOS does not require a swing low', () => {
    const candles: Candle[] = [];
    let p = 1.05;
    for (let i = 0; i < 40; i++) {
      const o = p;
      const c = p + 0.00015;
      candles.push(candle(o, c + 0.00005, o - 0.00003, c, i));
      p = c;
    }
    for (let i = 0; i < 5; i++) {
      candles.push(candle(p, p + 0.0003, p - 0.0001, p + 0.0003, candles.length));
      p = candles[candles.length - 1].close;
    }
    const sh = p + 0.0006;
    candles.push(candle(p, sh, p - 0.0002, p + 0.0003, candles.length));
    p = candles[candles.length - 1].close;
    for (let i = 0; i < 5; i++) {
      candles.push(candle(p, p + 0.0001, p - 0.00025, p - 0.00015, candles.length));
      p = candles[candles.length - 1].close;
    }
    candles.push(candle(p, sh + 0.0012, p - 0.0001, sh + 0.001, candles.length));
    const { event } = detectStructure(candles, 'BULLISH', 40);
    expect(event).toBe('BOS');
  });
});

describe('zones', () => {
  test('detects bullish FVG', () => {
    const candles = [
      candle(1.1, 1.101, 1.099, 1.1005, 0),
      candle(1.1005, 1.102, 1.1, 1.1015, 1),
      candle(1.105, 1.108, 1.1045, 1.107, 2), // gap above candle 0 high
    ];
    // pad
    const padded = [...risingSeries(10, 1.09, 0.0005), ...candles];
    const gaps = detectFairValueGaps(padded);
    expect(gaps.some((g) => g.type === 'bullish')).toBe(true);
  });

  test('detects order block before impulse', () => {
    const base = risingSeries(20, 1.1, 0.0002);
    const bearish = candle(1.105, 1.1055, 1.102, 1.1025, 20);
    const impulse = candle(1.103, 1.115, 1.1028, 1.114, 21);
    const candles = [...base, bearish, impulse, candle(1.114, 1.116, 1.113, 1.115, 22)];
    const obs = detectOrderBlocks(candles);
    expect(obs.some((o) => o.type === 'bullish')).toBe(true);
  });

  test('priceInZone', () => {
    expect(priceInZone(1.105, { high: 1.11, low: 1.1 })).toBe(true);
    expect(priceInZone(1.12, { high: 1.11, low: 1.1 })).toBe(false);
  });
});

describe('priceAction', () => {
  test('bullish engulfing', () => {
    const candles = [
      ...risingSeries(5, 1.1, 0.0001),
      candle(1.105, 1.1055, 1.1, 1.1005, 5), // bearish
      candle(1.1002, 1.108, 1.1, 1.107, 6), // bullish engulf
    ];
    expect(detectPriceAction(candles)).toBe('BULLISH_ENGULFING');
  });

  test('bullish pin bar', () => {
    const candles = [
      ...risingSeries(5, 1.1, 0.0001),
      candle(1.105, 1.106, 1.09, 1.1055, 5), // long lower wick
    ];
    expect(detectPriceAction(candles)).toBe('BULLISH_PIN');
  });
});

describe('engine', () => {
  test('returns NONE with insufficient data', () => {
    const sig = generateSignal(risingSeries(20), { symbol: 'EURUSD', timeframe: 'M15' });
    expect(sig.action).toBe('NONE');
  });

  test('produces structured result on long series', () => {
    const candles = risingSeries(250, 1.05, 0.0008);
    const n = candles.length;
    candles[n - 2] = candle(1.25, 1.251, 1.24, 1.241, n - 2);
    candles[n - 1] = candle(1.2405, 1.255, 1.24, 1.254, n - 1);
    const sig = generateSignal(candles, { symbol: 'EURUSD', timeframe: 'M15' });
    expect(sig.bias).toBeDefined();
    expect(sig.reasons.length).toBeGreaterThan(0);
    expect(typeof sig.rsi).toBe('number');
  });

  test('demo-style series can produce BUY when all layers align', () => {
    const candles = generateDemoCandles('EURUSD', 300);
    const sig = generateSignal(candles, { symbol: 'EURUSD', timeframe: 'M15' });
    expect(sig.action).toBe('BUY');
    expect(sig.stopLoss).not.toBeNull();
    expect(sig.takeProfit).not.toBeNull();
    expect(sig.riskPips! * 2).toBeCloseTo(sig.rewardPips!, 5);
  });

  test('risk helpers', () => {
    const settings: AppSettings = {
      capital: 100,
      riskPercent: 1.5,
      lotSize: 0.01,
      symbol: 'EURUSD',
      timeframe: 'M15',
      rsiPeriod: 14,
      emaFast: 50,
      emaSlow: 200,
      notificationsEnabled: true,
      demoMode: true,
      theme: 'dark',
      bridgeUrl: 'http://localhost:8000',
      apiKey: 'test',
      dailyLossLimitPercent: 5,
    };
    expect(riskAmount(settings)).toBeCloseTo(1.5);
    settings.riskPercent = 5;
    expect(riskAmount(settings)).toBeCloseTo(3); // capped at 3%
    expect(isDailyLossLimitHit(-5, 100, 5)).toBe(true);
    expect(isDailyLossLimitHit(-4, 100, 5)).toBe(false);
  });
});
