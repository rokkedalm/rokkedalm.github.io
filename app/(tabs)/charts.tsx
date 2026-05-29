import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import PieChart from "@/src/components/PieChart";
import BarChart from "@/src/components/BarChart";
import {
  api,
  CategorySummary,
  MonthlyPoint,
  formatDKK,
  formatMonthLabel,
  formatSignedDKK,
  currentMonth,
} from "@/src/lib/api";

export default function ChartsScreen() {
  const [byCat, setByCat] = useState<CategorySummary[]>([]);
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [c, m] = await Promise.all([
        api.summaryByCategory({ month: currentMonth(), kind: "expense" }),
        api.summaryMonthly(6),
      ]);
      setByCat(c);
      setMonthly(m);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const total = byCat.reduce((s, c) => s + c.total, 0);
  const pieData = byCat.map((c) => ({
    value: c.total,
    color: c.category_color,
    label: c.category_name,
  }));

  const groupedBarData = monthly.map((m) => ({
    label: formatMonthLabel(m.month),
    income: m.income,
    expense: m.expense,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} testID="charts-scroll">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Analytics</Text>
          <Text style={styles.title}>Charts</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#A3E635" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Pie chart */}
            <View style={styles.card} testID="pie-section">
              <Text style={styles.cardTitle}>Expenses by Category — This Month</Text>
              <View style={styles.pieWrap}>
                <PieChart
                  data={pieData}
                  size={220}
                  thickness={26}
                  centerLabel={formatDKK(total)}
                  centerSubLabel="Total"
                />
              </View>
              <View style={styles.legend}>
                {byCat.length === 0 ? (
                  <Text style={styles.emptyText}>No expenses this month.</Text>
                ) : (
                  byCat.map((c) => {
                    const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
                    return (
                      <View key={c.category_id} style={styles.legendRow}>
                        <View style={[styles.dot, { backgroundColor: c.category_color }]} />
                        <Text style={styles.legendName}>{c.category_name}</Text>
                        <Text style={styles.legendPct}>{pct}%</Text>
                        <Text style={styles.legendAmt}>{formatDKK(c.total)}</Text>
                      </View>
                    );
                  })
                )}
              </View>
            </View>

            {/* Cashflow grouped bar */}
            <View style={styles.card} testID="bar-section">
              <Text style={styles.cardTitle}>Income vs Expense — Last 6 Months</Text>
              <View style={styles.legendChips}>
                <View style={styles.chip}>
                  <View style={[styles.dot, { backgroundColor: "#34D399" }]} />
                  <Text style={styles.chipText}>Income</Text>
                </View>
                <View style={styles.chip}>
                  <View style={[styles.dot, { backgroundColor: "#F87171" }]} />
                  <Text style={styles.chipText}>Expense</Text>
                </View>
              </View>
              <View style={styles.barWrap}>
                <BarChart groupedData={groupedBarData} height={200} />
              </View>
              <View style={styles.trendList}>
                {monthly.map((m) => (
                  <View key={m.month} style={styles.trendRow}>
                    <Text style={styles.trendMonth}>{formatMonthLabel(m.month)}</Text>
                    <Text style={styles.incomeAmt}>+{formatDKK(m.income)}</Text>
                    <Text style={styles.expenseAmt}>-{formatDKK(m.expense)}</Text>
                    <Text style={[styles.netAmt, { color: m.net >= 0 ? "#A3E635" : "#F87171" }]}>
                      {formatSignedDKK(m.net)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050505" },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  header: { marginTop: 12, marginBottom: 22 },
  eyebrow: { color: "#A3E635", fontSize: 11, letterSpacing: 2.4, fontWeight: "600", textTransform: "uppercase" },
  title: { color: "#F9F9F9", fontSize: 26, fontWeight: "600", marginTop: 4, letterSpacing: -0.6 },
  card: {
    backgroundColor: "#0A0A0A",
    borderColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },
  cardTitle: { color: "#F9F9F9", fontSize: 15, fontWeight: "600", marginBottom: 14, letterSpacing: -0.2 },
  pieWrap: { alignItems: "center", paddingVertical: 12 },
  legend: { marginTop: 14 },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomColor: "rgba(255,255,255,0.04)",
    borderBottomWidth: 1,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { color: "#F9F9F9", flex: 1, fontSize: 13 },
  legendPct: { color: "#71717A", fontSize: 12, width: 40, textAlign: "right" },
  legendAmt: { color: "#A1A1AA", fontSize: 12, width: 100, textAlign: "right", fontWeight: "500" },
  legendChips: { flexDirection: "row", gap: 12, marginBottom: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6 },
  chipText: { color: "#A1A1AA", fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase" },
  barWrap: { alignItems: "center", marginVertical: 8 },
  trendList: { marginTop: 14 },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomColor: "rgba(255,255,255,0.04)",
    borderBottomWidth: 1,
    gap: 6,
  },
  trendMonth: { color: "#F9F9F9", fontSize: 12, width: 38 },
  incomeAmt: { color: "#34D399", fontSize: 11, flex: 1, textAlign: "right", fontWeight: "500" },
  expenseAmt: { color: "#F87171", fontSize: 11, flex: 1, textAlign: "right", fontWeight: "500" },
  netAmt: { fontSize: 12, flex: 1, textAlign: "right", fontWeight: "600" },
  emptyText: { color: "#71717A", fontSize: 13, padding: 12, textAlign: "center" },
});
