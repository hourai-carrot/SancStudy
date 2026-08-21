-- ============================================================
-- SancStudy 初期公開データ（メンバー・バッジ・コンテンツ）
-- 実行場所: Supabase Dashboard > SQL Editor
--
-- 実行前に確認してください:
-- 1. avatar_url は未設定です。画像をアップロード後、Table Editor で追加できます。
-- 2. bio、role_title、started_on は公開前に自由に変更してください。
-- 3. このSQLは既存レコードを slug / setting_key 単位で更新します。
-- ============================================================

begin;

-- 1. 公開メンバー
insert into public.members
  (slug, name, avatar_url, role_title, bio, started_on, sort_order, is_active)
values
  (
    'hourai-carrot',
    'hourai-carrot',
    null,
    'ゲーム開発',
    '漢字大戦 KANJI WARとLEAP OVER QUESTの開発を担当しています。楽しさと学びが両立するゲーム体験を目指しています。',
    null,
    1,
    true
  ),
  (
    'beeeeach',
    'beeeeach',
    null,
    'ゲーム・ツール開発',
    'Prime Strikerと宿題マネージャーの開発を担当しています。学習を毎日の習慣にしやすい体験を考えています。',
    null,
    2,
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  role_title = excluded.role_title,
  bio = excluded.bio,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- 2. 役割バッジ（必要ならTable Editorからwriter/supporterを追加できます）
insert into public.member_badges (member_id, badge_key, label, sort_order)
select id, 'developer', '開発者', 1
from public.members
where slug in ('hourai-carrot', 'beeeeach')
on conflict (member_id, badge_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;

-- 3. 制作者とコンテンツの紐付け
insert into public.content_items
  (slug, name, content_type, author_member_id, destination_url, is_published, sort_order)
values
  (
    'kanji-war',
    '漢字大戦 KANJI WAR',
    'game',
    (select id from public.members where slug = 'hourai-carrot'),
    'https://hourai-carrot.github.io/KANJI-WAR/',
    true,
    1
  ),
  (
    'leap-over-quest',
    'LEAP OVER QUEST',
    'game',
    (select id from public.members where slug = 'hourai-carrot'),
    'https://hourai-carrot.github.io/LEAP-OVER-QUEST/',
    true,
    2
  ),
  (
    'prime-striker',
    'Prime Striker',
    'game',
    (select id from public.members where slug = 'beeeeach'),
    'https://beeeeach.github.io/Prime-Striker/',
    true,
    3
  ),
  (
    'homework-manager',
    '宿題マネージャー',
    'tool',
    (select id from public.members where slug = 'beeeeach'),
    'https://homework-manager-azure.vercel.app/',
    true,
    4
  )
on conflict (slug) do update set
  name = excluded.name,
  content_type = excluded.content_type,
  author_member_id = excluded.author_member_id,
  destination_url = excluded.destination_url,
  is_published = excluded.is_published,
  sort_order = excluded.sort_order;

-- 4. サイト基本情報
insert into public.site_settings (setting_key, setting_value)
values
  ('site_started_on', '2025年4月'),
  ('mission', '私たちは、学習とエンターテインメントの境界をなくすことで、すべての学生が自発的に学べる環境を作りたいと考えています。'),
  ('last_updated_note', '運営情報・記事・更新情報は公開データから表示しています。')
on conflict (setting_key) do update set setting_value = excluded.setting_value;

-- 5. 沿革の初期表示（不要であれば is_published を false に変更してください）
insert into public.site_history (occurred_on, title, summary, is_published, sort_order)
select
  date '2025-04-01',
  'SancStudy 運営開始',
  '中高生が楽しみながら学べるゲーム・ツールのポータルとして運営を開始しました。',
  true,
  1
where not exists (
  select 1 from public.site_history where title = 'SancStudy 運営開始'
);

-- 6. 動作確認用の更新情報（内容は公開前に自由に編集してください）
insert into public.updates
  (category, title, summary, author_member_id, published_at, is_published, sort_order)
select
  'site',
  '運営情報・記事機能を準備しました',
  'SancStudyの運営メンバー、制作者プロフィール、記事、更新情報を公開データから管理できる仕組みを準備しました。',
  id,
  timezone('utc', now()),
  true,
  1
from public.members
where slug = 'hourai-carrot'
and not exists (
  select 1 from public.updates where title = '運営情報・記事機能を準備しました'
);

commit;

-- 記事のテストデータは、`articles/sample-article.html` をGitHub Pagesへ公開してから、
-- 下記の例を必要に応じて実行してください。
--
-- insert into public.articles
--   (slug, title, excerpt, category, author_member_id, published_at, html_path, is_published, featured)
-- values
--   (
--     'sample-article',
--     'SancStudyの記事機能を公開しました',
--     '記事本文をHTMLファイルとして管理し、公開情報をSupabaseから表示する仕組みを紹介します。',
--     'お知らせ',
--     (select id from public.members where slug = 'hourai-carrot'),
--     timezone('utc', now()),
--     'articles/sample-article.html',
--     true,
--     false
--   )
-- on conflict (slug) do update set
--   title = excluded.title,
--   excerpt = excluded.excerpt,
--   category = excluded.category,
--   author_member_id = excluded.author_member_id,
--   published_at = excluded.published_at,
--   html_path = excluded.html_path,
--   is_published = excluded.is_published,
--   featured = excluded.featured;
