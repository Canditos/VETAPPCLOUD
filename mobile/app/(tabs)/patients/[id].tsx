import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../src/lib/api";
import type { Patient } from "../../../src/lib/types";

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await api.get(`/api/portal/patients/${id}`);
          setPatient(res.data.patient || res.data);
        } catch {} finally {
          setLoading(false);
        }
      })();
    }, [id])
  );

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 80 }} /></View>;
  if (!patient) return <View style={styles.container}><Text style={{ color: "#EF4444", textAlign: "center", marginTop: 80 }}>Paciente não encontrado</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{patient.name[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{patient.name}</Text>
      </View>
      <View style={styles.grid}>
        {[
          { label: "Espécie", value: patient.species, icon: "paw" },
          { label: "Raça", value: patient.breed || "—", icon: "git-branch" },
          { label: "Peso", value: patient.weight ? `${patient.weight}kg` : "—", icon: "scale" },
          { label: "Data de Nascimento", value: patient.birthDate ? new Date(patient.birthDate).toLocaleDateString("pt-PT") : "—", icon: "cake" },
          { label: "Cor", value: patient.color || "—", icon: "color-palette" },
        ].map((f, i) => (
          <View key={i} style={styles.field}>
            <Ionicons name={f.icon as any} size={18} color="#64748B" />
            <Text style={styles.fieldLabel}>{f.label}</Text>
            <Text style={styles.fieldValue}>{f.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  header: { alignItems: "center", paddingTop: 60, paddingBottom: 24, backgroundColor: "#1E293B" },
  avatar: { width: 72, height: 72, borderRadius: 24, backgroundColor: "#3B82F6", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: "800", color: "#fff" },
  name: { fontSize: 24, fontWeight: "800", color: "#F8FAFC" },
  grid: { padding: 20, gap: 12 },
  field: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B",
    borderRadius: 14, padding: 14, gap: 10,
  },
  fieldLabel: { fontSize: 13, color: "#94A3B8", flex: 1 },
  fieldValue: { fontSize: 14, fontWeight: "700", color: "#F8FAFC", textAlign: "right" },
});
