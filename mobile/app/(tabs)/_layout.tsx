import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";

const tabs = [
  { name: "index", title: "Início", icon: "home" as const },
  { name: "appointments", title: "Consultas", icon: "calendar" as const },
  { name: "patients", title: "Pacientes", icon: "paw" as const },
  { name: "invoices", title: "Faturas", icon: "receipt" as const },
  { name: "messages", title: "Mensagens", icon: "chatbubble" as const },
  { name: "profile", title: "Perfil", icon: "person" as const },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#475569",
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon as any} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0F172A",
    borderTopColor: "#1E293B",
    borderTopWidth: 1,
    height: 65,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tabItem: {
    paddingVertical: 2,
  },
});
