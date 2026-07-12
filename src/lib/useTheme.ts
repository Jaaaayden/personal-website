"use client";

import { useSyncExternalStore } from "react";

export const THEME_KEY = "jl-theme";
export const THEME_EVENT = "jl-theme-change";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function getTheme(): "dark" | "light" {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** Current site theme; re-renders on toggle. Server-renders as "dark". */
export function useTheme(): "dark" | "light" {
  return useSyncExternalStore(subscribe, getTheme, () => "dark");
}
