import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/lib/api";
import type { Invoice } from "../../src/lib/types";

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await api.get("/api/portal/invoices");
          setInvoices(res.data.invoices || res.data || []);
        } catch {} finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case "PAID": return { label: "Pago", color: "#22C55E", bg: "#052E16" };
      case "PENDING": return { label: "Pendente", color: "#EAB308", bg: "#422006" };
      case "OVERDUE": return { label: "Vencido", color: "#EF4444", bg: "#450A0A" };
      default: return { label: status, color: "#94A3B8", bg: "#1E293B" };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Faturas</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>Nenhuma fatura encontrada</Text>
            </View>
          }
          renderItem={({ item }) => {
            const badge = statusBadge(item.paymentStatus);
            return (
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  <Text style={styles.invoiceNumber}>{item.number || `#${item.id.slice(0, 8)}`}</Text>
                  <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString("pt-PT")}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.amount}>{item.total?.toFixed(2)}€</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
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
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 12,
  },
  cardLeft: {},
  invoiceNumber: { fontSize: 14, fontWeight: "700", color: "#F8FAFC" },
  date: { fontSize: 12, color: "#64748B", marginTop: 2 },
  cardRight: { alignItems: "flex-end", gap: 6 },
  amount: { fontSize: 16, fontWeight: "800", color: "#22C55E" },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#64748B", fontSize: 14, textAlign: "center" },
});
