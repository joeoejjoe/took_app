import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { Card } from '../common';

interface ExchangeChartProps {
  fromCurrency: string;
  toCurrency: string;
}

const MOCK_CHART_DATA = [
  { label: '6 month ago', value: 5.41 },
  { label: '', value: 5.35 },
  { label: '', value: 5.52 },
  { label: '', value: 5.38 },
  { label: '', value: 5.45 },
  { label: '', value: 5.30 },
  { label: '', value: 5.249 },
  { label: 'Today', value: 5.249 },
];

const CHART_WIDTH = 280;
const CHART_HEIGHT = 120;
const PADDING_LEFT = 10;
const PADDING_RIGHT = 10;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 20;

export default function ExchangeChart({ fromCurrency, toCurrency }: ExchangeChartProps) {
  const colors = useColors();

  const values = MOCK_CHART_DATA.map((d) => d.value);
  const minVal = Math.min(...values) - 0.05;
  const maxVal = Math.max(...values) + 0.05;
  const rangeVal = maxVal - minVal;

  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const points = MOCK_CHART_DATA.map((d, i) => {
    const x = PADDING_LEFT + (i / (MOCK_CHART_DATA.length - 1)) * plotWidth;
    const y = PADDING_TOP + (1 - (d.value - minVal) / rangeVal) * plotHeight;
    return { x, y, value: d.value };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  const lastPoint = points[points.length - 1];

  const yLabels = [maxVal, (maxVal + minVal) / 2, minVal].map((v) => ({
    value: v.toFixed(3),
    y: PADDING_TOP + (1 - (v - minVal) / rangeVal) * plotHeight,
  }));

  return (
    <Card variant="dark" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>지금 보유하기 좋은 원화</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{fromCurrency}</Text>
        </View>
        <TouchableOpacity style={[styles.rateCircle, { backgroundColor: colors.primaryBg }]}>
          <Ionicons name="trending-up" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
          {yLabels.map((label, i) => (
            <Line
              key={i}
              x1={PADDING_LEFT}
              y1={label.y}
              x2={CHART_WIDTH - PADDING_RIGHT}
              y2={label.y}
              stroke={colors.chartGrid}
              strokeWidth={0.5}
              strokeDasharray="3,3"
            />
          ))}

          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={colors.chartLine}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          <Circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={4}
            fill={colors.primary}
          />
          <Circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={7}
            fill="none"
            stroke={colors.primary}
            strokeWidth={1}
            opacity={0.3}
          />
        </Svg>

        <View style={styles.yAxisLabels}>
          {yLabels.map((label, i) => (
            <Text key={i} style={[styles.yLabel, { top: label.y - 6, color: colors.textMuted }]}>
              {label.value}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.xAxisLabels}>
        <Text style={[styles.xLabel, { color: colors.textMuted }]}>A month ago</Text>
        <Text style={[styles.xLabel, { color: colors.textMuted }]}>Today</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  rateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  yAxisLabels: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  yLabel: {
    position: 'absolute',
    right: 0,
    fontSize: 10,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    paddingHorizontal: PADDING_LEFT,
  },
  xLabel: {
    fontSize: 10,
  },
});
