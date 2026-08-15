"use client";

import { useCallback, useEffect, useState, type SetStateAction } from "react";
import type { TransportMode } from "@/lib/distance";

export type SearchPrefs = {
  mode: TransportMode;
  speed: number;
  maxMinutes: number;
};

// localStorageに保存する形（Setはそのままシリアライズできないため配列で保持する）
type StoredPrefs = {
  mode: TransportMode;
  speed: number;
  maxMinutes: number;
  selectedGenres: string[] | null;
  selectedCostBuckets: string[] | null;
  selectedWeekdays: number[] | null;
};

const STORAGE_KEY = "chikaba-asobo:search-prefs";

const DEFAULT_PREFS: SearchPrefs = {
  mode: "bike",
  speed: 15,
  maxMinutes: 15,
};

function loadStored(): Partial<StoredPrefs> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // localStorageが使えない/壊れている場合はデフォルト値のまま扱う
  }
  return {};
}

function resolve<T>(update: SetStateAction<T>, prev: T): T {
  return typeof update === "function" ? (update as (p: T) => T)(prev) : update;
}

export function useSearchPrefs() {
  const [prefs, setPrefsState] = useState<SearchPrefs>(DEFAULT_PREFS);
  const [selectedGenres, setSelectedGenresState] = useState<Set<string> | null>(null);
  const [selectedCostBuckets, setSelectedCostBucketsState] = useState<Set<string> | null>(null);
  const [selectedWeekdays, setSelectedWeekdaysState] = useState<Set<number> | null>(null);

  useEffect(() => {
    // localStorage（外部ストレージ）からの初回読み込みのため、effect内でのsetStateが必要
    const stored = loadStored();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefsState((prev) => ({
      mode: stored.mode ?? prev.mode,
      speed: stored.speed ?? prev.speed,
      maxMinutes: stored.maxMinutes ?? prev.maxMinutes,
    }));
    if (stored.selectedGenres !== undefined) {
      setSelectedGenresState(stored.selectedGenres ? new Set(stored.selectedGenres) : null);
    }
    if (stored.selectedCostBuckets !== undefined) {
      setSelectedCostBucketsState(
        stored.selectedCostBuckets ? new Set(stored.selectedCostBuckets) : null,
      );
    }
    if (stored.selectedWeekdays !== undefined) {
      setSelectedWeekdaysState(stored.selectedWeekdays ? new Set(stored.selectedWeekdays) : null);
    }
  }, []);

  const persist = useCallback((partial: Partial<StoredPrefs>) => {
    const merged = { ...loadStored(), ...partial };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }, []);

  const setPrefs = useCallback(
    (next: Partial<SearchPrefs>) => {
      setPrefsState((prev) => {
        const merged = { ...prev, ...next };
        persist(merged);
        return merged;
      });
    },
    [persist],
  );

  const setSelectedGenres = useCallback(
    (update: SetStateAction<Set<string> | null>) => {
      setSelectedGenresState((prev) => {
        const next = resolve(update, prev);
        persist({ selectedGenres: next ? [...next] : null });
        return next;
      });
    },
    [persist],
  );

  const setSelectedCostBuckets = useCallback(
    (update: SetStateAction<Set<string> | null>) => {
      setSelectedCostBucketsState((prev) => {
        const next = resolve(update, prev);
        persist({ selectedCostBuckets: next ? [...next] : null });
        return next;
      });
    },
    [persist],
  );

  const setSelectedWeekdays = useCallback(
    (update: SetStateAction<Set<number> | null>) => {
      setSelectedWeekdaysState((prev) => {
        const next = resolve(update, prev);
        persist({ selectedWeekdays: next ? [...next] : null });
        return next;
      });
    },
    [persist],
  );

  return {
    prefs,
    setPrefs,
    selectedGenres,
    setSelectedGenres,
    selectedCostBuckets,
    setSelectedCostBuckets,
    selectedWeekdays,
    setSelectedWeekdays,
  };
}
