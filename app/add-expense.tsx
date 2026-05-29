import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, Category, Kind, todayISO } from "@/src/lib/api";

export default function AddExpense() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  const initialKind: Kind = params.kind === "income" ? "income" : "expense";

  const [kind, setKind] = useState<Kind>(initialKind);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (k: Kind) => {
    setLoading(true);
    try {
      const cats = await api.listCategories(k);
      setCategories(cats);
      setCategoryId(cats.length > 0 ? cats[0].id : null);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(kind);
  }, [kind, load]);

  const validAmount = () => {
    const v = parseFloat(amount.replace(",", "."));
    return !isNaN(v) && v > 0;
  };

  const handleSave = async () => {
    if (!validAmount()) {
      Alert.alert("Invalid amount", "Please enter an amount greater than 0.");
      return;
    }
    if (!categoryId) {
      Alert.alert("Pick a category");
      return;
    }
    setSaving(true);
    try {
      await api.createExpense({
        amount: parseFloat(amount.replace(",", ".")),
        category_id: categoryId,
        kind,
        note,
        date,
      });
      router.back();
    } catch (e) {
      Alert.alert("Error", "Could not save transaction.");
    } finally {
      setSaving(false);
    }
  };

  const isIncome = kind === "income";
  const accent = isIncome ? "#34D399" : "#F87171";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="close-add-expense">
          <Ionicons name="close" size={26} color="#F9F9F9" />
        </TouchableOpacity>
        <Text style={styles.title}>New Transaction</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Kind toggle */}
        <View style={styles.toggleWrap} testID="kind-toggle">
          <TouchableOpacity
            style={[styles.toggleBtn, !isIncome && styles.toggleBtnExpense]}
            onPress={() => setKind("expense")}
            testID="kind-expense"
          >
            <Text style={[styles.toggleText, !isIncome && { color: "#F87171", fontWeight: "700" }]}>
              EXPENSE
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, isIncome && styles.toggleBtnIncome]}
            onPress={() => setKind("income")}
            testID="kind-income"
          >
            <Text style={[styles.toggleText, isIncome && { color: "#34D399", fontWeight: "700" }]}>
              INCOME
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={styles.amountWrap}>
          <Text style={[styles.currencyMark, { color: accent }]}>
            {isIncome ? "+kr." : "−kr."}
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#3F3F46"
            style={styles.amountInput}
            testID="amount-input"
            autoFocus
          />
        </View>

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        {loading ? (
          <ActivityIndicator color={accent} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.catGrid}>
            {categories.map((c) => {
              const active = c.id === categoryId;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setCategoryId(c.id)}
                  style={[
                    styles.catChip,
                    active && { borderColor: c.color, backgroundColor: "rgba(255,255,255,0.04)" },
                  ]}
                  testID={`select-category-${c.id}`}
                >
                  <View style={[styles.catDot, { backgroundColor: c.color }]} />
                  <Text style={[styles.catChipText, active && { color: "#F9F9F9" }]}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Note */}
        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What was it for?"
          placeholderTextColor="#52525B"
          style={styles.input}
          testID="note-input"
        />

        {/* Date */}
        <Text style={styles.label}>Date</Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#52525B"
          style={styles.input}
          testID="date-input"
        />

        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: accent },
            (!validAmount() || !categoryId || saving) && { opacity: 0.5 },
          ]}
          disabled={!validAmount() || !categoryId || saving}
          onPress={handleSave}
          testID="save-expense-btn"
        >
          {saving ? (
            <ActivityIndicator color="#050505" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#050505" />
              <Text style={styles.saveText}>
                Save {isIncome ? "Income" : "Expense"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050505" },
  header: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: "#F9F9F9", fontSize: 17, fontWeight: "600" },
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 999,
    padding: 4,
    marginTop: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  toggleBtnExpense: { backgroundColor: "rgba(248,113,113,0.12)", borderColor: "rgba(248,113,113,0.35)", borderWidth: 1 },
  toggleBtnIncome: { backgroundColor: "rgba(52,211,153,0.12)", borderColor: "rgba(52,211,153,0.35)", borderWidth: 1 },
  toggleText: { color: "#A1A1AA", fontSize: 12, letterSpacing: 1.8 },
  amountWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  currencyMark: { fontSize: 18, fontWeight: "600", paddingBottom: 12 },
  amountInput: {
    color: "#F9F9F9",
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: -1.5,
    minWidth: 120,
    textAlign: "center",
    paddingVertical: 0,
  },
  label: {
    color: "#A1A1AA",
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginTop: 18,
    marginBottom: 10,
  },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catChipText: { color: "#A1A1AA", fontSize: 13, fontWeight: "500" },
  input: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    color: "#F9F9F9",
    fontSize: 15,
  },
  saveBtn: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 16,
  },
  saveText: { color: "#050505", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 },
});
