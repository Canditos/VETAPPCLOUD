import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/lib/api";
import type { Appointment } from "../../src/lib/types";

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");

  const fetch = useCallback(async () => {
    try {
      const res = await api.get("/api/portal/appointments", { params: { status: filter === "upcoming" ? "scheduled" : "completed,cancelled" } });
      setAppointments(res.data.appointments || res.data || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  const onRefresh = () => { setRefreshing(true); fetch(); };

  const statusColor: Record<string, string> = {
    scheduled: "#3B82F6",
    completed: "#22C55E",
    cancelled: "#EF4444",
    confirmed: "#3B82F6",
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Consultas</Text>
      <View style={styles.filterRow}>
        {(["upcoming", "past"] as const).map((f) => (
          <TouchableOpacity key={f} onPress={() => { setFilter(f); setLoading(true); }}
            style={[styles.filterBtn, filter === f && styles.filterActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "upcoming" ? "Próximas" : "Passadas"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>Nenhuma consulta {filter === "upcoming" ? "agendada" : "passada"}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const date = new Date(item.startTime);
            return (
              <View style={styles.card}>
                <View style={[styles.dot, { backgroundColor: statusColor[item.status] || "#94A3B8" }]} />
                <View style={styles.cardBody}>
                  <Text style={styles.patientName}>{item.patient?.name || "Animal"}</Text>
                  <Text style={styles.meta}>{item.type || "Consulta"} · {item.veterinarian?.name || "—"}</Text>
                  <Text style={styles.date}>
                    {date.toLocaleDateString("pt-PT", { day: "2-digit", month: "long" })} às {date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", paddingTop: 60 },
  header: { fontSize: 28, fontWeight: "800", color: "#F8FAFC", paddingHorizontal: 20, marginBottom: 16 },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#1E293B" },
  filterActive: { backgroundColor: "#3B82F6" },
  filterText: { color: "#64748B", fontWeight: "600", fontSize: 13 },
  filterTextActive: { color: "#fff" },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { flexDirection: "row", backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 12, alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 14 },
  cardBody: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: "700", color: "#F8FAFC" },
  meta: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  date: { fontSize: 12, color: "#64748B", marginTop: 4 },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#64748B", fontSize: 14, textAlign: "center" },
});
