import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings } from '../types';

const STORAGE_KEY = '@smc_forex_settings';

export const DEFAULT_SETTINGS: AppSettings = {
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
  bridgeUrl: 'http://10.0.2.2:8000',
  apiKey: 'change-me-in-settings',
  dailyLossLimitPercent: 5,
};

interface SettingsState {
  settings: AppSettings;
  hydrated: boolean;
  setSettings: (partial: Partial<AppSettings>) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        set({ settings: { ...DEFAULT_SETTINGS, ...parsed }, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },
  setSettings: async (partial) => {
    const next = { ...get().settings, ...partial };
    // Enforce caps
    next.riskPercent = Math.min(Math.max(next.riskPercent, 0.1), 3);
    next.lotSize = 0.01; // locked unless explicitly changed via settings UI
    if (partial.lotSize !== undefined) {
      next.lotSize = Math.max(0.01, Math.round(partial.lotSize * 100) / 100);
    }
    set({ settings: next });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },
}));
