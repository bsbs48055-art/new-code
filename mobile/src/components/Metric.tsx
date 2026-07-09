import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ThemeColors } from '../theme/colors';
import { fonts } from '../theme/colors';

interface Props {
  label: string;
  value: string;
  colors: ThemeColors;
  valueColor?: string;
  mono?: boolean;
}

export function Metric({ label, value, colors, valueColor, mono = true }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.textMuted, fontFamily: fonts.sans }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: valueColor ?? colors.text,
            fontFamily: mono ? fonts.mono : fonts.sansMedium,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minWidth: '30%',
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
});
