export type TradeSide = 'BUY' | 'SELL';
export type SignalAction = 'BUY' | 'SELL' | 'NONE';
export type TrendBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type StructureEvent = 'BOS' | 'CHoCH' | 'NONE';
export type PriceActionPattern = 'BULLISH_ENGULFING' | 'BEARISH_ENGULFING' | 'BULLISH_PIN' | 'BEARISH_PIN' | 'NONE';
export type Timeframe = 'M5' | 'M15' | 'M30' | 'H1' | 'H4';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface SwingPoint {
  index: number;
  price: number;
  type: 'high' | 'low';
  time: number;
}

export interface OrderBlock {
  type: 'bullish' | 'bearish';
  high: number;
  low: number;
  index: number;
  time: number;
}

export interface FairValueGap {
  type: 'bullish' | 'bearish';
  high: number;
  low: number;
  index: number;
  time: number;
}

export interface Zone {
  kind: 'order_block' | 'fvg';
  type: 'bullish' | 'bearish';
  high: number;
  low: number;
  index: number;
}

export interface SignalResult {
  action: SignalAction;
  symbol: string;
  timeframe: Timeframe;
  bias: TrendBias;
  structure: StructureEvent;
  rsi: number;
  ema50: number;
  ema200: number;
  price: number;
  zone: Zone | null;
  priceAction: PriceActionPattern;
  stopLoss: number | null;
  takeProfit: number | null;
  riskPips: number | null;
  rewardPips: number | null;
  reasons: string[];
  timestamp: number;
}

export interface PriceQuote {
  symbol: string;
  bid: number;
  ask: number;
  time: number;
}

export interface Position {
  ticket: number;
  symbol: string;
  type: TradeSide;
  volume: number;
  openPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  profit: number;
  openTime: number;
  magic?: number;
}

export interface TradeHistoryItem {
  ticket: number;
  symbol: string;
  type: TradeSide;
  volume: number;
  openPrice: number;
  closePrice: number;
  sl: number;
  tp: number;
  profit: number;
  openTime: number;
  closeTime: number;
  rrAchieved: number;
}

export interface BridgeHealth {
  ok: boolean;
  mt5Connected: boolean;
  demo: boolean;
  message: string;
  lastCheck: number;
}

export interface AppSettings {
  capital: number;
  riskPercent: number;
  lotSize: number;
  symbol: string;
  timeframe: Timeframe;
  rsiPeriod: number;
  emaFast: number;
  emaSlow: number;
  notificationsEnabled: boolean;
  demoMode: boolean;
  theme: 'dark' | 'light';
  bridgeUrl: string;
  apiKey: string;
  dailyLossLimitPercent: number;
}

export interface PlaceOrderRequest {
  symbol: string;
  type: TradeSide;
  lot: number;
  sl: number;
  tp: number;
}
