import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { api } from "./api";
import type { Owner } from "./types";

interface AuthContextValue {
  token: string | null;
  owner: Owner | null;
  isLoading: boolean;
  setSession: (jwt: string, owner: Owner) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync("vet_portal_jwt");
        const storedOwner = await SecureStore.getItemAsync("vet_portal_owner");
        if (stored && storedOwner) {
          // Validate by calling /api/portal/me
          const res = await api.get("/api/portal/me");
          setToken(stored);
          setOwner(res.data.owner || JSON.parse(storedOwner));
        }
      } catch {
        await SecureStore.deleteItemAsync("vet_portal_jwt");
        await SecureStore.deleteItemAsync("vet_portal_owner");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setSession = useCallback(async (jwt: string, owner: Owner) => {
    await SecureStore.setItemAsync("vet_portal_jwt", jwt);
    await SecureStore.setItemAsync("vet_portal_owner", JSON.stringify(owner));
    setToken(jwt);
    setOwner(owner);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync("vet_portal_jwt");
    await SecureStore.deleteItemAsync("vet_portal_owner");
    setToken(null);
    setOwner(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, owner, isLoading, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
