import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// イベントは公開データで認証を使わないため cookie 連携は不要。
// 読み取りは anon key、/api/sync など書き込みが必要な箇所は service role key を使う。
export function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
