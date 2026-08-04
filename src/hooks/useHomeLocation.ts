"use client";

import { useCallback, useEffect, useState } from "react";
import type { LatLng } from "@/lib/distance";

export type HomeLocation = LatLng & { address: string };

const STORAGE_KEY = "chikaba-asobo:home-location";

export function useHomeLocation() {
  const [home, setHomeState] = useState<HomeLocation | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // localStorage（外部ストレージ）からの初回読み込みのため、effect内でのsetStateが必要
    let stored: HomeLocation | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch {
      // localStorageが使えない/壊れている場合は未設定として扱う
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHomeState(stored);
    setLoaded(true);
  }, []);

  const setHome = useCallback((next: HomeLocation) => {
    setHomeState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const clearHome = useCallback(() => {
    setHomeState(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { home, setHome, clearHome, loaded };
}
