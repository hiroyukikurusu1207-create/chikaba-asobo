import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const mplusRounded = M_PLUS_Rounded_1c({
  variable: "--font-mplus-rounded",
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ちかばであそぼーよ＠江戸川区周辺",
  description: "自宅からの移動時間で探せる、フェス・祭り・文化イベントのお散歩アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${mplusRounded.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
