import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSettingsStore } from '../store/settingsStore';
import { useTradingStore } from '../store/tradingStore';
import { darkColors, lightColors, fonts, spacing } from '../theme/colors';
import { SignalBadge } from '../components/SignalBadge';
import { Metric } from '../components/Metric';
import type { RootStackParamList } from '../navigation/types';

export function SignalDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const settings = useSettingsStore((s) => s.settings);
  const colors = settings.theme === 'dark' ? darkColors : lightColors;
  const signal = useTradingStore((s) => s.signal);

  if (!signal) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textSecondary, fontFamily: fonts.sans, padding: 16 }}>
          No signal data yet. Pull to refresh on Dashboard.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <SignalBadge action={signal.action} colors={colors} />
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.sansBold }]}>
        Why this signal
      </Text>

      <View style={styles.grid}>
        <Metric label="Structure" value={signal.structure} colors={colors} mono={false} />
        <Metric label="Bias" value={signal.bias} colors={colors} mono={false} />
        <Metric label="RSI" value={Number.isNaN(signal.rsi) ? '—' : signal.rsi.toFixed(2)} colors={colors} />
        <Metric label="EMA50" value={Number.isNaN(signal.ema50) ? '—' : signal.ema50.toFixed(5)} colors={colors} />
        <Metric label="EMA200" value={Number.isNaN(signal.ema200) ? '—' : signal.ema200.toFixed(5)} colors={colors} />
        <Metric label="Price Action" value={signal.priceAction.replace(/_/g, ' ')} colors={colors} mono={false} />
      </View>

      {signal.zone && (
        <View style={[styles.zone, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
          <Text style={[styles.zoneTitle, { color: colors.text, fontFamily: fonts.sansMedium }]}>
            {signal.zone.kind === 'order_block' ? 'Order Block' : 'Fair Value Gap'} ({signal.zone.type})
          </Text>
          <Text style={[styles.zoneRange, { color: colors.textSecondary, fontFamily: fonts.mono }]}>
            {signal.zone.low.toFixed(5)} – {signal.zone.high.toFixed(5)}
          </Text>
        </View>
      )}

      <View style={styles.grid}>
        <Metric
          label="Stop Loss"
          value={signal.stopLoss != null ? signal.stopLoss.toFixed(5) : '—'}
          colors={colors}
          valueColor={colors.sell}
        />
        <Metric
          label="Take Profit"
          value={signal.takeProfit != null ? signal.takeProfit.toFixed(5) : '—'}
          colors={colors}
          valueColor={colors.buy}
        />
        <Metric
          label="R:R"
          value={signal.riskPips && signal.rewardPips ? `1:${(signal.rewardPips / signal.riskPips).toFixed(1)}` : '—'}
          colors={colors}
        />
      </View>

      <Text style={[styles.reasonsTitle, { color: colors.text, fontFamily: fonts.sansMedium }]}>
        Checklist
      </Text>
      {signal.reasons.map((r, i) => (
        <Text key={i} style={[styles.reason, { color: colors.textSecondary, fontFamily: fonts.sans }]}>
          · {r}
        </Text>
      ))}

      {signal.action !== 'NONE' && signal.stopLoss != null && (
        <Pressable
          style={[styles.btn, { backgroundColor: signal.action === 'BUY' ? colors.buy : colors.sell }]}
          onPress={() => navigation.navigate('TradeExecution')}
        >
          <Text style={[styles.btnText, { fontFamily: fonts.sansBold }]}>Continue to Execute</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: { fontSize: 20, marginTop: 16, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zone: {
    marginVertical: 16,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  zoneTitle: { fontSize: 14, marginBottom: 4 },
  zoneRange: { fontSize: 15, fontVariant: ['tabular-nums'] },
  reasonsTitle: { fontSize: 15, marginTop: 16, marginBottom: 8 },
  reason: { fontSize: 13, lineHeight: 20, marginBottom: 4 },
  btn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 15 },
});
