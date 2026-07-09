import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useTradingStore } from '../store/tradingStore';
import { darkColors, lightColors, fonts, spacing } from '../theme/colors';
import { closeOrder, fetchPositions } from '../services/bridgeApi';
import { useMarketPolling } from '../hooks/useMarketPolling';

export function PositionsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const colors = settings.theme === 'dark' ? darkColors : lightColors;
  const { positions, setPositions, addHistory, setDailyPnL, dailyPnL } = useTradingStore();
  const { refresh } = useMarketPolling();
  const [loading, setLoading] = useState(false);

  const onClose = (ticket: number) => {
    const pos = positions.find((p) => p.ticket === ticket);
    if (!pos) return;
    Alert.alert('Close position', `Close #${ticket} ${pos.symbol}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        style: 'destructive',
        onPress: async () => {
          try {
            await closeOrder(settings, ticket);
            addHistory({
              ticket: pos.ticket,
              symbol: pos.symbol,
              type: pos.type,
              volume: pos.volume,
              openPrice: pos.openPrice,
              closePrice: pos.currentPrice,
              sl: pos.sl,
              tp: pos.tp,
              profit: pos.profit,
              openTime: pos.openTime,
              closeTime: Date.now(),
              rrAchieved: pos.sl !== pos.openPrice
                ? Math.abs(pos.currentPrice - pos.openPrice) / Math.abs(pos.openPrice - pos.sl)
                : 0,
            });
            setDailyPnL(dailyPnL + pos.profit);
            setPositions(positions.filter((p) => p.ticket !== ticket));
          } catch (e) {
            Alert.alert('Close failed', (e as Error).message);
          }
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setLoading(true);
    try {
      if (!settings.demoMode) {
        const p = await fetchPositions(settings);
        setPositions(p);
      }
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.sansBold }]}>
        Open Positions
      </Text>
      {positions.length === 0 ? (
        <Text style={{ color: colors.textMuted, fontFamily: fonts.sans, marginTop: 12 }}>
          No open positions.
        </Text>
      ) : (
        positions.map((p) => (
          <View
            key={p.ticket}
            style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}
          >
            <View style={styles.row}>
              <Text style={[styles.side, { color: p.type === 'BUY' ? colors.buy : colors.sell, fontFamily: fonts.sansBold }]}>
                {p.type} {p.symbol}
              </Text>
              <Text
                style={[
                  styles.pnl,
                  {
                    color: p.profit >= 0 ? colors.profit : colors.loss,
                    fontFamily: fonts.monoBold,
                  },
                ]}
              >
                {p.profit >= 0 ? '+' : ''}
                {p.profit.toFixed(2)}
              </Text>
            </View>
            <Text style={[styles.meta, { color: colors.textSecondary, fontFamily: fonts.mono }]}>
              #{p.ticket} · {p.volume} lot · @ {p.openPrice.toFixed(5)}
            </Text>
            <Text style={[styles.meta, { color: colors.textMuted, fontFamily: fonts.mono }]}>
              SL {p.sl.toFixed(5)} · TP {p.tp.toFixed(5)} · Now {p.currentPrice.toFixed(5)}
            </Text>
            <Pressable
              style={[styles.closeBtn, { borderColor: colors.sell }]}
              onPress={() => onClose(p.ticket)}
            >
              <Text style={{ color: colors.sell, fontFamily: fonts.sansMedium }}>Close</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: { fontSize: 22, marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  side: { fontSize: 16 },
  pnl: { fontSize: 18, fontVariant: ['tabular-nums'] },
  meta: { fontSize: 12, marginTop: 6, fontVariant: ['tabular-nums'] },
  closeBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
});
