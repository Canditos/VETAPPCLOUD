import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#1e293b",
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="appointments" options={{ title: "Consultas" }} />
        <Stack.Screen name="patients" options={{ title: "Pacientes" }} />
        <Stack.Screen name="invoices" options={{ title: "Faturas" }} />
        <Stack.Screen name="messages" options={{ title: "Mensagens" }} />
        <Stack.Screen name="profile" options={{ title: "Perfil" }} />
        <Stack.Screen
          name="patients/[id]"
          options={{ title: "Paciente", headerShown: false }}
        />
      </Stack>
    </>
  );
}
