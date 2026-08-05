export type CostBucketId = "free" | "le500" | "le1000" | "le2000" | "le3000" | "gt3000";

export const COST_BUCKETS: { id: CostBucketId; label: string }[] = [
  { id: "free", label: "無料" },
  { id: "le500", label: "500円以下" },
  { id: "le1000", label: "1000円以下" },
  { id: "le2000", label: "2000円以下" },
  { id: "le3000", label: "3000円以下" },
  { id: "gt3000", label: "3001円以上" },
];

// 費用欄のフリーテキストから、金額を推定する。
// 複数の料金が書かれている場合は一番安い金額（参加のハードルの低さ）を採用する。
// 「有料」とだけ書かれていて具体的な金額が読み取れない場合はnull（不明）を返す。
export function estimateCostYen(cost: string | null): number | null {
  if (!cost || cost.trim() === "" || cost.includes("無料")) return 0;

  const amounts = [...cost.matchAll(/([\d,]+)\s*円/g)].map((m) => Number(m[1].replace(/,/g, "")));
  if (amounts.length === 0) return null;

  return Math.min(...amounts);
}

export function costBucketOf(cost: string | null): CostBucketId | null {
  const yen = estimateCostYen(cost);
  if (yen === null) return null;
  if (yen === 0) return "free";
  if (yen <= 500) return "le500";
  if (yen <= 1000) return "le1000";
  if (yen <= 2000) return "le2000";
  if (yen <= 3000) return "le3000";
  return "gt3000";
}
