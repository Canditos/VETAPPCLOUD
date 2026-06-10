import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useRouter } from "expo-router";
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
      const msg = e?.response?.data?.error || "Token inválido ou expirado.";
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
      <View style={styles.card}>
        <Text style={styles.logo}>🐾</Text>
        <Text style={styles.title}>VetConnect</Text>
        <Text style={styles.subtitle}>Portal do Tutor</Text>
        <Text style={styles.hint}>
          Insira o código de acesso que a clínica lhe forneceu.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Código de acesso"
          placeholderTextColor="#64748B"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "A entrar..." : "Entrar"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
  },
  logo: { fontSize: 64, marginBottom: 12 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
    marginBottom: 24,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  hint: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    width: "100%",
    height: 52,
    backgroundColor: "#334155",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#475569",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#F8FAFC",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 2,
  },
  button: {
    width: "100%",
    height: 52,
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
