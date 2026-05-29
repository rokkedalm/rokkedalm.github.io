import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, G } from "react-native-svg";

type Slice = { value: number; color: string; label: string };

type Props = {
  data: Slice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSubLabel?: string;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export default function PieChart({ data, size = 220, thickness = 28, centerLabel, centerSubLabel }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;

  if (total <= 0) {
    return (
      <View style={[styles.wrap, { width: size, height: size }]} testID="pie-chart-empty">
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r} stroke="#1F1F22" strokeWidth={thickness} fill="none" />
        </Svg>
        <View style={styles.centerOverlay} pointerEvents="none">
          <Text style={styles.centerLabel}>No data</Text>
        </View>
      </View>
    );
  }

  let angle = 0;
  const arcs = data.map((d, i) => {
    const sweep = (d.value / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    // For full single slice (only one category), draw full circle to avoid degenerate arc
    if (sweep >= 359.999) {
      return (
        <Circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          stroke={d.color}
          strokeWidth={thickness}
          fill="none"
        />
      );
    }
    return (
      <Path
        key={i}
        d={arcPath(cx, cy, r, start, end)}
        stroke={d.color}
        strokeWidth={thickness}
        fill="none"
        strokeLinecap="butt"
      />
    );
  });

  return (
    <View style={[styles.wrap, { width: size, height: size }]} testID="pie-chart">
      <Svg width={size} height={size}>
        <G>{arcs}</G>
      </Svg>
      <View style={styles.centerOverlay} pointerEvents="none">
        {centerLabel ? <Text style={styles.centerLabel} testID="pie-center-label">{centerLabel}</Text> : null}
        {centerSubLabel ? <Text style={styles.centerSub}>{centerSubLabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  centerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: { color: "#F9F9F9", fontSize: 22, fontWeight: "600", letterSpacing: -0.5 },
  centerSub: { color: "#A1A1AA", fontSize: 11, marginTop: 4, letterSpacing: 1.4, textTransform: "uppercase" },
});
