-- SancStudy 記事機能の動作確認用SQL
-- `sample-article` が未登録のときだけ、公開テスト記事を1件登録します。

insert into public.articles
  (slug, title, excerpt, category, author_member_id, published_at, html_path, is_published, featured)
select
  'sample-article',
  'SancStudyの記事機能を公開しました',
  '記事本文をHTMLファイルとして管理し、公開情報をSupabaseから表示する仕組みを紹介します。',
  'お知らせ',
  members.id,
  timezone('utc', now()),
  'articles/sample-article.html',
  true,
  false
from public.members as members
where members.slug = 'hourai-carrot'
  and not exists (
    select 1
    from public.articles as articles
    where articles.slug = 'sample-article'
  );
