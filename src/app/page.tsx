"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useHomeLocation } from "@/hooks/useHomeLocation";
import { useSearchPrefs } from "@/hooks/useSearchPrefs";
import { createClient } from "@/lib/supabase/client";
import {
  TRANSPORT_MODES,
  type TransportMode,
  travelMinutes,
  haversineDistanceKm,
  STROLLER_SPEED_KMH,
} from "@/lib/distance";
import type { EventRow } from "@/lib/types";
import { EventCard } from "@/components/EventCard";
import { HomeSetupForm } from "@/components/HomeSetupForm";
import { COST_BUCKETS, costBucketOf } from "@/lib/cost";
import { WEEKDAYS, HOLIDAY_FILTER_VALUE, weekdaysCovered } from "@/lib/weekday";

const MINUTE_OPTIONS = [5, 10, 15, 20, 30, 45, 60];
const PAGE_SIZE = 30;

const WEEKDAY_FILTER_OPTIONS = [
  ...WEEKDAYS.map((label, w) => ({ label, value: w })),
  { label: "祝", value: HOLIDAY_FILTER_VALUE },
];

type SortBy = "distance" | "date";
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "date", label: "開催日順" },
  { value: "distance", label: "近い順" },
];

export default function Page() {
  const { home, setHome, clearHome, loaded } = useHomeLocation();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const {
    prefs,
    setPrefs,
    selectedGenres,
    setSelectedGenres,
    selectedCostBuckets,
    setSelectedCostBuckets,
    selectedWeekdays,
    setSelectedWeekdays,
  } = useSearchPrefs();
  const { mode, speed, maxMinutes } = prefs;

  function selectMode(next: TransportMode) {
    setPrefs({ mode: next, speed: TRANSPORT_MODES[next].defaultSpeedKmh });
  }
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [page, setPage] = useState(1);

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
    // 「その他」は常に一覧の最後に配置する
    return [...set].sort((a, b) => {
      if (a === "その他") return 1;
      if (b === "その他") return -1;
      return a.localeCompare(b, "ja");
    });
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
      .filter((e) => {
        if (selectedCostBuckets === null) return true;
        const bucket = costBucketOf(e.cost);
        // 金額が読み取れないイベントは、費用フィルターでは除外しない
        return bucket === null || selectedCostBuckets.has(bucket);
      })
      .filter((e) => {
        if (selectedWeekdays === null) return true;
        const covered = weekdaysCovered(e.start_date, e.end_date);
        // 長期間開催などで曜日を特定できないイベントは除外しない
        return covered === null || [...covered].some((w) => selectedWeekdays.has(w));
      })
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
  }, [
    events,
    home,
    selectedGenres,
    selectedCostBuckets,
    selectedWeekdays,
    maxMinutes,
    speed,
    mode,
    today,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(visibleEvents.length / PAGE_SIZE));

  // 絞り込み条件が変わって表示イベントが変わったら1ページ目に戻す
  // (レンダー中にstateを更新する公式パターン: https://react.dev/learn/you-might-not-need-an-effect)
  const [prevVisibleEvents, setPrevVisibleEvents] = useState(visibleEvents);
  if (prevVisibleEvents !== visibleEvents) {
    setPrevVisibleEvents(visibleEvents);
    setPage(1);
  }

  const pagedEvents = visibleEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goToPage(next: number) {
    setPage(next);
    document.getElementById("event-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!loaded) return null;

  if (!home) {
    return <HomeSetupForm onSaved={setHome} />;
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-lg px-4 py-6 flex flex-col gap-5">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold tracking-tight">
          ちかばで<span className="text-accent">あそぼーよ</span>
          <span className="text-sm font-bold text-muted">＠江戸川区周辺</span>
        </h1>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/links" className="text-xs text-muted hover:text-foreground hover:underline">
            リンク集
          </Link>
          <Link
            href="/admin"
            className="text-xs font-bold text-accent border border-accent rounded-full px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            ＋ イベントを追加
          </Link>
        </div>
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
              onClick={() => setPrefs({ maxMinutes: m })}
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
              onChange={(e) => setPrefs({ speed: Number(e.target.value) })}
              list={mode === "walk" ? "stroller-speed-tick" : undefined}
              className="flex-1 accent-primary"
            />
            {mode === "walk" && (
              <datalist id="stroller-speed-tick">
                <option value={STROLLER_SPEED_KMH}></option>
              </datalist>
            )}
            <span className="whitespace-nowrap">時速{speed}km</span>
          </div>
          {mode === "walk" && (
            <button
              type="button"
              onClick={() => setPrefs({ speed: STROLLER_SPEED_KMH })}
              className="mt-2 text-accent font-bold hover:underline"
            >
              🍼 ベビーカーの目安(時速{STROLLER_SPEED_KMH}km)に合わせる
            </button>
          )}
          {mode === "train" && (
            <p className="mt-1">
              ※電車は駅までの徒歩や待ち時間を含めた簡易概算です。乗換検索ほど正確ではありません。
            </p>
          )}
        </details>
      </section>

      {allGenres.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-bold">ジャンル</label>
            <button
              onClick={() =>
                setSelectedGenres((prev) => (prev !== null && prev.size === 0 ? null : new Set()))
              }
              className="text-xs font-bold text-accent hover:underline"
            >
              {selectedGenres !== null && selectedGenres.size === 0 ? "すべて選択" : "すべて解除"}
            </button>
          </div>
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

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-bold">費用</label>
          <button
            onClick={() =>
              setSelectedCostBuckets((prev) =>
                prev !== null && prev.size === 0 ? null : new Set(),
              )
            }
            className="text-xs font-bold text-accent hover:underline"
          >
            {selectedCostBuckets !== null && selectedCostBuckets.size === 0
              ? "すべて選択"
              : "すべて解除"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {COST_BUCKETS.map(({ id, label }) => {
            const active = selectedCostBuckets === null || selectedCostBuckets.has(id);
            return (
              <button
                key={id}
                onClick={() =>
                  setSelectedCostBuckets((prev) => {
                    const next = new Set(prev ?? COST_BUCKETS.map((b) => b.id));
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
                className={`px-3.5 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                  active
                    ? "bg-highlight text-highlight-foreground border-highlight shadow-sm"
                    : "bg-card border-card-border text-muted"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-bold">曜日</label>
          <button
            onClick={() =>
              setSelectedWeekdays((prev) => (prev !== null && prev.size === 0 ? null : new Set()))
            }
            className="text-xs font-bold text-accent hover:underline"
          >
            {selectedWeekdays !== null && selectedWeekdays.size === 0 ? "すべて選択" : "すべて解除"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_FILTER_OPTIONS.map(({ label, value: w }) => {
            const active = selectedWeekdays === null || selectedWeekdays.has(w);
            return (
              <button
                key={w}
                onClick={() =>
                  setSelectedWeekdays((prev) => {
                    const next = new Set(prev ?? WEEKDAY_FILTER_OPTIONS.map((o) => o.value));
                    if (next.has(w)) next.delete(w);
                    else next.add(w);
                    return next;
                  })
                }
                className={`w-10 h-10 rounded-full text-sm font-bold border transition-colors ${
                  active
                    ? "bg-highlight text-highlight-foreground border-highlight shadow-sm"
                    : "bg-card border-card-border text-muted"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

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

      <section id="event-list" className="flex flex-col gap-3 scroll-mt-4">
        {loadingEvents ? (
          <p className="text-sm text-muted">読み込み中...</p>
        ) : visibleEvents.length === 0 ? (
          <p className="text-sm text-muted">
            条件に合うイベントが見つかりませんでした。分数を増やすかジャンルを見直してみてください。
          </p>
        ) : (
          <>
            <p className="text-xs text-muted">
              {visibleEvents.length}件中 {(page - 1) * PAGE_SIZE + 1}〜
              {Math.min(page * PAGE_SIZE, visibleEvents.length)}件を表示
            </p>
            <ul className="flex flex-col gap-3">
              {pagedEvents.map(({ event, minutes }) => (
                <EventCard
                  key={event.id}
                  event={event}
                  minutes={minutes}
                  modeEmoji={TRANSPORT_MODES[mode].emoji}
                />
              ))}
            </ul>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3.5 py-1.5 rounded-full text-sm font-bold border bg-card border-card-border text-muted disabled:opacity-40"
                >
                  ＜ 前へ
                </button>
                <span className="text-sm font-bold">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => goToPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-3.5 py-1.5 rounded-full text-sm font-bold border bg-card border-card-border text-muted disabled:opacity-40"
                >
                  次へ ＞
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <footer className="text-center pt-2">
        <a
          href="mailto:edogawa.asoboyo@gmail.com"
          className="text-xs text-muted hover:text-foreground hover:underline"
        >
          お問い合わせ
        </a>
      </footer>
    </main>
  );
}
