import type {
  Candle,
  SignalResult,
  Timeframe,
  TrendBias,
  AppSettings,
} from '../types';
import { closes, ema, rsi, pipSize, pipsBetween } from './indicators';
import { detectStructure } from './structure';
import { findActiveZone } from './zones';
import {
  detectPriceAction,
  priceActionSupportsBuy,
  priceActionSupportsSell,
} from './priceAction';

export interface StrategyParams {
  symbol: string;
  timeframe: Timeframe;
  rsiPeriod?: number;
  emaFast?: number;
  emaSlow?: number;
  /** RSI buy threshold upper bound (default 45 for early re-entry; classic oversold <30) */
  rsiBuyMax?: number;
  /** RSI sell threshold lower bound (default 55; classic overbought >70) */
  rsiSellMin?: number;
  pipBuffer?: number;
  minRR?: number;
}

function trendBias(price: number, ema50: number, ema200: number): TrendBias {
  if (price > ema50 && ema50 > ema200) return 'BULLISH';
  if (price < ema50 && ema50 < ema200) return 'BEARISH';
  return 'NEUTRAL';
}

/**
 * Full SMC + RSI + MA + Price Action signal engine.
 * Signal fires only when ALL align: trend + structure + zone + RSI + price action.
 */
export function generateSignal(candles: Candle[], params: StrategyParams): SignalResult {
  const {
    symbol,
    timeframe,
    rsiPeriod = 14,
    emaFast = 50,
    emaSlow = 200,
    rsiBuyMax = 45,
    rsiSellMin = 55,
    pipBuffer = 5,
    minRR = 2,
  } = params;

  const reasons: string[] = [];
  const empty: SignalResult = {
    action: 'NONE',
    symbol,
    timeframe,
    bias: 'NEUTRAL',
    structure: 'NONE',
    rsi: NaN,
    ema50: NaN,
    ema200: NaN,
    price: candles[candles.length - 1]?.close ?? 0,
    zone: null,
    priceAction: 'NONE',
    stopLoss: null,
    takeProfit: null,
    riskPips: null,
    rewardPips: null,
    reasons: ['Insufficient candle data'],
    timestamp: Date.now(),
  };

  if (candles.length < Math.max(emaSlow, rsiPeriod) + 10) {
    return empty;
  }

  const c = closes(candles);
  const ema50Series = ema(c, emaFast);
  const ema200Series = ema(c, emaSlow);
  const rsiSeries = rsi(c, rsiPeriod);
  const i = candles.length - 1;
  const price = c[i];
  const ema50 = ema50Series[i];
  const ema200 = ema200Series[i];
  const rsiVal = rsiSeries[i];
  const bias = trendBias(price, ema50, ema200);
  const pip = pipSize(symbol);
  const buffer = pip * pipBuffer;

  reasons.push(`Trend bias: ${bias} (price ${price.toFixed(5)}, EMA${emaFast} ${ema50.toFixed(5)}, EMA${emaSlow} ${ema200.toFixed(5)})`);

  const { event: structure } = detectStructure(candles, bias);
  reasons.push(`Market structure: ${structure}`);

  const zone = findActiveZone(candles, bias, pip);
  if (zone) {
    reasons.push(`Zone: ${zone.kind} ${zone.type} [${zone.low.toFixed(5)} – ${zone.high.toFixed(5)}]`);
  } else {
    reasons.push('No active order block / FVG near price');
  }

  reasons.push(`RSI(${rsiPeriod}): ${rsiVal.toFixed(2)}`);

  const pa = detectPriceAction(candles);
  reasons.push(`Price action: ${pa}`);

  let action: SignalResult['action'] = 'NONE';
  let stopLoss: number | null = null;
  let takeProfit: number | null = null;
  let riskPips: number | null = null;
  let rewardPips: number | null = null;

  const structureOk = structure === 'BOS' || structure === 'CHoCH';
  // For entries we prefer BOS continuation; CHoCH can still align if zone+PA confirm in new bias
  // Spec: structure must be present (BOS/CHoCH detected)
  const rsiBuyOk = rsiVal < 30 || rsiVal <= rsiBuyMax;
  const rsiSellOk = rsiVal > 70 || rsiVal >= rsiSellMin;

  if (
    bias === 'BULLISH' &&
    structureOk &&
    zone &&
    zone.type === 'bullish' &&
    rsiBuyOk &&
    priceActionSupportsBuy(pa)
  ) {
    action = 'BUY';
    const zoneLow = Math.min(zone.high, zone.low);
    stopLoss = zoneLow - buffer;
    riskPips = pipsBetween(price, stopLoss, symbol);
    rewardPips = riskPips * minRR;
    takeProfit = price + rewardPips * pip;
    reasons.push('ALL conditions aligned → BUY');
  } else if (
    bias === 'BEARISH' &&
    structureOk &&
    zone &&
    zone.type === 'bearish' &&
    rsiSellOk &&
    priceActionSupportsSell(pa)
  ) {
    action = 'SELL';
    const zoneHigh = Math.max(zone.high, zone.low);
    stopLoss = zoneHigh + buffer;
    riskPips = pipsBetween(price, stopLoss, symbol);
    rewardPips = riskPips * minRR;
    takeProfit = price - rewardPips * pip;
    reasons.push('ALL conditions aligned → SELL');
  } else {
    const missing: string[] = [];
    if (bias === 'NEUTRAL') missing.push('trend');
    if (!structureOk) missing.push('structure');
    if (!zone) missing.push('zone');
    if (bias === 'BULLISH' && !rsiBuyOk) missing.push('RSI');
    if (bias === 'BEARISH' && !rsiSellOk) missing.push('RSI');
    if (bias === 'BULLISH' && !priceActionSupportsBuy(pa)) missing.push('price action');
    if (bias === 'BEARISH' && !priceActionSupportsSell(pa)) missing.push('price action');
    reasons.push(`No signal — missing: ${missing.join(', ') || 'alignment'}`);
  }

  return {
    action,
    symbol,
    timeframe,
    bias,
    structure,
    rsi: rsiVal,
    ema50,
    ema200,
    price,
    zone,
    priceAction: pa,
    stopLoss,
    takeProfit,
    riskPips,
    rewardPips,
    reasons,
    timestamp: Date.now(),
  };
}

export function riskAmount(settings: AppSettings): number {
  const pct = Math.min(settings.riskPercent, 3);
  return (settings.capital * pct) / 100;
}

export function riskPercentOfCapital(settings: AppSettings): number {
  return Math.min(settings.riskPercent, 3);
}

/** Hard daily loss limit check */
export function isDailyLossLimitHit(
  dailyPnL: number,
  capital: number,
  limitPercent = 5,
): boolean {
  const limit = -(capital * limitPercent) / 100;
  return dailyPnL <= limit;
}
