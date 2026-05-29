import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, Category, Kind } from "@/src/lib/api";

const PALETTE = [
  "#A3E635",
  "#60A5FA",
  "#F472B6",
  "#FBBF24",
  "#C084FC",
  "#F87171",
  "#34D399",
  "#FB923C",
  "#A1A1AA",
];

export default function CategoriesScreen() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<Kind>("expense");
  const [pickedColor, setPickedColor] = useState(PALETTE[0]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.listCategories();
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

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const created = await api.createCategory({ name, color: pickedColor, kind: newKind });
      setItems((prev) => [...prev, created]);
      setNewName("");
      setPickedColor(PALETTE[0]);
    } catch (e) {
      Alert.alert("Error", "Could not create category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (cat: Category) => {
    Alert.alert(`Delete "${cat.name}"?`, "Categories used by transactions cannot be deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteCategory(cat.id);
            setItems((prev) => prev.filter((x) => x.id !== cat.id));
          } catch (e: any) {
            Alert.alert("Cannot delete", e?.message?.includes("in use") ? "Category is in use." : "Try again.");
          }
        },
      },
    ]);
  };

  const expenseCats = items.filter((c) => c.kind === "expense");
  const incomeCats = items.filter((c) => c.kind === "income");

  const renderCategory = (c: Category) => (
    <View key={c.id} style={styles.row} testID={`category-${c.id}`}>
      <View style={[styles.dot, { backgroundColor: c.color }]} />
      <Text style={styles.name}>{c.name}</Text>
      <TouchableOpacity
        onPress={() => handleDelete(c)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        testID={`delete-category-${c.id}`}
      >
        <Ionicons name="trash-outline" size={16} color="#71717A" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} testID="categories-scroll" keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Organize</Text>
          <Text style={styles.title}>Categories</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>New Category</Text>

          {/* Kind toggle */}
          <View style={styles.toggleWrap}>
            <TouchableOpacity
              style={[styles.toggleBtn, newKind === "expense" && styles.toggleBtnExpense]}
              onPress={() => setNewKind("expense")}
              testID="new-kind-expense"
            >
              <Text style={[styles.toggleText, newKind === "expense" && { color: "#F87171", fontWeight: "700" }]}>
                EXPENSE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, newKind === "income" && styles.toggleBtnIncome]}
              onPress={() => setNewKind("income")}
              testID="new-kind-income"
            >
              <Text style={[styles.toggleText, newKind === "income" && { color: "#34D399", fontWeight: "700" }]}>
                INCOME
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder={newKind === "income" ? "e.g. Bonus" : "e.g. Coffee"}
            placeholderTextColor="#52525B"
            style={styles.input}
            testID="new-category-input"
          />
          <Text style={styles.label}>Color</Text>
          <View style={styles.paletteRow}>
            {PALETTE.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setPickedColor(color)}
                style={[
                  styles.colorChip,
                  { backgroundColor: color },
                  pickedColor === color && styles.colorChipActive,
                ]}
                testID={`color-${color}`}
              />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.addBtn, (!newName.trim() || saving) && { opacity: 0.5 }]}
            disabled={!newName.trim() || saving}
            onPress={handleAdd}
            testID="add-category-btn"
          >
            {saving ? (
              <ActivityIndicator color="#050505" />
            ) : (
              <>
                <Ionicons name="add" size={18} color="#050505" />
                <Text style={styles.addBtnText}>Add Category</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#A3E635" style={{ marginTop: 20 }} />
        ) : (
          <>
            <View style={styles.sectionHead}>
              <View style={[styles.dot, { backgroundColor: "#F87171" }]} />
              <Text style={styles.sectionTitle}>Expense Categories</Text>
              <Text style={styles.sectionCount}>{expenseCats.length}</Text>
            </View>
            {expenseCats.map(renderCategory)}

            <View style={[styles.sectionHead, { marginTop: 18 }]}>
              <View style={[styles.dot, { backgroundColor: "#34D399" }]} />
              <Text style={styles.sectionTitle}>Income Categories</Text>
              <Text style={styles.sectionCount}>{incomeCats.length}</Text>
            </View>
            {incomeCats.map(renderCategory)}
          </>
        )}

        <View style={{ height: 80 }} />
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
    marginBottom: 22,
  },
  cardTitle: { color: "#F9F9F9", fontSize: 15, fontWeight: "600", marginBottom: 12 },
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 999,
    padding: 4,
    marginBottom: 14,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: "center" },
  toggleBtnExpense: { backgroundColor: "rgba(248,113,113,0.12)", borderColor: "rgba(248,113,113,0.35)", borderWidth: 1 },
  toggleBtnIncome: { backgroundColor: "rgba(52,211,153,0.12)", borderColor: "rgba(52,211,153,0.35)", borderWidth: 1 },
  toggleText: { color: "#A1A1AA", fontSize: 11, letterSpacing: 1.6 },
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
  label: {
    color: "#A1A1AA",
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 10,
  },
  paletteRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorChip: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: "transparent" },
  colorChipActive: { borderColor: "#F9F9F9" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#A3E635",
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 18,
  },
  addBtnText: { color: "#050505", fontWeight: "700", fontSize: 14 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#F9F9F9",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    flex: 1,
  },
  sectionCount: { color: "#71717A", fontSize: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomColor: "rgba(255,255,255,0.04)",
    borderBottomWidth: 1,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { color: "#F9F9F9", flex: 1, fontSize: 15 },
});
