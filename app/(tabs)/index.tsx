import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  api,
  CategorySummary,
  Transaction,
  Totals,
  formatDKK,
  formatSignedDKK,
} from "@/src/lib/api";

export default function Home() {
  const router = useRouter();
  const [totals, setTotals] = useState<Totals | null>(null);
  const [byCat, setByCat] = useState<CategorySummary[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const t = await api.summaryTotals();
      const [c, e] = await Promise.all([
        api.summaryByCategory({ month: t.current_month, kind: "expense" }),
        api.listExpenses(),
      ]);
      setTotals(t);
      setByCat(c);
      setRecent(e.slice(0, 5));
    } catch (err) {
      console.warn("Home load error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const monthLabel = totals
    ? new Date(totals.current_month + "-01").toLocaleString("en-US", { month: "long", year: "numeric" })
    : "";

  const net = totals?.month_net ?? 0;
  const netColor = net >= 0 ? "#A3E635" : "#F87171";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A3E635" />}
        testID="home-scroll"
      >
        <View style={styles.header}>
          <Text style={styles.brandSmall}>OBSIDIAN BUDGET</Text>
          <Text style={styles.greeting}>Cashflow Control</Text>
        </View>

        {/* Hero net cashflow card */}
        <View style={styles.heroCard} testID="hero-balance">
          <Text style={styles.eyebrow}>{monthLabel || "This Month"}  ·  Net Cashflow</Text>
          {loading ? (
            <ActivityIndicator color="#A3E635" style={{ marginVertical: 20 }} />
          ) : (
            <>
              <Text style={[styles.heroAmount, { color: netColor }]} testID="month-net">
                {formatSignedDKK(net)}
              </Text>
              <View style={styles.cashflowRow}>
                <View style={styles.cashCol} testID="month-income">
                  <View style={styles.dotRow}>
                    <View style={[styles.dot, { backgroundColor: "#34D399" }]} />
                    <Text style={styles.cashLabel}>Income</Text>
                  </View>
                  <Text style={styles.cashAmtIncome}>
                    {formatDKK(totals?.month_income ?? 0)}
                  </Text>
                </View>
                <View style={styles.cashCol} testID="month-expense">
                  <View style={styles.dotRow}>
                    <View style={[styles.dot, { backgroundColor: "#F87171" }]} />
                    <Text style={styles.cashLabel}>Expense</Text>
                  </View>
                  <Text style={styles.cashAmtExpense}>
                    {formatDKK(totals?.month_expense ?? 0)}
                  </Text>
                </View>
              </View>
              <View style={styles.heroMetaRow}>
                <View style={styles.metaPill}>
                  <Ionicons name="receipt-outline" size={12} color="#A3E635" />
                  <Text style={styles.metaPillText}>{totals?.month_count ?? 0} txns</Text>
                </View>
                <View style={styles.metaPill}>
                  <Ionicons name="trending-up-outline" size={12} color="#A1A1AA" />
                  <Text style={[styles.metaPillText, { color: "#A1A1AA" }]}>
                    Net all-time {formatSignedDKK(totals?.all_time_net ?? 0)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.expenseBtn}
            onPress={() => router.push("/add-expense?kind=expense")}
            testID="add-expense-btn"
            activeOpacity={0.85}
          >
            <Ionicons name="remove" size={18} color="#F87171" />
            <Text style={styles.expenseBtnText}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.incomeBtn}
            onPress={() => router.push("/add-expense?kind=income")}
            testID="add-income-btn"
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#050505" />
            <Text style={styles.incomeBtnText}>Income</Text>
          </TouchableOpacity>
        </View>

        {/* Category breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expenses by Category</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/charts")} testID="see-all-categories">
              <Text style={styles.linkText}>See all</Text>
            </TouchableOpacity>
          </View>
          {byCat.length === 0 ? (
            <Text style={styles.emptyText}>No expenses yet this month.</Text>
          ) : (
            byCat.slice(0, 4).map((c) => (
              <View key={c.category_id} style={styles.catRow} testID={`cat-row-${c.category_id}`}>
                <View style={[styles.colorDotSm, { backgroundColor: c.category_color }]} />
                <Text style={styles.catName}>{c.category_name}</Text>
                <Text style={styles.catTotal}>{formatDKK(c.total)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Recent transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/expenses")} testID="see-all-expenses">
              <Text style={styles.linkText}>See all</Text>
            </TouchableOpacity>
          </View>
          {recent.length === 0 ? (
            <Text style={styles.emptyText}>Tap Expense or Income to record your first transaction.</Text>
          ) : (
            recent.map((e) => {
              const isIncome = e.kind === "income";
              return (
                <View key={e.id} style={styles.expenseRow} testID={`recent-${e.id}`}>
                  <View style={[styles.colorDotSm, { backgroundColor: e.category_color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseName}>{e.category_name}</Text>
                    {e.note ? (
                      <Text style={styles.expenseNote} numberOfLines={1}>
                        {e.note}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.expenseAmount, { color: isIncome ? "#34D399" : "#F87171" }]}>
                    {isIncome ? "+" : "-"}
                    {formatDKK(e.amount)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050505" },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  header: { marginTop: 12, marginBottom: 22 },
  brandSmall: {
    color: "#A3E635",
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  greeting: { color: "#F9F9F9", fontSize: 26, fontWeight: "600", marginTop: 4, letterSpacing: -0.6 },
  heroCard: {
    backgroundColor: "#0A0A0A",
    borderColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },
  eyebrow: { color: "#A1A1AA", fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase" },
  heroAmount: { fontSize: 38, fontWeight: "600", letterSpacing: -1.2, marginTop: 10 },
  cashflowRow: { flexDirection: "row", gap: 16, marginTop: 18 },
  cashCol: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
  },
  dotRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cashLabel: { color: "#A1A1AA", fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase" },
  cashAmtIncome: { color: "#34D399", fontSize: 17, fontWeight: "600", marginTop: 6, letterSpacing: -0.3 },
  cashAmtExpense: { color: "#F87171", fontSize: 17, fontWeight: "600", marginTop: 6, letterSpacing: -0.3 },
  heroMetaRow: { flexDirection: "row", gap: 8, marginTop: 16, flexWrap: "wrap" },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaPillText: { color: "#A3E635", fontSize: 11, fontWeight: "500" },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  expenseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 14,
    borderColor: "rgba(248,113,113,0.4)",
    borderWidth: 1,
    backgroundColor: "rgba(248,113,113,0.08)",
  },
  expenseBtnText: { color: "#F87171", fontWeight: "600", fontSize: 14, letterSpacing: 0.3 },
  incomeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#A3E635",
    borderRadius: 999,
    paddingVertical: 14,
  },
  incomeBtnText: { color: "#050505", fontWeight: "700", fontSize: 14, letterSpacing: 0.3 },
  section: { marginBottom: 22 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { color: "#F9F9F9", fontSize: 17, fontWeight: "600", letterSpacing: -0.3 },
  linkText: { color: "#A3E635", fontSize: 12, fontWeight: "500" },
  emptyText: { color: "#71717A", fontSize: 13, paddingVertical: 12 },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomColor: "rgba(255,255,255,0.04)",
    borderBottomWidth: 1,
  },
  colorDotSm: { width: 10, height: 10, borderRadius: 5 },
  catName: { color: "#F9F9F9", flex: 1, fontSize: 14 },
  catTotal: { color: "#A1A1AA", fontSize: 14, fontWeight: "500" },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomColor: "rgba(255,255,255,0.04)",
    borderBottomWidth: 1,
  },
  expenseName: { color: "#F9F9F9", fontSize: 14, fontWeight: "500" },
  expenseNote: { color: "#71717A", fontSize: 12, marginTop: 2 },
  expenseAmount: { fontSize: 14, fontWeight: "600" },
});
