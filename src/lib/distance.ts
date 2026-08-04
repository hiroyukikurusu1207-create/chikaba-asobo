export const DEFAULT_BIKE_SPEED_KMH = 15;

export type LatLng = { lat: number; lng: number };

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

// 直線距離 × 平均速度による概算の自転車所要時間（分、切り上げ）
export function bikeMinutes(
  distanceKm: number,
  speedKmh: number = DEFAULT_BIKE_SPEED_KMH,
): number {
  return Math.ceil((distanceKm / speedKmh) * 60);
}
