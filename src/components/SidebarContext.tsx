"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isPinned: boolean;
  setIsPinned: (pinned: boolean | ((prev: boolean) => boolean)) => void;
  isHovered: boolean;
  setIsHovered: (hovered: boolean) => void;
  isExpanded: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  isPinned: false,
  setIsPinned: () => {},
  isHovered: false,
  setIsHovered: () => {},
  isExpanded: false,
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isPinned, setIsPinnedState] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vet_sidebar_pinned");
      if (saved !== null) {
        setIsPinnedState(saved === "true");
      }
    } catch {
      // Ignore
    }
    setMounted(true);
  }, []);

  const setIsPinned = (value: boolean | ((prev: boolean) => boolean)) => {
    setIsPinnedState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      try {
        localStorage.setItem("vet_sidebar_pinned", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const isExpanded = mounted ? (isPinned || isHovered) : false;

  return (
    <SidebarContext.Provider
      value={{
        isPinned,
        setIsPinned,
        isHovered,
        setIsHovered,
        isExpanded,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
