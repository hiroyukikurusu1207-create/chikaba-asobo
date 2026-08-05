import { geocodeAddress } from "@/lib/geocodeClient";

// event_cal_multi/calendar.cgi という同一システムを使う自治体サイト。
// ジャンルのカテゴリID・ラベルは自治体ごとに全く異なる体系なので、
// ソースごとに個別に調査して設定する（共通化できるのはURL構造のみ）。
type GenreCategory = { id: number; label: string };

type MunicipalitySource = {
  id: string;
  baseUrl: string;
  genres: GenreCategory[];
};

const SOURCES: MunicipalitySource[] = [
  {
    id: "edogawa_official",
    baseUrl: "https://www.city.edogawa.tokyo.jp",
    genres: [
      { id: 2, label: "お祭り" },
      { id: 4, label: "文化・芸術" },
    ],
  },
  {
    id: "koto_official",
    baseUrl: "https://www.city.koto.lg.jp",
    genres: [{ id: 5, label: "文化・観光" }],
  },
];

export type ScrapedEvent = {
  title: string;
  genre: string[];
  startDate: string;
  endDate: string | null;
  venueName: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  targetAge: string | null;
  eventTime: string | null;
  cost: string | null;
  source: string;
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

function extractAfterHeading(html: string, labels: string[]): string | null {
  for (const label of labels) {
    const idx = html.indexOf(`<h2>${label}</h2>`);
    if (idx === -1) continue;
    const rest = html.slice(idx + `<h2>${label}</h2>`.length);
    const match = rest.match(/^\s*(?:<ul>([\s\S]*?)<\/ul>|<p[^>]*>([\s\S]*?)<\/p>)/);
    if (match) return stripTags(match[1] ?? match[2] ?? "");
  }
  return null;
}

// 「開催日時」欄は日付の<ul>の直後に時間帯の詳細が<p>で続くことがあるため、
// それを「開催時間」として別途抽出する（<ul>単体、または<ul>が無い場合は取得しない）
function extractEventTimeDetail(html: string, labels: string[]): string | null {
  for (const label of labels) {
    const idx = html.indexOf(`<h2>${label}</h2>`);
    if (idx === -1) continue;
    const rest = html.slice(idx + `<h2>${label}</h2>`.length);
    const match = rest.match(/^\s*<ul>[\s\S]*?<\/ul>\s*<p[^>]*>([\s\S]*?)<\/p>/);
    if (match) return stripTags(match[1]);
  }
  return null;
}

// 「費用」欄は「有料」とだけ書かれた<p>の直後に、具体的な金額を書いた
// <p>が続くことがあるため、両方を連結して取得する
function extractCostDetail(html: string): string | null {
  const idx = html.indexOf(`<h2>費用</h2>`);
  if (idx === -1) return null;
  const rest = html.slice(idx + `<h2>費用</h2>`.length);
  const match = rest.match(/^\s*<p[^>]*>([\s\S]*?)<\/p>\s*(?:<p[^>]*>([\s\S]*?)<\/p>)?/);
  if (!match) return null;
  const summary = stripTags(match[1] ?? "");
  const detail = match[2] ? stripTags(match[2]) : null;
  return detail ? `${summary} ${detail}` : summary;
}

// 「住所」見出しが無いサイトでは「場所」欄の文中に「住所：〜」という形で
// 埋め込まれていることがあるため、そこからも抽出を試みる
function extractAddress(html: string, venueText: string | null): string | null {
  const dedicated = extractAfterHeading(html, ["住所"]);
  if (dedicated) return dedicated;

  if (venueText) {
    const inline = venueText.match(/住所[:：]\s*(.+)/);
    if (inline) return inline[1].trim();
  }
  return null;
}

// 自治体側の「文化・芸術」「文化・観光」区分は大雑把すぎるため、
// タイトル・会場名のキーワードでさらに細かいジャンルに振り分ける
const BROAD_CULTURE_GENRES = new Set(["文化・芸術", "文化・観光"]);
const CULTURE_SUBGENRES: { pattern: RegExp; label: string }[] = [
  { pattern: /寄席|落語|川柳|講談|独演会|二人会|ひとり会|圓藏亭/, label: "寄席・演芸" },
  { pattern: /コンサート|音楽|ピアノ|オーケストラ|吹奏楽/, label: "音楽" },
  { pattern: /教室|講座|体験/, label: "教室・体験" },
  { pattern: /写真展|美術|絵画|工芸|デザイン|展示/, label: "展示・アート" },
];

function refineGenres(title: string, venueName: string | null, rawGenres: string[]): string[] {
  const text = `${title} ${venueName ?? ""}`;
  return rawGenres.map((g) => {
    if (!BROAD_CULTURE_GENRES.has(g)) return g;
    const match = CULTURE_SUBGENRES.find((c) => c.pattern.test(text));
    return match ? match.label : g;
  });
}

function parseDateRange(text: string | null): { start: string | null; end: string | null } {
  if (!text) return { start: null, end: null };
  const matches = [...text.matchAll(/(\d{4})年(\d{1,2})月(\d{1,2})日/g)].map(
    ([, y, m, d]) => `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`,
  );
  if (matches.length === 0) return { start: null, end: null };
  const start = matches[0];
  const last = matches[matches.length - 1];
  const end = last !== start ? last : null;
  return { start, end };
}

async function fetchEventLinksForMonth(
  baseUrl: string,
  year: number,
  month: number,
  categoryId: number,
): Promise<string[]> {
  const url = `${baseUrl}/cgi-bin/event_cal_multi/calendar.cgi?type=2&year=${year}&month=${month}&event_category=${categoryId}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const html = await res.text();

  const listStart = html.indexOf('class="event_cal_list"');
  const relevant = listStart >= 0 ? html.slice(listStart) : html;

  const hrefs = new Set<string>();
  for (const m of relevant.matchAll(/href="([^"]*\/event\/[^"]+\.html)"/g)) {
    const path = m[1];
    hrefs.add(path.startsWith("http") ? path : baseUrl + path);
  }
  return [...hrefs];
}

async function fetchEventDetail(
  url: string,
  genre: string,
  sourceId: string,
): Promise<ScrapedEvent | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const html = await res.text();

  const titleMatch = html.match(/<h1>([\s\S]*?)<\/h1>/);
  const title = titleMatch ? stripTags(titleMatch[1]) : null;
  if (!title) return null;

  const dateLabels = ["開催日時", "日時"];
  const { start, end } = parseDateRange(extractAfterHeading(html, dateLabels));
  if (!start) return null;

  const eventTime = extractEventTimeDetail(html, dateLabels);
  const targetAge = extractAfterHeading(html, ["対象", "対象・定員", "対象者"]);
  const cost = extractCostDetail(html);
  const venueName = extractAfterHeading(html, ["場所"]);
  const address = extractAddress(html, venueName);

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
    targetAge,
    eventTime,
    cost,
    source: sourceId,
    sourceUrl: url,
  };
}

// 今月から monthsAhead ヶ月分、設定済みの自治体ソース・対象ジャンルのイベントを取り込む
export async function scrapeMunicipalityEvents(monthsAhead = 3): Promise<ScrapedEvent[]> {
  const now = new Date();
  const months: Array<{ year: number; month: number }> = [];
  for (let i = 0; i < monthsAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const results: ScrapedEvent[] = [];

  for (const source of SOURCES) {
    // URL -> 見つかったジャンル名の集合
    const urlToGenres = new Map<string, Set<string>>();

    for (const { id: categoryId, label: genreName } of source.genres) {
      for (const { year, month } of months) {
        const links = await fetchEventLinksForMonth(source.baseUrl, year, month, categoryId);
        for (const link of links) {
          if (!urlToGenres.has(link)) urlToGenres.set(link, new Set());
          urlToGenres.get(link)!.add(genreName);
        }
      }
    }

    for (const [url, genres] of urlToGenres) {
      const primaryGenre = [...genres][0];
      const detail = await fetchEventDetail(url, primaryGenre, source.id);
      if (!detail) continue;
      detail.genre = refineGenres(detail.title, detail.venueName, [...genres]);
      results.push(detail);
    }
  }

  return results;
}
