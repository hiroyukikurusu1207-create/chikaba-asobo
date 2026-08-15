"use client";

import { useCallback, useEffect, useState } from "react";
import type { TransportMode } from "@/lib/distance";

export type SearchPrefs = {
  mode: TransportMode;
  speed: number;
  maxMinutes: number;
};

const STORAGE_KEY = "chikaba-asobo:search-prefs";

const DEFAULT_PREFS: SearchPrefs = {
  mode: "bike",
  speed: 15,
  maxMinutes: 15,
};

export function useSearchPrefs() {
  const [prefs, setPrefsState] = useState<SearchPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    // localStorage（外部ストレージ）からの初回読み込みのため、effect内でのsetStateが必要
    let stored: SearchPrefs | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch {
      // localStorageが使えない/壊れている場合はデフォルト値のまま扱う
    }
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrefsState((prev) => ({ ...prev, ...stored }));
    }
  }, []);

  const setPrefs = useCallback((next: Partial<SearchPrefs>) => {
    setPrefsState((prev) => {
      const merged = { ...prev, ...next };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  return { prefs, setPrefs };
}
