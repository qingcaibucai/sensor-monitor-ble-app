import React from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Svg, { Path, Line, Text as SvgText, G, Circle } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ChartDataPoint } from "@/hooks/useSensorData";

interface LineChartProps {
  data: ChartDataPoint[];
  title: string;
  unit: string;
  color: string;
  height?: number;
}

const CHART_PADDING = 45;
const CHART_PADDING_RIGHT = 15;
const CHART_PADDING_BOTTOM = 40;
const CHART_PADDING_TOP = 15;

export function LineChart({
  data,
  title,
  unit,
  color,
  height = 220,
}: LineChartProps) {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get("window").width - Spacing.lg * 2;
  const chartWidth = screenWidth - CHART_PADDING - CHART_PADDING_RIGHT;
  const chartHeight = height - CHART_PADDING_BOTTOM - CHART_PADDING_TOP;

  const getPath = () => {
    if (data.length < 2) return "";

    const values = data.map((d) => d.value);
    const minValue = Math.min(...values) - 0.1;
    const maxValue = Math.max(...values) + 0.1;
    const range = maxValue - minValue || 1;

    const points = data.map((point, index) => {
      const x = CHART_PADDING + (index / (data.length - 1)) * chartWidth;
      const y = CHART_PADDING_TOP + chartHeight - ((point.value - minValue) / range) * chartHeight;
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return path;
  };

  const getYAxisLabels = () => {
    if (data.length === 0) return [0, 0.5, 1];
    const values = data.map((d) => d.value);
    const minValue = Math.min(...values) - 0.1;
    const maxValue = Math.max(...values) + 0.1;
    const range = maxValue - minValue || 1;
    return [
      minValue,
      minValue + range * 0.25,
      minValue + range * 0.5,
      minValue + range * 0.75,
      maxValue,
    ];
  };

  const getXAxisLabels = () => {
    if (data.length === 0) return [];
    const numLabels = 5;
    const step = Math.floor(data.length / (numLabels - 1)) || 1;
    const labels = [];
    
    for (let i = 0; i < numLabels && i * step < data.length; i++) {
      const index = Math.min(i * step, data.length - 1);
      const point = data[index];
      const date = new Date(point.timestamp);
      const timeStr = `${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
      const x = CHART_PADDING + (index / (data.length - 1)) * chartWidth;
      labels.push({ x, label: timeStr });
    }
    
    if (data.length > 1) {
      const lastPoint = data[data.length - 1];
      const date = new Date(lastPoint.timestamp);
      const timeStr = `${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
      labels.push({ x: CHART_PADDING + chartWidth, label: timeStr });
    }
    
    return labels;
  };

  const yLabels = getYAxisLabels();
  const xLabels = getXAxisLabels();
  const lastPoint = data.length > 0 ? data[data.length - 1] : null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
    >
      <View style={styles.header}>
        <View>
          <ThemedText type="h4">{title}</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            vs Time
          </ThemedText>
        </View>
        <View style={styles.currentValue}>
          <ThemedText style={[styles.valueText, { color }]}>
            {lastPoint ? lastPoint.value.toFixed(2) : "--"}
          </ThemedText>
          <ThemedText style={{ color: theme.textSecondary }}>{unit}</ThemedText>
        </View>
      </View>

      <Svg width={screenWidth} height={height}>
        <Line
          x1={CHART_PADDING}
          y1={CHART_PADDING_TOP + chartHeight}
          x2={screenWidth - CHART_PADDING_RIGHT}
          y2={CHART_PADDING_TOP + chartHeight}
          stroke={theme.border}
          strokeWidth="1"
        />
        <Line
          x1={CHART_PADDING}
          y1={CHART_PADDING_TOP}
          x2={CHART_PADDING}
          y2={CHART_PADDING_TOP + chartHeight}
          stroke={theme.border}
          strokeWidth="1"
        />

        {yLabels.map((label, index) => {
          const y = CHART_PADDING_TOP + chartHeight - (index / (yLabels.length - 1)) * chartHeight;
          return (
            <G key={`y-${index}`}>
              <Line
                x1={CHART_PADDING}
                y1={y}
                x2={screenWidth - CHART_PADDING_RIGHT}
                y2={y}
                stroke={theme.border}
                strokeWidth="0.5"
                strokeDasharray="4,4"
                opacity={0.3}
              />
              <SvgText
                x={CHART_PADDING - 5}
                y={y + 4}
                fill={theme.textSecondary}
                fontSize="9"
                textAnchor="end"
              >
                {label.toFixed(2)}
              </SvgText>
            </G>
          );
        })}

        {xLabels.slice(0, 3).map((item, index) => (
          <SvgText
            key={`x-${index}`}
            x={item.x}
            y={CHART_PADDING_TOP + chartHeight + 15}
            fill={theme.textSecondary}
            fontSize="9"
            textAnchor="middle"
          >
            {item.label}
          </SvgText>
        ))}

        {data.length >= 2 ? (
          <>
            <Path
              d={getPath()}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {lastPoint ? (
              <Circle
                cx={CHART_PADDING + chartWidth}
                cy={
                  CHART_PADDING_TOP +
                  chartHeight -
                  ((lastPoint.value - (Math.min(...data.map(d => d.value)) - 0.1)) /
                    ((Math.max(...data.map(d => d.value)) + 0.1) - (Math.min(...data.map(d => d.value)) - 0.1) || 1)) *
                    chartHeight
                }
                r="5"
                fill={color}
              />
            ) : null}
          </>
        ) : null}

        <SvgText
          x={screenWidth / 2}
          y={height - 5}
          fill={theme.textSecondary}
          fontSize="10"
          textAnchor="middle"
        >
          Time (mm:ss)
        </SvgText>
      </Svg>

      {data.length === 0 ? (
        <View style={styles.noDataOverlay}>
          <ThemedText style={{ color: theme.textSecondary }}>
            Waiting for data...
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  currentValue: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  valueText: {
    fontSize: 24,
    fontWeight: "700",
  },
  noDataOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
