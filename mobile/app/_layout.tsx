import { StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import { usePathname, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../src/lib/auth";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

function RootLayoutNav() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    setReady(true);
  }, [isLoading]);

  if (!ready) return null;

  const inAuthGroup = segments[0] === "(auth)";

  if (!token && !inAuthGroup) {
    return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(auth)/login" /></Stack>;
  }

  return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /></Stack>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <RootLayoutNav />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
});
