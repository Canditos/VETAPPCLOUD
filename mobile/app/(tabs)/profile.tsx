import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/lib/auth";

export default function ProfileScreen() {
  const { owner, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Terminar Sessão", "Tens a certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => {
        await logout();
        router.replace("/(auth)/login");
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Perfil</Text>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color="#fff" />
        </View>
        <Text style={styles.name}>{owner?.name || "—"}</Text>
        <Text style={styles.email}>{owner?.email || "—"}</Text>
        <Text style={styles.phone}>{owner?.phone || "—"}</Text>
      </View>

      <View style={styles.menu}>
        {[
          { icon: "settings-outline" as const, label: "Preferências", onPress: () => {} },
          { icon: "information-circle-outline" as const, label: "Sobre", onPress: () => {} },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress}>
            <Ionicons name={item.icon} size={22} color="#94A3B8" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#475569" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Terminar Sessão</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", paddingTop: 60 },
  header: { fontSize: 28, fontWeight: "800", color: "#F8FAFC", paddingHorizontal: 20, marginBottom: 16 },
  card: { alignItems: "center", backgroundColor: "#1E293B", marginHorizontal: 20, borderRadius: 20, padding: 24, marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#3B82F6", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  name: { fontSize: 20, fontWeight: "700", color: "#F8FAFC" },
  email: { fontSize: 13, color: "#94A3B8", marginTop: 4 },
  phone: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  menu: { marginHorizontal: 20, backgroundColor: "#1E293B", borderRadius: 16, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: "#334155" },
  menuLabel: { flex: 1, fontSize: 14, color: "#F8FAFC" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, marginTop: 24, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "#7F1D1D" },
  logoutText: { color: "#EF4444", fontSize: 14, fontWeight: "700" },
});
