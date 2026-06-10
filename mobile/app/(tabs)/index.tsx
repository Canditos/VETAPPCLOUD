import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth";

export default function HomeScreen() {
  const { owner } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await api.get("/api/portal/me");
          setData(res.data);
        } catch {} finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 19) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => setLoading(true)} tintColor="#3B82F6" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}!</Text>
          <Text style={styles.subtitle}>{owner?.name || "Tutor"}</Text>
        </View>
        <View style={styles.logo}>
          <Ionicons name="paw" size={28} color="#fff" />
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#1E293B" }]}
          onPress={() => router.push("/(tabs)/appointments" as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#3B82F6" }]}>
            <Ionicons name="calendar" size={22} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Consultas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#1E293B" }]}
          onPress={() => router.push("/(tabs)/patients" as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#10B981" }]}>
            <Ionicons name="paw" size={22} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Pacientes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#1E293B" }]}
          onPress={() => router.push("/(tabs)/invoices" as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#8B5CF6" }]}>
            <Ionicons name="receipt" size={22} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Faturas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#1E293B" }]}
          onPress={() => router.push("/(tabs)/messages" as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#F59E0B" }]}>
            <Ionicons name="chatbubble" size={22} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Mensagens</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#1E293B" }]}>
          <Ionicons name="calendar" size={20} color="#3B82F6" />
          <Text style={styles.statValue}>{data?.patients?.length || 0}</Text>
          <Text style={styles.statLabel}>Pacientes</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#1E293B" }]}>
          <Ionicons name="alert-circle" size={20} color="#F59E0B" />
          <Text style={styles.statValue}>{data?.vaccineAlerts?.length || 0}</Text>
          <Text style={styles.statLabel}>Alertas</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#1E293B" }]}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.statValue}>{data?.clinic?.name?.[0] || "—"}</Text>
          <Text style={styles.statLabel}>Clínica</Text>
        </View>
      </View>

      {/* Next appointment */}
      <View style={[styles.card, { backgroundColor: "#1E293B" }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
          <Text style={styles.cardTitle}>Próxima Consulta</Text>
        </View>
        <Text style={styles.emptyText}>Sem consultas agendadas</Text>
      </View>

      {/* Patients summary */}
      <View style={[styles.card, { backgroundColor: "#1E293B" }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="paw-outline" size={18} color="#10B981" />
          <Text style={styles.cardTitle}>Os Teus Animais</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/patients" as any)}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {data?.patients?.length > 0 ? (
          data.patients.slice(0, 3).map((p: any, i: number) => (
            <TouchableOpacity key={p.id} style={styles.patientRow} onPress={() => router.push({ pathname: "/(tabs)/patients/[id]" as any, params: { id: p.id } })}>
              <View style={[styles.patientAvatar, { backgroundColor: ["#3B82F6", "#10B981", "#8B5CF6"][i % 3] }]}>
                <Text style={styles.avatarText}>{p.name[0]}</Text>
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{p.name}</Text>
                <Text style={styles.patientMeta}>{p.species} · {p.breed || "—"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#475569" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhum animal registado</Text>
        )}
      </View>

      {/* Bottom padding */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  content: { paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greeting: { fontSize: 28, fontWeight: "800", color: "#F8FAFC" },
  subtitle: { fontSize: 14, color: "#94A3B8", marginTop: 2 },
  logo: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#3B82F6", justifyContent: "center", alignItems: "center" },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 16, alignItems: "center", gap: 8 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  actionLabel: { fontSize: 11, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: "center", gap: 4 },
  statValue: { fontSize: 22, fontWeight: "800", color: "#F8FAFC" },
  statLabel: { fontSize: 10, fontWeight: "600", color: "#64748B", textTransform: "uppercase" },
  card: { borderRadius: 20, padding: 18, marginBottom: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#F8FAFC", flex: 1 },
  seeAll: { fontSize: 12, fontWeight: "700", color: "#3B82F6" },
  patientRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#334155" },
  patientAvatar: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 14, fontWeight: "700", color: "#F8FAFC" },
  patientMeta: { fontSize: 11, color: "#64748B", marginTop: 1 },
  emptyText: { fontSize: 13, color: "#64748B", textAlign: "center", paddingVertical: 20 },
});
