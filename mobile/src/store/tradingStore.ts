import { create } from 'zustand';
import type {
  SignalResult,
  Position,
  TradeHistoryItem,
  PriceQuote,
  BridgeHealth,
  Candle,
} from '../types';

interface TradingState {
  quote: PriceQuote | null;
  candles: Candle[];
  signal: SignalResult | null;
  positions: Position[];
  history: TradeHistoryItem[];
  health: BridgeHealth;
  loading: boolean;
  error: string | null;
  dailyPnL: number;
  lastSignalKey: string | null;
  setQuote: (q: PriceQuote | null) => void;
  setCandles: (c: Candle[]) => void;
  setSignal: (s: SignalResult | null) => void;
  setPositions: (p: Position[]) => void;
  setHistory: (h: TradeHistoryItem[]) => void;
  setHealth: (h: BridgeHealth) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setDailyPnL: (n: number) => void;
  addHistory: (item: TradeHistoryItem) => void;
  setLastSignalKey: (k: string | null) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  quote: null,
  candles: [],
  signal: null,
  positions: [],
  history: [],
  health: {
    ok: false,
    mt5Connected: false,
    demo: true,
    message: 'Not checked',
    lastCheck: 0,
  },
  loading: false,
  error: null,
  dailyPnL: 0,
  lastSignalKey: null,
  setQuote: (quote) => set({ quote }),
  setCandles: (candles) => set({ candles }),
  setSignal: (signal) => set({ signal }),
  setPositions: (positions) => set({ positions }),
  setHistory: (history) => set({ history }),
  setHealth: (health) => set({ health }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setDailyPnL: (dailyPnL) => set({ dailyPnL }),
  addHistory: (item) => set((s) => ({ history: [item, ...s.history] })),
  setLastSignalKey: (lastSignalKey) => set({ lastSignalKey }),
}));
