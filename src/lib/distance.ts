export type LatLng = { lat: number; lng: number };

export type TransportMode = "walk" | "bike" | "bus" | "car" | "train";

export const TRANSPORT_MODES: Record<
  TransportMode,
  { label: string; emoji: string; defaultSpeedKmh: number; minSpeedKmh: number; maxSpeedKmh: number }
> = {
  walk: { label: "徒歩", emoji: "🚶", defaultSpeedKmh: 4.8, minSpeedKmh: 3, maxSpeedKmh: 7 },
  bike: { label: "自転車", emoji: "🚲", defaultSpeedKmh: 15, minSpeedKmh: 8, maxSpeedKmh: 25 },
  bus: { label: "バス", emoji: "🚌", defaultSpeedKmh: 15, minSpeedKmh: 8, maxSpeedKmh: 25 },
  car: { label: "車", emoji: "🚗", defaultSpeedKmh: 20, minSpeedKmh: 10, maxSpeedKmh: 40 },
  // 駅までの徒歩・待ち時間・乗換を丸めて含んだ簡易概算値（経路検索は行わない）
  train: { label: "電車", emoji: "🚃", defaultSpeedKmh: 25, minSpeedKmh: 12, maxSpeedKmh: 45 },
};

// 地球を球体近似したhaversine距離（km）
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// 直線距離 × 平均速度による概算の所要時間（分、切り上げ）
export function travelMinutes(distanceKm: number, speedKmh: number): number {
  return Math.ceil((distanceKm / speedKmh) * 60);
}
