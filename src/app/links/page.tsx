import Link from "next/link";

const SOURCE_GROUPS = [
  {
    category: "区公式・図書館",
    sources: [
      {
        name: "江戸川区 公式サイト",
        note: "イベントカレンダー・各地区の盆踊り情報",
        url: "https://www.city.edogawa.tokyo.jp/",
      },
      {
        name: "江戸川区立図書館",
        note: "おはなし会・講座などのイベント情報",
        url: "https://www.library.city.edogawa.tokyo.jp/",
      },
    ],
  },
  {
    category: "スポーツ施設",
    sources: [
      {
        name: "江戸川区総合体育館",
        note: "スポーツ教室・大会情報",
        url: "https://www.edogawa-sotai.com/",
      },
      {
        name: "江戸川区スポーツセンター",
        note: "スポーツ教室情報",
        url: "https://www.edogawa-spocen.com/",
      },
    ],
  },
  {
    category: "文化・催事施設",
    sources: [
      {
        name: "船堀タワーホール",
        note: "催事・講座情報",
        url: "https://www.towerhall.jp/",
      },
      {
        name: "グリーンパレス",
        note: "催事情報",
        url: "https://www.green-palace.jp/",
      },
    ],
  },
  {
    category: "子育て支援",
    sources: [
      {
        name: "共育プラザ中央（子育てひろば）",
        note: "子育て・中高生向けイベント情報",
        url: "https://mommy-chuou.com/news/",
      },
      {
        name: "江戸川区発達相談・支援センター",
        note: "研修会・講座情報",
        url: "https://edo-hssc.jp/",
      },
    ],
  },
  {
    category: "博物館・企画展",
    sources: [
      {
        name: "地下鉄博物館",
        note: "館内イベント・スタンプラリー情報",
        url: "https://www.chikahaku.jp/event/",
      },
      {
        name: "魔法の文学館（江戸川区角野栄子児童文学館）",
        note: "企画展情報",
        url: "https://kikismuseum.jp/gallery/",
      },
    ],
  },
  {
    category: "公園・水辺",
    sources: [
      {
        name: "葛西臨海水族園",
        note: "イベントカレンダー",
        url: "https://www.tokyo-zoo.net/kasai/events/index.html",
      },
      {
        name: "葛西海浜公園",
        note: "イベント情報",
        url: "https://kasaikaihinpark.com/event/",
      },
    ],
  },
  {
    category: "地域・商業施設",
    sources: [
      {
        name: "新小岩まちガイド",
        note: "新小岩周辺のイベント情報",
        url: "https://shinkoi-one-guide.com/",
      },
      {
        name: "カメイドクロック",
        note: "館内イベント情報（お祭り等のみ）",
        url: "https://www.kameidoclock.jp/event/",
      },
    ],
  },
];

export default function LinksPage() {
  return (
    <main className="flex-1 mx-auto w-full max-w-lg px-4 py-6 flex flex-col gap-5">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold">情報源リンク集</h1>
        <Link href="/" className="text-xs text-muted hover:text-foreground hover:underline">
          一覧へ戻る
        </Link>
      </header>
      <p className="text-sm text-muted leading-relaxed">
        このアプリのイベント情報は、以下の公式サイトの情報を参考に登録しています。詳しい内容は各サイトでご確認ください。
      </p>
      {SOURCE_GROUPS.map((group) => (
        <section key={group.category} className="flex flex-col gap-2">
          <h2 className="text-sm font-bold text-muted">{group.category}</h2>
          <ul className="flex flex-col gap-3">
            {group.sources.map((s) => (
              <li
                key={s.url}
                className="rounded-2xl bg-card border border-card-border shadow-sm p-4 flex flex-col gap-1"
              >
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold hover:underline"
                >
                  {s.name}
                </a>
                <p className="text-sm text-muted">{s.note}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="rounded-2xl bg-card border border-card-border shadow-sm p-4 flex flex-col gap-1">
        <p className="text-sm font-bold">お問い合わせ</p>
        <p className="text-sm text-muted leading-relaxed">
          要望（リンク集への追加）、質問などは気軽に下記メール先にて
        </p>
        <a
          href="mailto:edogawa.asoboyo@gmail.com"
          className="font-bold hover:underline"
        >
          edogawa.asoboyo@gmail.com
        </a>
      </section>
    </main>
  );
}
