import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/lib/api";
import type { Patient } from "../../src/lib/types";

export default function PatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await api.get("/api/portal/patients");
          setPatients(res.data.patients || res.data || []);
        } catch {} finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pacientes</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="paw-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>Nenhum paciente registado</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: "/(tabs)/patients/[id]", params: { id: item.id } as any })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.species} · {item.breed || "—"}
                  {item.weight ? ` · ${item.weight}kg` : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", paddingTop: 60 },
  header: { fontSize: 28, fontWeight: "800", color: "#F8FAFC", paddingHorizontal: 20, marginBottom: 16 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B",
    borderRadius: 16, padding: 14, marginBottom: 10,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: "#3B82F6",
    justifyContent: "center", alignItems: "center", marginRight: 14,
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  cardBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: "#F8FAFC" },
  meta: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#64748B", fontSize: 14, textAlign: "center" },
});
