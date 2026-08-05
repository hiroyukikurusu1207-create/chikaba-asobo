export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// 実行環境のタイムゾーンに依存しないよう、UTC基準で曜日を計算する
export function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// 長期間にわたるイベント（例: 通年開催の教室）は、曜日で絞り込む意味が
// 薄いため「どの曜日にも該当する」= フィルター対象外として扱う
const MAX_SPAN_DAYS = 14;

export function weekdaysCovered(start: string, end: string | null): Set<number> | null {
  if (!end || end === start) return new Set([weekdayOf(start)]);

  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  const spanDays = Math.round((endMs - startMs) / 86_400_000);
  if (spanDays < 0) return new Set([weekdayOf(start)]);
  if (spanDays > MAX_SPAN_DAYS) return null;

  const set = new Set<number>();
  for (let ms = startMs; ms <= endMs; ms += 86_400_000) {
    set.add(new Date(ms).getUTCDay());
  }
  return set;
}
