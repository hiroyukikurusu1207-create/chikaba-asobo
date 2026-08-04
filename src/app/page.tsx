"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useHomeLocation } from "@/hooks/useHomeLocation";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_BIKE_SPEED_KMH, bikeMinutes, haversineDistanceKm } from "@/lib/distance";
import type { EventRow } from "@/lib/types";
import { EventCard } from "@/components/EventCard";
import { HomeSetupForm } from "@/components/HomeSetupForm";

const MINUTE_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

export default function Page() {
  const { home, setHome, clearHome, loaded } = useHomeLocation();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [maxMinutes, setMaxMinutes] = useState(15);
  const [speed, setSpeed] = useState(DEFAULT_BIKE_SPEED_KMH);
  // null = 全ジャンル選択中（イベント読み込み前のデフォルト状態も兼ねる）
  const [selectedGenres, setSelectedGenres] = useState<Set<string> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("events")
      .select("*")
      .order("start_date", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setEvents(data);
        setLoadingEvents(false);
      });
  }, []);

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => e.genre.forEach((g) => set.add(g)));
    return [...set].sort();
  }, [events]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const visibleEvents = useMemo(() => {
    if (!home) return [];
    return events
      .filter((e) => (e.end_date ?? e.start_date) >= today)
      .filter(
        (e) =>
          e.genre.length === 0 ||
          selectedGenres === null ||
          e.genre.some((g) => selectedGenres.has(g)),
      )
      .map((e) => {
        const minutes =
          e.lat !== null && e.lng !== null
            ? bikeMinutes(haversineDistanceKm(home, { lat: e.lat, lng: e.lng }), speed)
            : null;
        return { event: e, minutes };
      })
      .filter(({ minutes }) => minutes === null || minutes <= maxMinutes)
      .sort((a, b) => {
        if (a.minutes === null) return 1;
        if (b.minutes === null) return -1;
        return a.minutes - b.minutes;
      });
  }, [events, home, selectedGenres, maxMinutes, speed, today]);

  if (!loaded) return null;

  if (!home) {
    return <HomeSetupForm onSaved={setHome} />;
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-lg px-4 py-6 flex flex-col gap-5">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">ちかばであそぼーよ</h1>
        <Link
          href="/admin"
          className="text-xs text-black/40 dark:text-white/40 hover:underline"
        >
          管理
        </Link>
      </header>

      <section className="rounded-xl bg-black/5 dark:bg-white/5 p-3 flex items-center justify-between gap-2">
        <p className="text-sm truncate">🏠 {home.address}</p>
        <button
          onClick={clearHome}
          className="text-xs shrink-0 text-blue-700 dark:text-blue-300 hover:underline"
        >
          変更
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-medium">自転車で何分以内?</label>
        <div className="flex flex-wrap gap-2">
          {MINUTE_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setMaxMinutes(m)}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                maxMinutes === m
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-black/15 dark:border-white/20"
              }`}
            >
              {m}分
            </button>
          ))}
        </div>
        <details className="text-xs text-black/50 dark:text-white/50">
          <summary className="cursor-pointer select-none">自転車の速度を調整する</summary>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="range"
              min={8}
              max={25}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="flex-1"
            />
            <span className="whitespace-nowrap">時速{speed}km</span>
          </div>
        </details>
      </section>

      {allGenres.length > 0 && (
        <section className="flex flex-col gap-2">
          <label className="text-sm font-medium">ジャンル</label>
          <div className="flex flex-wrap gap-2">
            {allGenres.map((g) => {
              const active = selectedGenres === null || selectedGenres.has(g);
              return (
                <button
                  key={g}
                  onClick={() =>
                    setSelectedGenres((prev) => {
                      const next = new Set(prev ?? allGenres);
                      if (next.has(g)) next.delete(g);
                      else next.add(g);
                      return next;
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    active
                      ? "bg-orange-500 text-white border-orange-500"
                      : "border-black/15 dark:border-white/20"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        {loadingEvents ? (
          <p className="text-sm text-black/50 dark:text-white/50">読み込み中...</p>
        ) : visibleEvents.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">
            条件に合うイベントが見つかりませんでした。分数を増やすかジャンルを見直してみてください。
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {visibleEvents.map(({ event, minutes }) => (
              <EventCard key={event.id} event={event} minutes={minutes} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
