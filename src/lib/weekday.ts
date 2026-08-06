import { getHolidaysOf } from "japanese-holidays";

export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// 曜日フィルターにおける「祝日」を表す特別な値(0〜6の曜日番号とは別枠)
export const HOLIDAY_FILTER_VALUE = 7;

// 実行環境のタイムゾーンに依存しないよう、UTC基準で曜日を計算する
export function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const holidaysByYear = new Map<number, Set<string>>();

function holidaySetOf(year: number): Set<string> {
  let set = holidaysByYear.get(year);
  if (!set) {
    set = new Set(getHolidaysOf(year).map((h) => `${h.month}-${h.date}`));
    holidaysByYear.set(year, set);
  }
  return set;
}

// タイムゾーンに依存しないよう、年月日の数値だけで祝日判定する
export function isHoliday(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  return holidaySetOf(y).has(`${m}-${d}`);
}

// 長期間にわたるイベント（例: 通年開催の教室）は、曜日で絞り込む意味が
// 薄いため「どの曜日にも該当する」= フィルター対象外として扱う
const MAX_SPAN_DAYS = 14;

function addDay(set: Set<number>, iso: string): void {
  set.add(weekdayOf(iso));
  if (isHoliday(iso)) set.add(HOLIDAY_FILTER_VALUE);
}

export function weekdaysCovered(start: string, end: string | null): Set<number> | null {
  if (!end || end === start) {
    const set = new Set<number>();
    addDay(set, start);
    return set;
  }

  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  const spanDays = Math.round((endMs - startMs) / 86_400_000);
  if (spanDays < 0) {
    const set = new Set<number>();
    addDay(set, start);
    return set;
  }
  if (spanDays > MAX_SPAN_DAYS) return null;

  const set = new Set<number>();
  for (let ms = startMs; ms <= endMs; ms += 86_400_000) {
    const d = new Date(ms);
    const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    addDay(set, iso);
  }
  return set;
}
