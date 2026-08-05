-- ちかばであそぼーよ スキーマ定義
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容を実行してください。

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  genre text[] not null default '{}',
  start_date date not null,
  end_date date,
  venue_name text,
  address text,
  lat double precision,
  lng double precision,
  description text,
  target_age text,
  event_time text,
  source text not null default 'manual',
  source_url text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_start_date_idx on public.events (start_date);
create index if not exists events_lat_lng_idx on public.events (lat, lng);

alter table public.events enable row level security;

-- 誰でも閲覧可能（公開イベント情報のため）
create policy "events_select_anon" on public.events
  for select using (true);

-- insert/update/delete はポリシーを作らない = anon/authenticatedキーからは常に拒否。
-- サーバー側の service role key のみが書き込み可能（RLSをバイパスする）。

-- ==============================
-- マイグレーション: 対象年齢・開催時間の追加
-- 既にテーブルを作成済みの場合は、この2行だけをSQL Editorで実行してください。
-- ==============================
alter table public.events add column if not exists target_age text;
alter table public.events add column if not exists event_time text;
