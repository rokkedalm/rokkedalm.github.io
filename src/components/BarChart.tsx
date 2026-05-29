import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Line } from "react-native-svg";

type Bar = { label: string; value: number };
type GroupedBar = { label: string; income: number; expense: number };

type Props = {
  data?: Bar[];
  groupedData?: GroupedBar[];
  height?: number;
  barColor?: string;
  incomeColor?: string;
  expenseColor?: string;
};

export default function BarChart({
  data,
  groupedData,
  height = 180,
  barColor = "#A3E635",
  incomeColor = "#34D399",
  expenseColor = "#F87171",
}: Props) {
  const width = 320;
  const paddingX = 16;
  const paddingTop = 16;
  const paddingBottom = 28;
  const innerW = width - paddingX * 2;
  const innerH = height - paddingTop - paddingBottom;

  if (groupedData && groupedData.length > 0) {
    const max = Math.max(1, ...groupedData.flatMap((d) => [d.income, d.expense]));
    const groupW = innerW / groupedData.length;
    const barW = Math.max(6, Math.min(14, (groupW - 10) / 2));
    return (
      <View style={styles.wrap} testID="bar-chart">
        <Svg width={width} height={height}>
          <Line
            x1={paddingX}
            y1={paddingTop + innerH}
            x2={width - paddingX}
            y2={paddingTop + innerH}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
          {groupedData.map((d, i) => {
            const groupX = paddingX + i * groupW + groupW / 2;
            const hI = (d.income / max) * innerH;
            const hE = (d.expense / max) * innerH;
            return (
              <React.Fragment key={i}>
                <Rect
                  x={groupX - barW - 2}
                  y={paddingTop + innerH - hI}
                  width={barW}
                  height={Math.max(2, hI)}
                  rx={4}
                  ry={4}
                  fill={d.income > 0 ? incomeColor : "#1F1F22"}
                />
                <Rect
                  x={groupX + 2}
                  y={paddingTop + innerH - hE}
                  width={barW}
                  height={Math.max(2, hE)}
                  rx={4}
                  ry={4}
                  fill={d.expense > 0 ? expenseColor : "#1F1F22"}
                />
              </React.Fragment>
            );
          })}
        </Svg>
        <View style={styles.labels}>
          {groupedData.map((d, i) => (
            <Text key={i} style={styles.label} numberOfLines={1}>
              {d.label}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  const items = data ?? [];
  const max = Math.max(1, ...items.map((d) => d.value));
  const barW = items.length > 0 ? Math.min(28, innerW / items.length - 8) : 16;
  const gap = items.length > 0 ? innerW / items.length : 0;

  return (
    <View style={styles.wrap} testID="bar-chart">
      <Svg width={width} height={height}>
        <Line
          x1={paddingX}
          y1={paddingTop + innerH}
          x2={width - paddingX}
          y2={paddingTop + innerH}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
        {items.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = paddingX + i * gap + (gap - barW) / 2;
          const y = paddingTop + innerH - h;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={Math.max(2, h)}
              rx={6}
              ry={6}
              fill={d.value > 0 ? barColor : "#1F1F22"}
            />
          );
        })}
      </Svg>
      <View style={styles.labels}>
        {items.map((d, i) => (
          <Text key={i} style={styles.label} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  labels: {
    flexDirection: "row",
    width: 320,
    paddingHorizontal: 16,
    marginTop: -22,
  },
  label: {
    flex: 1,
    textAlign: "center",
    color: "#A1A1AA",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
