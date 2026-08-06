// リンクを貼るだけでイベント情報を仮入力する汎用インポーター（無料）。
// サイトごとの構造に依存しないよう、ページのテキストからラベル・日付パターンを
// 正規表現で拾う。精度は自治体公式カレンダー専用のscraper.tsより落ちるため、
// 取り込み結果は必ず人が確認してから保存する前提の「仮入力」機能として使う。

export type UrlImportResult = {
  title: string | null;
  genre: string | null;
  startDate: string | null;
  endDate: string | null;
  venueName: string | null;
  address: string | null;
  eventTime: string | null;
  targetAge: string | null;
  cost: string | null;
};

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function extractTitle(html: string): string | null {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) {
    const t = stripTags(h1[1]).split("\n")[0].trim();
    if (t) return t;
  }
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (ogTitle) return ogTitle[1].trim();
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleTag) return stripTags(titleTag[1]).trim();
  return null;
}

function afterLabel(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const re = new RegExp(`${label}[：:\\s]+([^\\n]{1,80})`);
    const m = text.match(re);
    if (m) {
      const v = m[1].trim();
      if (v) return v;
    }
  }
  return null;
}

// 「更新日：2026年6月27日」のようなページ管理用の日付はイベント開催日ではないため、
// 日付抽出の対象から除外する
function stripMetaDates(text: string): string {
  return text.replace(
    /(?:更新日|作成日|公開日|掲載日|最終更新日?)[：:]?\s*\d{4}[年\-/]\d{1,2}[月\-/]\d{1,2}日?/g,
    "",
  );
}

// 「開催日時」等の見出しの直後にある日付を優先的に使う。見出しが見つからない場合のみ
// ページ全体から日付らしきものを拾う（更新日等のノイズを含みうるためフォールバック扱い）
function extractDateSection(text: string): string | null {
  const labels = ["開催日時", "開催期間", "開催日", "日時"];
  for (const label of labels) {
    const idx = text.indexOf(label);
    if (idx === -1) continue;
    return text.slice(idx, idx + 200);
  }
  return null;
}

function extractDateRange(text: string): { start: string | null; end: string | null } {
  const withYear = [...text.matchAll(/(\d{4})[年\-/](\d{1,2})[月\-/](\d{1,2})日?/g)].map(
    ([, y, m, d]) => `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`,
  );
  if (withYear.length > 0) {
    const start = withYear[0];
    const end = withYear[withYear.length - 1];
    return { start, end: end !== start ? end : null };
  }

  // 年の記載がない「MM月DD日」形式は今年の日付とみなし、
  // すでに過去日なら来年の開催と判断する
  const noYear = [...text.matchAll(/(\d{1,2})月(\d{1,2})日/g)];
  if (noYear.length === 0) return { start: null, end: null };

  const today = new Date();
  const toIso = (m: string, d: string) => {
    const mm = Number(m);
    const dd = Number(d);
    let year = today.getFullYear();
    const candidate = new Date(year, mm - 1, dd);
    if (candidate.getTime() < today.getTime() - 24 * 60 * 60 * 1000) year += 1;
    return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  };
  const dates = noYear.map(([, m, d]) => toIso(m, d));
  const start = dates[0];
  const end = dates[dates.length - 1];
  return { start, end: end !== start ? end : null };
}

function extractTime(text: string): string | null {
  const hm = text.match(/(\d{1,2}:\d{2})\s*[~〜\-−]\s*(\d{1,2}:\d{2})/);
  if (hm) return `${hm[1]}〜${hm[2]}`;
  const kanji = text.match(/(\d{1,2})時(\d{1,2})?分?\s*(?:~|〜|から)\s*(\d{1,2})時(\d{1,2})?分?/);
  if (kanji) return kanji[0];
  return null;
}

function extractCost(text: string): string | null {
  if (/無料/.test(text)) return "無料";
  const labeled = afterLabel(text, ["参加費", "費用", "料金", "入場料"]);
  if (labeled) return labeled;
  const yen = text.match(/[\d,]+円/);
  return yen ? yen[0] : null;
}

// ページ全体から住所らしき文字列を拾うと、市区町村サイトのフッターにある
// 庁舎所在地などノイズを誤って拾ってしまうため、明示的な「住所」欄からのみ抽出する
function extractAddress(text: string): string | null {
  const labeled = afterLabel(text, ["住所"]);
  if (labeled) return labeled;
  const venue = afterLabel(text, ["会場", "場所", "開催場所"]);
  if (venue) {
    const inline = venue.match(/住所[:：]\s*(.+)/);
    if (inline) return inline[1].trim();
  }
  return null;
}

const GENRE_KEYWORDS: { pattern: RegExp; label: string }[] = [
  { pattern: /盆踊り|夏祭り|納涼祭|お祭り/, label: "お祭り" },
  { pattern: /ワークショップ/, label: "ワークショップ" },
  { pattern: /映画|シネマ|上映会/, label: "映画会" },
  { pattern: /コンサート|演奏会/, label: "演奏会（コンサート）" },
  { pattern: /音楽|ピアノ|吹奏楽|オーケストラ/, label: "音楽" },
  { pattern: /寄席|落語|講談|川柳/, label: "寄席・演芸" },
  { pattern: /工作/, label: "工作会" },
  { pattern: /講座|セミナー/, label: "講座" },
  { pattern: /展示|美術|写真展|絵画/, label: "展示・アート" },
  { pattern: /教室|体験|講習/, label: "教室・体験" },
];

export function guessGenre(title: string): string | null {
  const match = GENRE_KEYWORDS.find((g) => g.pattern.test(title));
  return match ? match.label : null;
}

export async function extractEventFromUrl(url: string): Promise<UrlImportResult> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ページの取得に失敗しました (status ${res.status})`);
  const html = await res.text();
  const text = stripMetaDates(stripTags(html));

  const title = extractTitle(html);
  const { start, end } = extractDateRange(extractDateSection(text) ?? text);
  const venueName = afterLabel(text, ["会場", "場所", "開催場所"]);

  return {
    title,
    genre: title ? guessGenre(title) : null,
    startDate: start,
    endDate: end,
    venueName,
    address: extractAddress(text),
    eventTime: extractTime(text),
    targetAge: afterLabel(text, ["対象年齢", "対象者", "対象"]),
    cost: extractCost(text),
  };
}
