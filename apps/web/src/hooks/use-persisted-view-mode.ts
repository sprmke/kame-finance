"use client";

import { useEffect, useState } from "react";

import type { ViewMode } from "@/components/shared/ViewToggle";

import { MOBILE_MEDIA_QUERY, useMediaQuery } from "./use-media-query";

function defaultViewModeForViewport(): ViewMode {
  if (typeof window === "undefined") return "grid";
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches ? "grid" : "table";
}

export function usePersistedViewMode(storageKey: string) {
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  // Desktop defaults to the table view; mobile always renders cards via
  // `ViewModeLayout`, so this initial value avoids a table→grid skeleton flash
  // for the common case before localStorage is read.
  const [storedViewMode, setStoredViewMode] = useState<ViewMode>("table");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved === "grid" || saved === "table") {
      setStoredViewMode(saved);
      return;
    }
    setStoredViewMode(defaultViewModeForViewport());
  }, [storageKey]);

  function setViewMode(mode: ViewMode) {
    setStoredViewMode(mode);
    localStorage.setItem(storageKey, mode);
  }

  const viewMode: ViewMode = isMobile ? "grid" : storedViewMode;

  return {
    viewMode,
    setViewMode,
    isMobile,
    storedViewMode,
  };
}
