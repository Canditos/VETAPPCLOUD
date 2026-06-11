import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/lib/auth";
import { api } from "../../src/lib/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setSession } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    const e = email.trim();
    const p = password.trim();
    if (!e || !p) {
      Alert.alert("Erro", "Preenche o email e a palavra-passe.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/portal/auth/login", { email: e, password: p });
      const { jwt, owner } = res.data;
      if (!jwt || !owner) throw new Error("Resposta inválida");
      await setSession(jwt, owner);
      router.replace("/(tabs)");
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Erro ao fazer login. Verifica os dados.";
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
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Ionicons name="paw" size={40} color="#fff" />
          </View>
          <Text style={styles.brand}>VetConnect</Text>
          <Text style={styles.brandSub}>Portal do Tutor</Text>
        </View>

        {/* Login card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrar</Text>
          <Text style={styles.cardDesc}>
            Usa o email e a palavra-passe fornecidos pela tua clínica.
          </Text>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#475569"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Palavra-passe"
              placeholderTextColor="#475569"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Entrar</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Ainda não tens acesso? Pede à tua clínica veterinária.
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
  cardTitle: { fontSize: 20, fontWeight: "800", color: "#F8FAFC", marginBottom: 6 },
  cardDesc: { fontSize: 13, color: "#94A3B8", lineHeight: 20, marginBottom: 24 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#334155", borderRadius: 14,
    borderWidth: 1, borderColor: "#475569",
    paddingHorizontal: 14, height: 52, marginBottom: 12,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#F8FAFC" },
  button: {
    flexDirection: "row", height: 52, borderRadius: 14,
    backgroundColor: "#3B82F6", justifyContent: "center", alignItems: "center", gap: 8,
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  footerText: { fontSize: 12, color: "#475569", textAlign: "center", marginTop: 24 },
});
