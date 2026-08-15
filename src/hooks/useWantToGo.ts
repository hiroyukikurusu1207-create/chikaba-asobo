"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "chikaba-asobo:want-to-go";

export function useWantToGo() {
  const [wanted, setWantedState] = useState<Set<string>>(new Set());

  useEffect(() => {
    // localStorage（外部ストレージ）からの初回読み込みのため、effect内でのsetStateが必要
    let ids: string[] = [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) ids = JSON.parse(raw);
    } catch {
      // localStorageが使えない/壊れている場合は未設定として扱う
    }
    if (ids.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWantedState(new Set(ids));
    }
  }, []);

  const toggleWant = useCallback((id: string) => {
    setWantedState((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { wanted, toggleWant };
}
