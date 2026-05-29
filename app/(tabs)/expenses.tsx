import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, Kind, Transaction, formatDKK } from "@/src/lib/api";

type Filter = "all" | "income" | "expense";

export default function ExpensesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    try {
      const res = await api.listExpenses();
      setItems(res);
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

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((it) => it.kind === filter);
  }, [items, filter]);

  const handleDelete = (id: string) => {
    Alert.alert("Delete transaction?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteExpense(id);
            setItems((prev) => prev.filter((x) => x.id !== id));
          } catch (e) {
            console.warn(e);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.kind === "income";
    return (
      <View style={styles.row} testID={`expense-${item.id}`}>
        <View style={[styles.dot, { backgroundColor: item.category_color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.category_name}</Text>
          <Text style={styles.sub}>
            {item.date}
            {item.note ? `  ·  ${item.note}` : ""}
          </Text>
        </View>
        <Text style={[styles.amount, { color: isIncome ? "#34D399" : "#F87171" }]}>
          {isIncome ? "+" : "-"}
          {formatDKK(item.amount)}
        </Text>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={styles.deleteBtn}
          testID={`delete-expense-${item.id}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color="#71717A" />
        </TouchableOpacity>
      </View>
    );
  };

  const FilterPill = ({ value, label }: { value: Filter; label: string }) => {
    const active = filter === value;
    const color = value === "income" ? "#34D399" : value === "expense" ? "#F87171" : "#A3E635";
    return (
      <TouchableOpacity
        style={[
          styles.pill,
          active && { borderColor: color, backgroundColor: "rgba(255,255,255,0.04)" },
        ]}
        onPress={() => setFilter(value)}
        testID={`filter-${value}`}
      >
        <Text style={[styles.pillText, active && { color: "#F9F9F9", fontWeight: "600" }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>All Records</Text>
          <Text style={styles.title}>Transactions</Text>
        </View>
        <TouchableOpacity
          style={styles.addFab}
          onPress={() => router.push("/add-expense")}
          testID="expenses-add-btn"
        >
          <Ionicons name="add" size={22} color="#050505" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <FilterPill value="all" label="All" />
        <FilterPill value="income" label="Income" />
        <FilterPill value="expense" label="Expense" />
      </View>

      {loading ? (
        <ActivityIndicator color="#A3E635" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No transactions</Text>
          <Text style={styles.emptySub}>Tap + to add one.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
          testID="expense-list"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050505" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: { color: "#A3E635", fontSize: 11, letterSpacing: 2.4, fontWeight: "600", textTransform: "uppercase" },
  title: { color: "#F9F9F9", fontSize: 26, fontWeight: "600", marginTop: 4, letterSpacing: -0.6 },
  addFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#A3E635",
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingBottom: 14 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
  },
  pillText: { color: "#A1A1AA", fontSize: 12, letterSpacing: 0.4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomColor: "rgba(255,255,255,0.05)",
    borderBottomWidth: 1,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { color: "#F9F9F9", fontSize: 15, fontWeight: "500" },
  sub: { color: "#71717A", fontSize: 12, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "600" },
  deleteBtn: { padding: 6 },
  empty: { alignItems: "center", marginTop: 80, paddingHorizontal: 24 },
  emptyTitle: { color: "#F9F9F9", fontSize: 18, fontWeight: "600" },
  emptySub: { color: "#71717A", fontSize: 13, marginTop: 8, textAlign: "center" },
});
