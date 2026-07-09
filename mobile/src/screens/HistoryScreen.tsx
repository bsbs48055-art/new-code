import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useTradingStore } from '../store/tradingStore';
import { darkColors, lightColors, fonts, spacing } from '../theme/colors';
import { Metric } from '../components/Metric';

export function HistoryScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const colors = settings.theme === 'dark' ? darkColors : lightColors;
  const history = useTradingStore((s) => s.history);

  const stats = useMemo(() => {
    const wins = history.filter((h) => h.profit > 0).length;
    const total = history.length;
    const winRate = total ? (wins / total) * 100 : 0;
    const totalPnL = history.reduce((s, h) => s + h.profit, 0);
    const avgRR = total
      ? history.reduce((s, h) => s + h.rrAchieved, 0) / total
      : 0;
    return { winRate, totalPnL, avgRR, total };
  }, [history]);

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.sansBold }]}>
        Trade History
      </Text>
      <View style={styles.grid}>
        <Metric label="Trades" value={String(stats.total)} colors={colors} />
        <Metric label="Win rate" value={`${stats.winRate.toFixed(0)}%`} colors={colors} />
        <Metric
          label="Total P/L"
          value={`${stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}`}
          colors={colors}
          valueColor={stats.totalPnL >= 0 ? colors.profit : colors.loss}
        />
        <Metric label="Avg R:R" value={stats.avgRR.toFixed(2)} colors={colors} />
      </View>

      {history.length === 0 ? (
        <Text style={{ color: colors.textMuted, fontFamily: fonts.sans, marginTop: 16 }}>
          No closed trades yet.
        </Text>
      ) : (
        history.map((h) => (
          <View
            key={`${h.ticket}-${h.closeTime}`}
            style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}
          >
            <View style={styles.row}>
              <Text style={[styles.side, { color: h.type === 'BUY' ? colors.buy : colors.sell, fontFamily: fonts.sansBold }]}>
                {h.type} {h.symbol}
              </Text>
              <Text
                style={{
                  color: h.profit >= 0 ? colors.profit : colors.loss,
                  fontFamily: fonts.monoBold,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {h.profit >= 0 ? '+' : ''}
                {h.profit.toFixed(2)}
              </Text>
            </View>
            <Text style={[styles.meta, { color: colors.textSecondary, fontFamily: fonts.mono }]}>
              {h.openPrice.toFixed(5)} → {h.closePrice.toFixed(5)} · R:R {h.rrAchieved.toFixed(2)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: { fontSize: 22, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  side: { fontSize: 15 },
  meta: { fontSize: 12, marginTop: 6, fontVariant: ['tabular-nums'] },
});
