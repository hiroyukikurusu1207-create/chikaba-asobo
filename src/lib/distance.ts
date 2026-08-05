export type LatLng = { lat: number; lng: number };

export type TransportMode = "walk" | "bike" | "bus" | "car" | "train";

type TransportModeConfig = {
  label: string;
  emoji: string;
  defaultSpeedKmh: number;
  minSpeedKmh: number;
  maxSpeedKmh: number;
  // 直線距離は実際の道なりより短くなるため、所要時間の見積もりに掛ける補正係数
  detourFactor: number;
};

export const TRANSPORT_MODES: Record<TransportMode, TransportModeConfig> = {
  walk: { label: "徒歩", emoji: "🚶", defaultSpeedKmh: 4.8, minSpeedKmh: 3, maxSpeedKmh: 7, detourFactor: 1.5 },
  bike: { label: "自転車", emoji: "🚲", defaultSpeedKmh: 15, minSpeedKmh: 8, maxSpeedKmh: 25, detourFactor: 1.5 },
  bus: { label: "バス", emoji: "🚌", defaultSpeedKmh: 15, minSpeedKmh: 8, maxSpeedKmh: 25, detourFactor: 1.5 },
  car: { label: "車", emoji: "🚗", defaultSpeedKmh: 20, minSpeedKmh: 10, maxSpeedKmh: 40, detourFactor: 1.5 },
  // 駅までの徒歩・待ち時間・乗換を丸めて含んだ簡易概算値（経路検索は行わない）。
  // 速度自体に乗換等の時間を織り込み済みのため、道なり補正は適用しない。
  train: { label: "電車", emoji: "🚃", defaultSpeedKmh: 25, minSpeedKmh: 12, maxSpeedKmh: 45, detourFactor: 1 },
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
// detourFactorで、実際の道なり距離が直線距離より長くなる分を補正する
export function travelMinutes(distanceKm: number, speedKmh: number, detourFactor = 1): number {
  return Math.ceil(((distanceKm * detourFactor) / speedKmh) * 60);
}
