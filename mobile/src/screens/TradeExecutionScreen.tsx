import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '../store/settingsStore';
import { useTradingStore } from '../store/tradingStore';
import { darkColors, lightColors, fonts, spacing } from '../theme/colors';
import { Metric } from '../components/Metric';
import { placeOrder } from '../services/bridgeApi';
import { riskAmount, riskPercentOfCapital } from '../strategy';

export function TradeExecutionScreen() {
  const navigation = useNavigation();
  const settings = useSettingsStore((s) => s.settings);
  const colors = settings.theme === 'dark' ? darkColors : lightColors;
  const { signal, positions, setPositions } = useTradingStore();
  const [submitting, setSubmitting] = useState(false);

  if (!signal || signal.action === 'NONE' || signal.stopLoss == null || signal.takeProfit == null) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg, padding: 16 }]}>
        <Text style={{ color: colors.textSecondary, fontFamily: fonts.sans }}>
          No actionable signal. Wait for BUY/SELL alignment.
        </Text>
      </View>
    );
  }

  const hasOpen = positions.some((p) => p.symbol === settings.symbol);
  const risk$ = riskAmount(settings);
  const riskPct = riskPercentOfCapital(settings);

  const onConfirm = () => {
    if (hasOpen) {
      Alert.alert('Blocked', 'Only one open position per symbol is allowed.');
      return;
    }
    Alert.alert(
      `Confirm ${signal.action}`,
      `Lot ${settings.lotSize} · SL ${signal.stopLoss!.toFixed(5)} · TP ${signal.takeProfit!.toFixed(5)}\nRisk ≈ $${risk$.toFixed(2)} (${riskPct}%)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              const res = await placeOrder(settings, {
                symbol: settings.symbol,
                type: signal.action as 'BUY' | 'SELL',
                lot: settings.lotSize,
                sl: signal.stopLoss!,
                tp: signal.takeProfit!,
              });
              if (settings.demoMode) {
                setPositions([
                  ...positions,
                  {
                    ticket: res.ticket,
                    symbol: settings.symbol,
                    type: signal.action as 'BUY' | 'SELL',
                    volume: settings.lotSize,
                    openPrice: signal.price,
                    currentPrice: signal.price,
                    sl: signal.stopLoss!,
                    tp: signal.takeProfit!,
                    profit: 0,
                    openTime: Date.now(),
                  },
                ]);
              }
              Alert.alert('Order placed', `Ticket #${res.ticket}\n${res.message}`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (e) {
              Alert.alert('Order failed', (e as Error).message);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.sansBold }]}>
        Confirm trade
      </Text>
      <Text style={[styles.sub, { color: colors.textSecondary, fontFamily: fonts.sans }]}>
        Explicit confirmation required — no auto-execution in v1.
      </Text>

      <View style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
        <View style={styles.grid}>
          <Metric label="Side" value={signal.action} colors={colors} valueColor={signal.action === 'BUY' ? colors.buy : colors.sell} mono={false} />
          <Metric label="Symbol" value={settings.symbol} colors={colors} mono={false} />
          <Metric label="Lot" value={settings.lotSize.toFixed(2)} colors={colors} />
          <Metric label="Entry ≈" value={signal.price.toFixed(5)} colors={colors} />
          <Metric label="SL" value={signal.stopLoss.toFixed(5)} colors={colors} valueColor={colors.sell} />
          <Metric label="TP" value={signal.takeProfit.toFixed(5)} colors={colors} valueColor={colors.buy} />
          <Metric label="Risk $" value={risk$.toFixed(2)} colors={colors} />
          <Metric label="Risk %" value={`${riskPct.toFixed(1)}%`} colors={colors} />
        </View>
      </View>

      {hasOpen && (
        <Text style={[styles.warn, { color: colors.sell, fontFamily: fonts.sansMedium }]}>
          An open position already exists for {settings.symbol}.
        </Text>
      )}

      <Pressable
        style={[
          styles.btn,
          {
            backgroundColor: hasOpen ? colors.textMuted : signal.action === 'BUY' ? colors.buy : colors.sell,
            opacity: submitting ? 0.7 : 1,
          },
        ]}
        disabled={hasOpen || submitting}
        onPress={onConfirm}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.btnText, { fontFamily: fonts.sansBold }]}>
            Tap to confirm {signal.action}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: { fontSize: 22 },
  sub: { fontSize: 13, marginTop: 6, marginBottom: 20 },
  card: { borderWidth: 1, borderRadius: 10, padding: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  warn: { marginTop: 16, fontSize: 13 },
  btn: {
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16 },
});
