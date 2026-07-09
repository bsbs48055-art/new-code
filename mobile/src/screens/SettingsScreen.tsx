import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  Pressable,
} from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { darkColors, lightColors, fonts, spacing } from '../theme/colors';
import type { Timeframe } from '../types';

const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'XAUUSD'];
const TIMEFRAMES: Timeframe[] = ['M5', 'M15', 'M30', 'H1', 'H4'];

export function SettingsScreen() {
  const { settings, setSettings } = useSettingsStore();
  const colors = settings.theme === 'dark' ? darkColors : lightColors;
  const [capital, setCapital] = useState(String(settings.capital));
  const [risk, setRisk] = useState(String(settings.riskPercent));
  const [lot, setLot] = useState(String(settings.lotSize));
  const [rsi, setRsi] = useState(String(settings.rsiPeriod));
  const [emaFast, setEmaFast] = useState(String(settings.emaFast));
  const [emaSlow, setEmaSlow] = useState(String(settings.emaSlow));
  const [bridgeUrl, setBridgeUrl] = useState(settings.bridgeUrl);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await setSettings({
      capital: Math.max(10, parseFloat(capital) || 100),
      riskPercent: Math.min(3, Math.max(0.1, parseFloat(risk) || 1.5)),
      lotSize: Math.max(0.01, parseFloat(lot) || 0.01),
      rsiPeriod: Math.max(2, parseInt(rsi, 10) || 14),
      emaFast: Math.max(2, parseInt(emaFast, 10) || 50),
      emaSlow: Math.max(5, parseInt(emaSlow, 10) || 200),
      bridgeUrl: bridgeUrl.trim(),
      apiKey: apiKey.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const Field = ({
    label,
    value,
    onChange,
    keyboard = 'default' as 'default' | 'decimal-pad' | 'number-pad',
    secure,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    keyboard?: 'default' | 'decimal-pad' | 'number-pad';
    secure?: boolean;
  }) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textMuted, fontFamily: fonts.sans }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            color: colors.text,
            borderColor: colors.border,
            fontFamily: fonts.mono,
          },
        ]}
      />
    </View>
  );

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.sansBold }]}>Settings</Text>

      <Field label="Account capital ($)" value={capital} onChange={setCapital} keyboard="decimal-pad" />
      <Field label="Risk % per trade (max 3%)" value={risk} onChange={setRisk} keyboard="decimal-pad" />
      <Field label="Lot size (default 0.01)" value={lot} onChange={setLot} keyboard="decimal-pad" />
      <Field label="RSI period" value={rsi} onChange={setRsi} keyboard="number-pad" />
      <Field label="EMA fast" value={emaFast} onChange={setEmaFast} keyboard="number-pad" />
      <Field label="EMA slow" value={emaSlow} onChange={setEmaSlow} keyboard="number-pad" />

      <Text style={[styles.section, { color: colors.text, fontFamily: fonts.sansMedium }]}>Symbol</Text>
      <View style={styles.chips}>
        {SYMBOLS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setSettings({ symbol: s })}
            style={[
              styles.chip,
              {
                backgroundColor: settings.symbol === s ? colors.accent : colors.bgMuted,
              },
            ]}
          >
            <Text style={{ color: settings.symbol === s ? '#fff' : colors.text, fontFamily: fonts.mono, fontSize: 12 }}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.section, { color: colors.text, fontFamily: fonts.sansMedium }]}>Timeframe</Text>
      <View style={styles.chips}>
        {TIMEFRAMES.map((tf) => (
          <Pressable
            key={tf}
            onPress={() => setSettings({ timeframe: tf })}
            style={[
              styles.chip,
              {
                backgroundColor: settings.timeframe === tf ? colors.accent : colors.bgMuted,
              },
            ]}
          >
            <Text style={{ color: settings.timeframe === tf ? '#fff' : colors.text, fontFamily: fonts.mono, fontSize: 12 }}>
              {tf}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={{ color: colors.text, fontFamily: fonts.sans }}>Notifications</Text>
        <Switch
          value={settings.notificationsEnabled}
          onValueChange={(v) => setSettings({ notificationsEnabled: v })}
          trackColor={{ true: colors.accent }}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={{ color: colors.text, fontFamily: fonts.sans }}>Demo mode</Text>
        <Switch
          value={settings.demoMode}
          onValueChange={(v) => setSettings({ demoMode: v })}
          trackColor={{ true: colors.warning }}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={{ color: colors.text, fontFamily: fonts.sans }}>Dark theme</Text>
        <Switch
          value={settings.theme === 'dark'}
          onValueChange={(v) => setSettings({ theme: v ? 'dark' : 'light' })}
          trackColor={{ true: colors.accent }}
        />
      </View>

      <Text style={[styles.section, { color: colors.text, fontFamily: fonts.sansMedium }]}>
        MT5 Bridge
      </Text>
      <Field label="Bridge URL" value={bridgeUrl} onChange={setBridgeUrl} />
      <Field label="API Key" value={apiKey} onChange={setApiKey} secure />

      <Pressable style={[styles.save, { backgroundColor: colors.accent }]} onPress={save}>
        <Text style={{ color: '#fff', fontFamily: fonts.sansBold }}>
          {saved ? 'Saved' : 'Save settings'}
        </Text>
      </Pressable>

      <Text style={[styles.disclaimer, { color: colors.textMuted, fontFamily: fonts.sans }]}>
        This is a decision-support tool, not financial advice. Trading forex involves substantial risk of loss.
        The MT5 bridge must run on a Windows VPS with MetaTrader 5 logged in.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 48 },
  title: { fontSize: 22, marginBottom: 16 },
  field: { marginBottom: 12 },
  label: { fontSize: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  section: { fontSize: 15, marginTop: 16, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  save: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disclaimer: { fontSize: 11, marginTop: 20, lineHeight: 16 },
});
