import { createBrowserClient } from "@supabase/ssr";

// eventsテーブルのみを扱う小規模アプリのため、Supabaseの型生成は行わず
// 呼び出し側で src/lib/types.ts の EventRow にキャストして使う。
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
