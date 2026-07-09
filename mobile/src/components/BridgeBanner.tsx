import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ThemeColors } from '../theme/colors';
import { fonts } from '../theme/colors';

interface Props {
  healthOk: boolean;
  demo: boolean;
  message: string;
  colors: ThemeColors;
}

export function BridgeBanner({ healthOk, demo, message, colors }: Props) {
  if (healthOk && !demo) return null;
  if (healthOk && demo) {
    return (
      <View style={[styles.banner, { backgroundColor: colors.bgMuted }]}>
        <Text style={[styles.text, { color: colors.warning, fontFamily: fonts.sansMedium }]}>
          DEMO MODE — simulated data, no live broker orders
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.banner, { backgroundColor: colors.banner }]}>
      <Text style={[styles.text, { color: colors.bannerText, fontFamily: fonts.sansBold }]}>
        Bridge Offline
      </Text>
      <Text style={[styles.sub, { color: colors.bannerText, fontFamily: fonts.sans }]}>
        {message || 'Cannot reach MT5 bridge. Check VPS URL / API key.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  sub: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.9,
  },
});
