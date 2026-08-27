import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const mplusRounded = M_PLUS_Rounded_1c({
  variable: "--font-mplus-rounded",
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chikaba-asobo.vercel.app"),
  title: "ちかばであそぼーよ＠江戸川区周辺",
  description:
    "江戸川区周辺のお祭り・盆踊り・文化イベント・子育て向けイベントを、自宅からの移動時間で探せる無料の散歩アプリ。徒歩・自転車・バス・車・電車の所要時間で絞り込めます。",
  keywords: [
    "江戸川区",
    "イベント",
    "お祭り",
    "盆踊り",
    "子育て",
    "地域情報",
  ],
  openGraph: {
    title: "ちかばであそぼーよ＠江戸川区周辺",
    description:
      "江戸川区周辺のお祭り・盆踊り・文化イベント・子育て向けイベントを、自宅からの移動時間で探せる無料の散歩アプリ。",
    url: "https://chikaba-asobo.vercel.app",
    siteName: "ちかばであそぼーよ",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ちかばであそぼーよ＠江戸川区周辺",
    description:
      "江戸川区周辺のお祭り・盆踊り・文化イベント・子育て向けイベントを、自宅からの移動時間で探せる無料の散歩アプリ。",
  },
  verification: {
    google: "_-oNP9LsVTi0_POus0LJW8MOV6KWbaOoWKuu6VIytps",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${mplusRounded.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
