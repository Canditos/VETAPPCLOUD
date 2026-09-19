"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isPinned: boolean;
  setIsPinned: (pinned: boolean | ((prev: boolean) => boolean)) => void;
  isHovered: boolean;
  setIsHovered: (hovered: boolean) => void;
  isExpanded: boolean;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isPinned: false,
  setIsPinned: () => {},
  isHovered: false,
  setIsHovered: () => {},
  isExpanded: false,
  collapseSidebar: () => {},
  expandSidebar: () => {},
  toggleSidebar: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isPinned, setIsPinnedState] = useState<boolean>(false);
  const [isHovered, setIsHoveredState] = useState<boolean>(false);
  const [isManuallyClosed, setIsManuallyClosed] = useState<boolean>(false);
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

  const setIsHovered = (hovered: boolean) => {
    setIsHoveredState(hovered);
    if (!hovered) {
      // Quando o rato sai da sidebar, limpa o estado de fecho manual
      setIsManuallyClosed(false);
    }
  };

  const collapseSidebar = () => {
    setIsPinnedState(false);
    try {
      localStorage.setItem("vet_sidebar_pinned", "false");
    } catch {
      // Ignore
    }
    setIsHoveredState(false);
    setIsManuallyClosed(true);
  };

  const expandSidebar = () => {
    setIsManuallyClosed(false);
    setIsHoveredState(true);
  };

  const toggleSidebar = () => {
    const currentExpanded = mounted ? ((isPinned || isHovered) && !isManuallyClosed) : false;
    if (currentExpanded) {
      collapseSidebar();
    } else {
      expandSidebar();
    }
  };

  const isExpanded = mounted ? ((isPinned || isHovered) && !isManuallyClosed) : false;

  return (
    <SidebarContext.Provider
      value={{
        isPinned,
        setIsPinned,
        isHovered,
        setIsHovered,
        isExpanded,
        collapseSidebar,
        expandSidebar,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
