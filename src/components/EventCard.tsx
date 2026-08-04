import type { EventRow } from "@/lib/types";

function formatDateRange(start: string, end: string | null): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${Number(m)}/${Number(d)}`;
  };
  if (!end || end === start) return fmt(start);
  return `${fmt(start)}〜${fmt(end)}`;
}

export function EventCard({
  event,
  minutes,
  modeEmoji,
}: {
  event: EventRow;
  minutes: number | null;
  modeEmoji: string;
}) {
  return (
    <li className="rounded-xl border border-black/10 dark:border-white/15 p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {event.genre.map((g) => (
            <span
              key={g}
              className="text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 px-2 py-0.5"
            >
              {g}
            </span>
          ))}
        </div>
        {minutes !== null && (
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
            {modeEmoji} 約{minutes}分
          </span>
        )}
      </div>
      <h3 className="font-semibold leading-snug">
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
      <p className="text-sm text-black/70 dark:text-white/70">
        {formatDateRange(event.start_date, event.end_date)}
        {event.venue_name ? ` ・ ${event.venue_name.split("\n")[0]}` : ""}
      </p>
    </li>
  );
}
