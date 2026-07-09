import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSettingsStore } from '../store/settingsStore';
import { useTradingStore } from '../store/tradingStore';
import { useMarketPolling } from '../hooks/useMarketPolling';
import { BridgeBanner } from '../components/BridgeBanner';
import { MiniChart } from '../components/MiniChart';
import { Metric } from '../components/Metric';
import { SignalBadge } from '../components/SignalBadge';
import { darkColors, lightColors, fonts, spacing } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';
import { riskAmount } from '../strategy';

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const settings = useSettingsStore((s) => s.settings);
  const colors = settings.theme === 'dark' ? darkColors : lightColors;
  const { quote, candles, signal, positions, health, loading, error, dailyPnL } =
    useTradingStore();
  const { refresh } = useMarketPolling();

  const mid = quote ? (quote.bid + quote.ask) / 2 : signal?.price ?? 0;
  const openPnL = positions.reduce((s, p) => s + p.profit, 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <BridgeBanner
        healthOk={health.ok && !error}
        demo={settings.demoMode}
        message={error || health.message}
        colors={colors}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />
        }
      >
        <Text style={[styles.brand, { color: colors.text, fontFamily: fonts.sansBold }]}>
          SMC Signal
        </Text>
        <Text style={[styles.symbol, { color: colors.textSecondary, fontFamily: fonts.sans }]}>
          {settings.symbol} · {settings.timeframe}
        </Text>

        <Text style={[styles.price, { color: colors.text, fontFamily: fonts.monoBold }]}>
          {mid ? mid.toFixed(settings.symbol.includes('JPY') ? 3 : 5) : '—'}
        </Text>
        {quote && (
          <Text style={[styles.spread, { color: colors.textMuted, fontFamily: fonts.mono }]}>
            Bid {quote.bid.toFixed(5)} · Ask {quote.ask.toFixed(5)}
          </Text>
        )}

        <View style={styles.signalRow}>
          <SignalBadge action={signal?.action ?? 'NONE'} colors={colors} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.bias, { color: colors.textSecondary, fontFamily: fonts.sansMedium }]}>
              Bias: {signal?.bias ?? '—'}
            </Text>
            <Text style={[styles.rsi, { color: colors.text, fontFamily: fonts.mono }]}>
              RSI {signal?.rsi != null && !Number.isNaN(signal.rsi) ? signal.rsi.toFixed(1) : '—'}
            </Text>
          </View>
        </View>

        <MiniChart candles={candles} colors={colors} />

        <View style={styles.metrics}>
          <Metric
            label="Open P/L"
            value={`${openPnL >= 0 ? '+' : ''}${openPnL.toFixed(2)}`}
            colors={colors}
            valueColor={openPnL >= 0 ? colors.profit : colors.loss}
          />
          <Metric
            label="Daily P/L"
            value={`${dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)}`}
            colors={colors}
            valueColor={dailyPnL >= 0 ? colors.profit : colors.loss}
          />
          <Metric
            label="Risk $"
            value={riskAmount(settings).toFixed(2)}
            colors={colors}
          />
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('SignalDetail')}
          >
            <Text style={[styles.btnText, { fontFamily: fonts.sansBold }]}>Signal Detail</Text>
          </Pressable>
          {signal?.action !== 'NONE' && signal?.stopLoss != null && signal?.takeProfit != null && (
            <Pressable
              style={[
                styles.btn,
                {
                  backgroundColor: signal.action === 'BUY' ? colors.buy : colors.sell,
                  marginTop: 10,
                },
              ]}
              onPress={() => navigation.navigate('TradeExecution')}
            >
              <Text style={[styles.btnText, { fontFamily: fonts.sansBold }]}>
                Review {signal.action}
              </Text>
            </Pressable>
          )}
        </View>

        <Text style={[styles.disclaimer, { color: colors.textMuted, fontFamily: fonts.sans }]}>
          Decision-support tool only — not financial advice. Trading involves risk of loss.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  brand: { fontSize: 22, letterSpacing: 0.5 },
  symbol: { fontSize: 13, marginTop: 2, marginBottom: 12 },
  price: { fontSize: 36, fontVariant: ['tabular-nums'] },
  spread: { fontSize: 12, marginTop: 4, marginBottom: 16 },
  signalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  bias: { fontSize: 14 },
  rsi: { fontSize: 18, marginTop: 2, fontVariant: ['tabular-nums'] },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 8 },
  actions: { marginTop: 20 },
  btn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 15, letterSpacing: 0.4 },
  disclaimer: { fontSize: 11, marginTop: 24, lineHeight: 16 },
});
