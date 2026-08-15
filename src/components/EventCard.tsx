import type { EventRow } from "@/lib/types";
import { WEEKDAYS, weekdayOf } from "@/lib/weekday";

const GENRE_ICONS: Record<string, string> = {
  "おはなし会・朗読会": "📖",
  お祭り: "🏮",
  ワークショップ: "🔨",
  映画会: "🎬",
  "演奏会（コンサート）": "🎤",
  音楽: "🎵",
  "寄席・演芸": "🎭",
  "教室・体験": "✏️",
  工作会: "✂️",
  講座: "📚",
  "研修会・講座": "📚",
  催事: "🎪",
  "展示・アート": "🎨",
  "文化・芸術": "🎨",
};

function formatDateRange(start: string, end: string | null): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${Number(m)}/${Number(d)}(${WEEKDAYS[weekdayOf(iso)]})`;
  };
  if (!end || end === start) return fmt(start);
  return `${fmt(start)}〜${fmt(end)}`;
}

export function EventCard({
  event,
  minutes,
  modeEmoji,
  wanted,
  onToggleWant,
}: {
  event: EventRow;
  minutes: number | null;
  modeEmoji: string;
  wanted: boolean;
  onToggleWant: () => void;
}) {
  return (
    <li className="rounded-2xl bg-card border border-card-border shadow-sm p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {event.genre.map((g) => (
            <span
              key={g}
              className="text-xs font-bold rounded-full bg-highlight text-highlight-foreground px-2 py-0.5"
            >
              {GENRE_ICONS[g] ? `${GENRE_ICONS[g]} ` : ""}
              {g}
            </span>
          ))}
        </div>
        {minutes !== null && (
          <span className="text-sm font-bold text-accent whitespace-nowrap">
            {modeEmoji} 約{minutes}分
          </span>
        )}
      </div>
      <h3 className="font-bold leading-snug">
        {event.source_url ? (
          <a
            href={event.source_url}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            {event.title}
          </a>
        ) : (
          event.title
        )}
      </h3>
      <p className="text-sm text-muted">
        {formatDateRange(event.start_date, event.end_date)}
        {event.event_time ? ` ${event.event_time.split("\n")[0]}` : ""}
        {event.venue_name ? ` ・ ${event.venue_name.split("\n")[0]}` : ""}
      </p>
      <p className="text-xs text-muted">
        対象: {event.target_age ? event.target_age.split("\n")[0] : "指定なし"}
        {" ・ 費用: "}
        {event.cost ? event.cost.split("\n")[0] : "無料※記載なしのため"}
      </p>
      <button
        type="button"
        onClick={onToggleWant}
        className={`self-start mt-1 text-xs font-bold rounded-full px-3 py-1 border transition-colors ${
          wanted
            ? "bg-accent text-accent-foreground border-accent shadow-sm"
            : "bg-card border-card-border text-muted"
        }`}
      >
        {wanted ? "★ 気になる！" : "☆ 気になる"}
      </button>
    </li>
  );
}
