"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useHomeLocation } from "@/hooks/useHomeLocation";
import { createClient } from "@/lib/supabase/client";
import {
  TRANSPORT_MODES,
  type TransportMode,
  travelMinutes,
  haversineDistanceKm,
} from "@/lib/distance";
import type { EventRow } from "@/lib/types";
import { EventCard } from "@/components/EventCard";
import { HomeSetupForm } from "@/components/HomeSetupForm";

const MINUTE_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

type SortBy = "distance" | "date";
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "distance", label: "近い順" },
  { value: "date", label: "開催日順" },
];

export default function Page() {
  const { home, setHome, clearHome, loaded } = useHomeLocation();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [maxMinutes, setMaxMinutes] = useState(15);
  const [mode, setMode] = useState<TransportMode>("bike");
  const [speed, setSpeed] = useState(TRANSPORT_MODES.bike.defaultSpeedKmh);

  function selectMode(next: TransportMode) {
    setMode(next);
    setSpeed(TRANSPORT_MODES[next].defaultSpeedKmh);
  }
  // null = 全ジャンル選択中（イベント読み込み前のデフォルト状態も兼ねる）
  const [selectedGenres, setSelectedGenres] = useState<Set<string> | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("distance");

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
            ? travelMinutes(
                haversineDistanceKm(home, { lat: e.lat, lng: e.lng }),
                speed,
                TRANSPORT_MODES[mode].detourFactor,
              )
            : null;
        return { event: e, minutes };
      })
      .filter(({ minutes }) => minutes === null || minutes <= maxMinutes)
      .sort((a, b) => {
        if (sortBy === "date") {
          return a.event.start_date.localeCompare(b.event.start_date);
        }
        if (a.minutes === null) return 1;
        if (b.minutes === null) return -1;
        return a.minutes - b.minutes;
      });
  }, [events, home, selectedGenres, maxMinutes, speed, mode, today, sortBy]);

  if (!loaded) return null;

  if (!home) {
    return <HomeSetupForm onSaved={setHome} />;
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-lg px-4 py-6 flex flex-col gap-5">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold tracking-tight">
          ちかばで<span className="text-accent">あそぼーよ</span>
        </h1>
        <Link
          href="/admin"
          className="text-xs text-muted hover:text-foreground hover:underline"
        >
          管理
        </Link>
      </header>

      <section className="rounded-2xl bg-card border border-card-border shadow-sm p-3.5 flex items-center justify-between gap-2">
        <p className="text-sm truncate">🏠 {home.address}</p>
        <button
          onClick={clearHome}
          className="text-xs shrink-0 font-bold text-accent hover:underline"
        >
          変更
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-bold">移動手段</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TRANSPORT_MODES) as TransportMode[]).map((m) => (
            <button
              key={m}
              onClick={() => selectMode(m)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                mode === m
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card border-card-border text-muted"
              }`}
            >
              {TRANSPORT_MODES[m].emoji} {TRANSPORT_MODES[m].label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-bold">{TRANSPORT_MODES[mode].label}で何分以内?</label>
        <div className="flex flex-wrap gap-2">
          {MINUTE_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setMaxMinutes(m)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                maxMinutes === m
                  ? "bg-accent text-accent-foreground border-accent shadow-sm"
                  : "bg-card border-card-border text-muted"
              }`}
            >
              {m}分
            </button>
          ))}
        </div>
        <details className="text-xs text-muted">
          <summary className="cursor-pointer select-none">速度を調整する(時速)</summary>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="range"
              min={TRANSPORT_MODES[mode].minSpeedKmh}
              max={TRANSPORT_MODES[mode].maxSpeedKmh}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="whitespace-nowrap">時速{speed}km</span>
          </div>
          {mode === "train" && (
            <p className="mt-1">
              ※電車は駅までの徒歩や待ち時間を含めた簡易概算です。乗換検索ほど正確ではありません。
            </p>
          )}
        </details>
      </section>

      {allGenres.length > 0 && (
        <section className="flex flex-col gap-2">
          <label className="text-sm font-bold">ジャンル</label>
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
                  className={`px-3.5 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                    active
                      ? "bg-highlight text-highlight-foreground border-highlight shadow-sm"
                      : "bg-card border-card-border text-muted"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="flex items-center justify-between gap-2">
        <label className="text-sm font-bold">並び順</label>
        <div className="flex gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                sortBy === opt.value
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card border-card-border text-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        {loadingEvents ? (
          <p className="text-sm text-muted">読み込み中...</p>
        ) : visibleEvents.length === 0 ? (
          <p className="text-sm text-muted">
            条件に合うイベントが見つかりませんでした。分数を増やすかジャンルを見直してみてください。
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {visibleEvents.map(({ event, minutes }) => (
              <EventCard
                key={event.id}
                event={event}
                minutes={minutes}
                modeEmoji={TRANSPORT_MODES[mode].emoji}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
