import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/lib/auth";
import { api } from "../../src/lib/api";

export default function LoginScreen() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    const code = token.trim();
    if (!code) {
      Alert.alert("Erro", "Insira o código de acesso fornecido pela clínica.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/portal/auth/mobile-login", { token: code });
      const { jwt, owner } = res.data;
      await setSession(jwt, owner);
      router.replace("/(tabs)");
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Código inválido ou expirado.";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.background}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>

      <View style={styles.content}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Ionicons name="paw" size={40} color="#fff" />
          </View>
          <Text style={styles.brand}>VetConnect</Text>
          <Text style={styles.brandSub}>Portal do Tutor</Text>
        </View>

        {/* Login card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acesso Seguro</Text>
          <Text style={styles.cardDesc}>
            Insere o código que a clínica te forneceu para acederes à área reservada.
          </Text>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Código de acesso"
              placeholderTextColor="#475569"
              value={token}
              onChangeText={setToken}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "A entrar..." : "Entrar"}
            </Text>
            {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Não tens código? Pede à tua clínica veterinária.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  background: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  circle1: {
    position: "absolute", top: -80, right: -60,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: "rgba(59,130,246,0.15)",
  },
  circle2: {
    position: "absolute", bottom: -40, left: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(16,185,129,0.1)",
  },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  logoArea: { alignItems: "center", marginBottom: 40 },
  logoBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: "#3B82F6",
    justifyContent: "center", alignItems: "center",
    marginBottom: 16,
    shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  brand: { fontSize: 32, fontWeight: "900", color: "#F8FAFC", letterSpacing: -0.5 },
  brandSub: { fontSize: 13, fontWeight: "700", color: "#3B82F6", marginTop: 4, letterSpacing: 3, textTransform: "uppercase" },
  card: {
    width: "100%", maxWidth: 380, backgroundColor: "#1E293B",
    borderRadius: 24, padding: 28,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#F8FAFC", marginBottom: 6 },
  cardDesc: { fontSize: 13, color: "#94A3B8", lineHeight: 20, marginBottom: 24 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#334155", borderRadius: 14,
    borderWidth: 1, borderColor: "#475569",
    paddingHorizontal: 14, height: 52, marginBottom: 16,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 18, color: "#F8FAFC", letterSpacing: 4, fontWeight: "700" },
  button: {
    flexDirection: "row", height: 52, borderRadius: 14,
    backgroundColor: "#3B82F6", justifyContent: "center", alignItems: "center", gap: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  footerText: { fontSize: 12, color: "#475569", textAlign: "center", marginTop: 24 },
});
