import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { StyleSheet, View, Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#A3E635",
        tabBarInactiveTintColor: "#71717A",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 1,
          textTransform: "uppercase",
          fontWeight: "500",
        },
        tabBarStyle: {
          position: "absolute",
          borderTopColor: "rgba(255,255,255,0.08)",
          borderTopWidth: 1,
          backgroundColor: Platform.OS === "ios" ? "transparent" : "rgba(5,5,5,0.95)",
          elevation: 0,
          height: 78,
          paddingTop: 8,
          paddingBottom: 18,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(5,5,5,0.95)" }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
          tabBarButtonTestID: "tab-home",
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" color={color} size={size} />
          ),
          tabBarButtonTestID: "tab-expenses",
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: "Charts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart-outline" color={color} size={size} />
          ),
          tabBarButtonTestID: "tab-charts",
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
          tabBarButtonTestID: "tab-categories",
        }}
      />
    </Tabs>
  );
}
