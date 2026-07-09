import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SignalAction } from '../types';
import type { ThemeColors } from '../theme/colors';
import { fonts } from '../theme/colors';

interface Props {
  action: SignalAction;
  colors: ThemeColors;
}

export function SignalBadge({ action, colors }: Props) {
  const bg =
    action === 'BUY' ? colors.buy : action === 'SELL' ? colors.sell : colors.bgMuted;
  const fg = action === 'NONE' ? colors.textSecondary : '#FFFFFF';
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg, fontFamily: fonts.sansBold }]}>{action}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 18,
    letterSpacing: 1.5,
  },
});
