import type { LatLng } from "@/lib/distance";

type GsiFeature = {
  geometry: { coordinates: [number, number] };
  properties: { title: string };
};

// 国土地理院 住所検索API（無料・APIキー不要）
// https://msearch.gsi.go.jp/address-search/AddressSearch?q=<住所文字列>
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const features = (await res.json()) as GsiFeature[];
  const first = features[0];
  if (!first) return null;

  const [lng, lat] = first.geometry.coordinates;
  return { lat, lng };
}
