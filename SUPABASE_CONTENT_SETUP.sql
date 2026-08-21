-- ============================================================
-- SancStudy Content Platform: Members / Updates / Articles
-- 実行場所: Supabase Dashboard > SQL Editor
--
-- セキュリティ方針:
--   * anon / authenticated は「公開済みデータのSELECT」のみ可能
--   * INSERT / UPDATE / DELETE ポリシーを作成しないため、匿名書換えは不可
--   * 管理者の登録・編集は Supabase Dashboard（postgresロール）で実施
--   * service_role / secret key / DBパスワードをフロントエンドに置かない
-- ============================================================

begin;

-- UUIDを使用するための拡張（Supabaseでは通常有効ですが安全に再宣言します）
create extension if not exists pgcrypto;

-- updated_at を自動更新する共通トリガー関数
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ============================================================
-- 1. 運営メンバー
-- ============================================================
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  avatar_url text
    check (avatar_url is null or avatar_url ~ '^https://[^[:space:]]+$'),
  role_title text not null default '' check (char_length(role_title) <= 100),
  bio text not null default '' check (char_length(bio) <= 1200),
  started_on date,
  profile_url text
    check (profile_url is null or profile_url ~ '^https://[^[:space:]]+$'),
  sort_order integer not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 一人に複数のバッジを付与可能。色はフロントエンド側の固定CSSで決定します。
create table if not exists public.member_badges (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  badge_key text not null
    check (badge_key in ('developer', 'writer', 'supporter')),
  label text not null check (char_length(label) between 1 and 30),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (member_id, badge_key)
);

-- ============================================================
-- 2. ゲーム・ツールと制作者の紐付け
-- ============================================================
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  content_type text not null check (content_type in ('game', 'tool')),
  author_member_id uuid not null references public.members(id) on delete restrict,
  destination_url text not null check (destination_url ~ '^https://[^[:space:]]+$'),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ============================================================
-- 3. 更新情報
-- ============================================================
create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('game', 'tool', 'site')),
  title text not null check (char_length(title) between 1 and 160),
  summary text not null check (char_length(summary) between 1 and 1000),
  related_content_id uuid references public.content_items(id) on delete set null,
  author_member_id uuid references public.members(id) on delete set null,
  published_at timestamptz not null default timezone('utc', now()),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ============================================================
-- 4. 記事メタデータ
-- 本文はGitHub Pages上の articles/<slug>.html として管理します。
-- ============================================================
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 160),
  excerpt text not null check (char_length(excerpt) between 1 and 500),
  category text not null check (char_length(category) between 1 and 50),
  cover_image_url text
    check (cover_image_url is null or cover_image_url ~ '^https://[^[:space:]]+$'),
  author_member_id uuid not null references public.members(id) on delete restrict,
  published_at timestamptz not null default timezone('utc', now()),
  html_path text not null unique
    check (html_path ~ '^articles/[a-z0-9]+(?:-[a-z0-9]+)*\.html$'),
  is_published boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ============================================================
-- 5. サイト基本情報・沿革
-- ============================================================
create table if not exists public.site_settings (
  setting_key text primary key
    check (setting_key in ('site_started_on', 'mission', 'last_updated_note')),
  setting_value text not null check (char_length(setting_value) <= 2000),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_history (
  id uuid primary key default gen_random_uuid(),
  occurred_on date,
  title text not null check (char_length(title) between 1 and 160),
  summary text not null check (char_length(summary) between 1 and 1000),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ============================================================
-- 6. 更新日時トリガー
-- ============================================================
drop trigger if exists members_set_updated_at on public.members;
create trigger members_set_updated_at
before update on public.members
for each row execute function public.set_updated_at();

drop trigger if exists content_items_set_updated_at on public.content_items;
create trigger content_items_set_updated_at
before update on public.content_items
for each row execute function public.set_updated_at();

drop trigger if exists updates_set_updated_at on public.updates;
create trigger updates_set_updated_at
before update on public.updates
for each row execute function public.set_updated_at();

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists site_history_set_updated_at on public.site_history;
create trigger site_history_set_updated_at
before update on public.site_history
for each row execute function public.set_updated_at();

-- ============================================================
-- 7. インデックス
-- ============================================================
create index if not exists members_public_order_idx
  on public.members (is_active, sort_order, name);
create index if not exists member_badges_member_order_idx
  on public.member_badges (member_id, sort_order);
create index if not exists content_items_public_order_idx
  on public.content_items (is_published, sort_order, name);
create index if not exists updates_public_order_idx
  on public.updates (is_published, published_at desc, sort_order);
create index if not exists updates_category_public_order_idx
  on public.updates (category, is_published, published_at desc);
create index if not exists articles_public_order_idx
  on public.articles (is_published, featured desc, published_at desc);
create index if not exists site_history_public_order_idx
  on public.site_history (is_published, occurred_on desc, sort_order);

-- ============================================================
-- 8. RLS
-- 匿名ユーザーには公開済みデータの閲覧だけを許可します。
-- INSERT / UPDATE / DELETE ポリシーは作成しません。
-- ============================================================
alter table public.members enable row level security;
alter table public.member_badges enable row level security;
alter table public.content_items enable row level security;
alter table public.updates enable row level security;
alter table public.articles enable row level security;
alter table public.site_settings enable row level security;
alter table public.site_history enable row level security;

drop policy if exists "public_read_active_members" on public.members;
create policy "public_read_active_members"
on public.members for select
to anon, authenticated
using (is_active = true);

drop policy if exists "public_read_badges_for_active_members" on public.member_badges;
create policy "public_read_badges_for_active_members"
on public.member_badges for select
to anon, authenticated
using (
  exists (
    select 1 from public.members m
    where m.id = member_badges.member_id
      and m.is_active = true
  )
);

drop policy if exists "public_read_published_content_items" on public.content_items;
create policy "public_read_published_content_items"
on public.content_items for select
to anon, authenticated
using (
  is_published = true
  and exists (
    select 1 from public.members m
    where m.id = content_items.author_member_id
      and m.is_active = true
  )
);

drop policy if exists "public_read_published_updates" on public.updates;
create policy "public_read_published_updates"
on public.updates for select
to anon, authenticated
using (is_published = true);

drop policy if exists "public_read_published_articles" on public.articles;
create policy "public_read_published_articles"
on public.articles for select
to anon, authenticated
using (
  is_published = true
  and exists (
    select 1 from public.members m
    where m.id = articles.author_member_id
      and m.is_active = true
  )
);

drop policy if exists "public_read_site_settings" on public.site_settings;
create policy "public_read_site_settings"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "public_read_published_history" on public.site_history;
create policy "public_read_published_history"
on public.site_history for select
to anon, authenticated
using (is_published = true);

-- ============================================================
-- 9. 任意: メンバー画像用の公開読み取りバケット
-- Dashboard（管理者）からのみアップロードしてください。
-- anon向けのINSERT / UPDATE / DELETEポリシーは作成しません。
-- ============================================================
insert into storage.buckets (id, name, public)
values ('member-avatars', 'member-avatars', true)
on conflict (id) do update set public = excluded.public;

commit;

-- ============================================================
-- 初期データ例（実データ・アイコンURL・紹介文・開始年月を確認後に実行）
-- 下記はコメントアウトしており、上のSQL実行では登録されません。
-- ============================================================
-- insert into public.members
--   (slug, name, avatar_url, role_title, bio, started_on, sort_order, is_active)
-- values
--   ('hourai-carrot', 'hourai-carrot', 'https://YOUR-PUBLIC-IMAGE-URL', 'ゲーム開発', '紹介文を入力してください。', '2025-04-01', 1, true),
--   ('beeeeach', 'beeeeach', 'https://YOUR-PUBLIC-IMAGE-URL', 'ゲーム・ツール開発', '紹介文を入力してください。', '2025-04-01', 2, true)
-- on conflict (slug) do update set
--   name = excluded.name,
--   avatar_url = excluded.avatar_url,
--   role_title = excluded.role_title,
--   bio = excluded.bio,
--   started_on = excluded.started_on,
--   sort_order = excluded.sort_order,
--   is_active = excluded.is_active;
--
-- insert into public.member_badges (member_id, badge_key, label, sort_order)
-- select id, 'developer', '開発者', 1
-- from public.members where slug in ('hourai-carrot', 'beeeeach')
-- on conflict (member_id, badge_key) do update set label = excluded.label, sort_order = excluded.sort_order;
--
-- insert into public.content_items
--   (slug, name, content_type, author_member_id, destination_url, is_published, sort_order)
-- values
--   ('kanji-war', '漢字大戦 KANJI WAR', 'game', (select id from public.members where slug = 'hourai-carrot'), 'https://hourai-carrot.github.io/KANJI-WAR/', true, 1),
--   ('leap-over-quest', 'LEAP OVER QUEST', 'game', (select id from public.members where slug = 'hourai-carrot'), 'https://hourai-carrot.github.io/LEAP-OVER-QUEST/', true, 2),
--   ('prime-striker', 'Prime Striker', 'game', (select id from public.members where slug = 'beeeeach'), 'https://beeeeach.github.io/Prime-Striker/', true, 3),
--   ('homework-manager', '宿題マネージャー', 'tool', (select id from public.members where slug = 'beeeeach'), 'https://homework-manager-azure.vercel.app/', true, 4)
-- on conflict (slug) do update set
--   name = excluded.name,
--   content_type = excluded.content_type,
--   author_member_id = excluded.author_member_id,
--   destination_url = excluded.destination_url,
--   is_published = excluded.is_published,
--   sort_order = excluded.sort_order;

-- 実行後の匿名ロール確認例（SQL Editor上で確認する場合）:
-- set local role anon;
-- select slug, name from public.members;
-- select slug, title from public.articles;
-- reset role;
--
-- 注意: 上記のset role確認はSQL Editorの実行ロールや権限設定により実行できない場合があります。
-- サイトから publishable key を使って確認する方法も必ず併用してください。
