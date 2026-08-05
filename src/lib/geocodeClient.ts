import type { LatLng } from "@/lib/distance";

type GsiFeature = {
  geometry: { coordinates: [number, number] };
  properties: { title: string };
};

type NominatimResult = { lat: string; lon: string };

// GSIは「豊田神社」のような施設名だけでは番地までマッチできず、
// エラーではなく「東京都江戸川区」のような区市町村レベルの代表点に
// フォールバックすることがある。これを実際の位置として扱うと、
// たまたま自宅の近くの代表点にヒットした場合に距離を大きく誤るため、
// 丁目・番地などの具体的な情報を含まない結果は「マッチなし」として扱う。
function isSpecificEnough(title: string): boolean {
  return /\d|丁目|番地?/.test(title);
}

// 東京都およそ全域のバウンディングボックス。これから大きく外れる結果は
// 別の場所の同名施設などにヒットした誤マッチの可能性が高いため除外する。
function isWithinTokyoArea({ lat, lng }: LatLng): boolean {
  return lat >= 35.4 && lat <= 35.9 && lng >= 139.3 && lng <= 140.2;
}

// 国土地理院 住所検索API（無料・APIキー不要）。番地までの住所には強いが、
// 神社・公園・学校などの施設名だけでは解決できないことが多い。
// https://msearch.gsi.go.jp/address-search/AddressSearch?q=<住所文字列>
async function geocodeViaGsi(query: string): Promise<LatLng | null> {
  const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const features = (await res.json()) as GsiFeature[];
  const first = features[0];
  if (!first || !isSpecificEnough(first.properties.title)) return null;

  const [lng, lat] = first.geometry.coordinates;
  return { lat, lng };
}

// OpenStreetMap Nominatim。神社・公園などの施設名（POI）に強いフォールバック。
// 無料の共用インスタンスのため、User-Agentを明示し逐次呼び出しに留める。
async function geocodeViaNominatim(query: string): Promise<LatLng | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=jp`;
  const res = await fetch(url, {
    headers: { "User-Agent": "chikaba-asobo/1.0 (personal event-finder app)" },
  });
  if (!res.ok) return null;

  const results = (await res.json()) as NominatimResult[];
  const first = results[0];
  if (!first) return null;

  return { lat: Number(first.lat), lng: Number(first.lon) };
}

async function geocodeOnce(query: string): Promise<LatLng | null> {
  const gsi = await geocodeViaGsi(query);
  if (gsi && isWithinTokyoArea(gsi)) return gsi;

  const nominatim = await geocodeViaNominatim(query);
  if (nominatim && isWithinTokyoArea(nominatim)) return nominatim;

  return null;
}

// 「豊田神社・東部公園」のように「・」で複数施設名が連結された住所は
// まとめて検索すると解決できないことが多いため、それぞれ単独でも試す
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const direct = await geocodeOnce(address);
  if (direct) return direct;

  if (address.includes("・")) {
    const prefixMatch = address.match(/^(.*?)\s+/);
    const prefix = prefixMatch ? prefixMatch[1] : "";
    for (const part of address.split("・")) {
      const trimmed = part.replace(prefix, "").trim();
      if (!trimmed) continue;
      const result = await geocodeOnce(prefix ? `${prefix} ${trimmed}` : trimmed);
      if (result) return result;
    }
  }

  return null;
}
