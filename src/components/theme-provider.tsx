"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "next-themes";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider");
  return ctx;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setTheme((resolvedTheme as Theme) || "dark");
  }, [mounted, resolvedTheme, setTheme]);

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  if (!mounted) return <div style={{ visibility: "hidden" }}>{children}</div>;

  return (
    <ThemeContext.Provider value={{ theme: (resolvedTheme as Theme) || "dark", setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
