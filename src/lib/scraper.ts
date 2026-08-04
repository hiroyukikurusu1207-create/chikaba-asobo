import { geocodeAddress } from "@/lib/geocodeClient";

const BASE = "https://www.city.edogawa.tokyo.jp";

// 江戸川区イベントカレンダーの絞り込みジャンルID（フォーム送信結果から確認済み）
const TARGET_GENRES: Record<string, number> = {
  "お祭り": 2,
  "文化・芸術": 4,
};

export type ScrapedEvent = {
  title: string;
  genre: string[];
  startDate: string;
  endDate: string | null;
  venueName: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  sourceUrl: string;
};

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function extractAfterHeading(html: string, label: string): string | null {
  const idx = html.indexOf(`<h2>${label}</h2>`);
  if (idx === -1) return null;
  const rest = html.slice(idx + `<h2>${label}</h2>`.length);
  const match = rest.match(/^\s*(?:<ul>([\s\S]*?)<\/ul>|<p[^>]*>([\s\S]*?)<\/p>)/);
  if (!match) return null;
  return stripTags(match[1] ?? match[2] ?? "");
}

function parseDateRange(text: string | null): { start: string | null; end: string | null } {
  if (!text) return { start: null, end: null };
  const matches = [...text.matchAll(/(\d{4})年(\d{1,2})月(\d{1,2})日/g)].map(
    ([, y, m, d]) => `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`,
  );
  if (matches.length === 0) return { start: null, end: null };
  const start = matches[0];
  const end = matches[1] && matches[1] !== start ? matches[1] : null;
  return { start, end };
}

async function fetchEventLinksForMonth(
  year: number,
  month: number,
  categoryId: number,
): Promise<string[]> {
  const url = `${BASE}/cgi-bin/event_cal_multi/calendar.cgi?type=2&year=${year}&month=${month}&event_category=${categoryId}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const html = await res.text();

  const listStart = html.indexOf('class="event_cal_list"');
  const relevant = listStart >= 0 ? html.slice(listStart) : html;

  const hrefs = new Set<string>();
  for (const m of relevant.matchAll(/href="(\/event\/[^"]+\.html)"/g)) {
    hrefs.add(BASE + m[1]);
  }
  return [...hrefs];
}

async function fetchEventDetail(url: string, genre: string): Promise<ScrapedEvent | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const html = await res.text();

  const titleMatch = html.match(/<h1>([\s\S]*?)<\/h1>/);
  const title = titleMatch ? stripTags(titleMatch[1]) : null;
  if (!title) return null;

  const { start, end } = parseDateRange(extractAfterHeading(html, "開催日時"));
  if (!start) return null;

  const venueName = extractAfterHeading(html, "場所");
  const address = extractAfterHeading(html, "住所");

  let lat: number | null = null;
  let lng: number | null = null;
  if (address) {
    const geocoded = await geocodeAddress(address);
    if (geocoded) {
      lat = geocoded.lat;
      lng = geocoded.lng;
    }
  }

  return {
    title,
    genre: [genre],
    startDate: start,
    endDate: end,
    venueName,
    address,
    lat,
    lng,
    sourceUrl: url,
  };
}

// 今月から monthsAhead ヶ月分、対象ジャンルのイベントを取り込む
export async function scrapeEdogawaEvents(monthsAhead = 3): Promise<ScrapedEvent[]> {
  const now = new Date();
  const months: Array<{ year: number; month: number }> = [];
  for (let i = 0; i < monthsAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  // URL -> 見つかったジャンル名の集合
  const urlToGenres = new Map<string, Set<string>>();

  for (const [genreName, categoryId] of Object.entries(TARGET_GENRES)) {
    for (const { year, month } of months) {
      const links = await fetchEventLinksForMonth(year, month, categoryId);
      for (const link of links) {
        if (!urlToGenres.has(link)) urlToGenres.set(link, new Set());
        urlToGenres.get(link)!.add(genreName);
      }
    }
  }

  const results: ScrapedEvent[] = [];
  for (const [url, genres] of urlToGenres) {
    const primaryGenre = [...genres][0];
    const detail = await fetchEventDetail(url, primaryGenre);
    if (!detail) continue;
    detail.genre = [...genres];
    results.push(detail);
  }

  return results;
}
