import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import type { Candle } from '../types';
import type { ThemeColors } from '../theme/colors';

interface Props {
  candles: Candle[];
  height?: number;
  colors: ThemeColors;
  maxBars?: number;
}

export function MiniChart({ candles, height = 140, colors, maxBars = 48 }: Props) {
  const data = useMemo(() => candles.slice(-maxBars), [candles, maxBars]);

  if (data.length < 2) {
    return <View style={[styles.empty, { height, backgroundColor: colors.bgMuted }]} />;
  }

  const width = 340;
  const pad = 4;
  const highs = data.map((c) => c.high);
  const lows = data.map((c) => c.low);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const range = max - min || 1;
  const barW = (width - pad * 2) / data.length;

  const y = (price: number) => pad + ((max - price) / range) * (height - pad * 2);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bgMuted, height }]}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {data.map((c, i) => {
          const x = pad + i * barW + barW * 0.15;
          const bw = barW * 0.7;
          const bull = c.close >= c.open;
          const color = bull ? colors.buy : colors.sell;
          const bodyTop = y(Math.max(c.open, c.close));
          const bodyBot = y(Math.min(c.open, c.close));
          const bodyH = Math.max(1, bodyBot - bodyTop);
          return (
            <React.Fragment key={c.time}>
              <Line
                x1={x + bw / 2}
                y1={y(c.high)}
                x2={x + bw / 2}
                y2={y(c.low)}
                stroke={color}
                strokeWidth={1}
              />
              <Rect x={x} y={bodyTop} width={bw} height={bodyH} fill={color} />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  empty: {
    borderRadius: 8,
    width: '100%',
  },
});
