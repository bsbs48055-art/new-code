import { useCallback, useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useTradingStore } from '../store/tradingStore';
import {
  fetchHealth,
  fetchPrice,
  fetchCandles,
  fetchSignal,
  fetchPositions,
} from '../services/bridgeApi';
import { isDailyLossLimitHit } from '../strategy';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useMarketPolling(intervalMs = 8000) {
  const settings = useSettingsStore((s) => s.settings);
  const {
    setQuote,
    setCandles,
    setSignal,
    setPositions,
    setHealth,
    setLoading,
    setError,
    dailyPnL,
    lastSignalKey,
    setLastSignalKey,
  } = useTradingStore();
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const health = await fetchHealth(settings);
      setHealth(health);

      if (!settings.demoMode && !health.ok) {
        setError('Bridge Offline');
        busy.current = false;
        return;
      }

      setError(null);
      const [quote, candles, positions] = await Promise.all([
        fetchPrice(settings),
        fetchCandles(settings),
        fetchPositions(settings),
      ]);
      setQuote(quote);
      setCandles(candles);
      setPositions(positions);

      if (isDailyLossLimitHit(dailyPnL, settings.capital, settings.dailyLossLimitPercent)) {
        setSignal({
          action: 'NONE',
          symbol: settings.symbol,
          timeframe: settings.timeframe,
          bias: 'NEUTRAL',
          structure: 'NONE',
          rsi: NaN,
          ema50: NaN,
          ema200: NaN,
          price: quote.bid,
          zone: null,
          priceAction: 'NONE',
          stopLoss: null,
          takeProfit: null,
          riskPips: null,
          rewardPips: null,
          reasons: [
            `Daily loss limit hit (−${settings.dailyLossLimitPercent}% of capital). Signaling paused.`,
          ],
          timestamp: Date.now(),
        });
      } else {
        const signal = await fetchSignal(settings, candles);
        setSignal(signal);
        const key = `${signal.action}-${signal.timestamp}-${signal.price}`;
        if (
          settings.notificationsEnabled &&
          signal.action !== 'NONE' &&
          key !== lastSignalKey
        ) {
          setLastSignalKey(key);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${signal.action} signal — ${signal.symbol}`,
              body: `RSI ${signal.rsi.toFixed(1)} · SL ${signal.stopLoss?.toFixed(5)} · TP ${signal.takeProfit?.toFixed(5)}`,
            },
            trigger: null,
          }).catch(() => undefined);
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      busy.current = false;
    }
  }, [
    settings,
    dailyPnL,
    lastSignalKey,
    setQuote,
    setCandles,
    setSignal,
    setPositions,
    setHealth,
    setLoading,
    setError,
    setLastSignalKey,
  ]);

  useEffect(() => {
    setLoading(true);
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs, setLoading]);

  return { refresh };
}
