import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/lib/api";
import type { Message } from "../../src/lib/types";

export default function MessagesScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await api.get("/api/portal/messages");
          setMessages(res.data.messages || res.data || []);
        } catch {} finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mensagens</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubble-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>Nenhuma mensagem</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, !item.read && styles.unread]}>
              <View style={styles.cardHeader}>
                <Text style={styles.sender}>
                  {item.sender === "clinic" ? "Clínica" : "Tu"}
                </Text>
                <Text style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString("pt-PT")}
                </Text>
              </View>
              <Text style={styles.subject}>{item.subject}</Text>
              <Text style={styles.body} numberOfLines={3}>{item.body}</Text>
            </View>
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
  card: { backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 12 },
  unread: { borderLeftWidth: 3, borderLeftColor: "#3B82F6" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  sender: { fontSize: 12, fontWeight: "700", color: "#3B82F6", textTransform: "uppercase" },
  date: { fontSize: 11, color: "#64748B" },
  subject: { fontSize: 14, fontWeight: "700", color: "#F8FAFC" },
  body: { fontSize: 13, color: "#94A3B8", marginTop: 4, lineHeight: 18 },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#64748B", fontSize: 14, textAlign: "center" },
});
