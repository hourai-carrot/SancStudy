# SancStudy 大規模アップデート納品メモ

## 完了状況

SancStudy に、**HTML本文＋Supabaseメタデータ方式の記事公開機能**、Supabaseで管理する**運営メンバー・役割バッジ・更新情報**、コンテンツから制作者プロフィールへ移動する**プロフィール導線**を実装しました。既存のヒーロースライダー、レビュー、Cookie通知、PC・スマホ向けハンバーガーメニューは維持されています。

> この納品物は、元のアップロード内容との差分として必要なファイルだけを収録します。`assets/` は今回の変更対象ではないため、既存のものを残してください。

## 反映するファイル

| 区分 | 相対パス | 内容 |
|---|---|---|
| 変更 | `index.html` | 記事導線、制作者チップ用スロット、Supabase SDK読込、既存機能の維持 |
| 変更 | `about.html` | 運営情報・沿革の動的表示領域、記事導線 |
| 変更 | `news.html` | Supabaseの更新情報を表示する領域、カテゴリ絞り込み |
| 変更 | `games.html` | 各ゲームの制作者プロフィール導線 |
| 変更 | `tools.html` | 宿題マネージャーの制作者を `beeeeach` として表示する導線 |
| 変更 | `howto.html` | 共通ナビゲーション・フッターの記事導線 |
| 変更 | `privacy.html` | 共通ナビゲーション・フッターの記事導線 |
| 変更 | `sitemap.xml` | GitHub Pages の正式URLを反映 |
| 変更 | `README.md` | 機能概要、導入・運用・安全方針 |
| 変更 | `css/style.css` | 記事、プロフィール、制作者チップ、役割バッジ、空状態、モバイル対応 |
| 変更 | `js/main.js` | Supabase公開データ取得、プロフィール、記事、サニタイズ、既存レビュー・スライダー処理 |
| 新規 | `articles.html` | 記事一覧ページ |
| 新規 | `article.html` | 記事詳細ページ。`?slug=` により記事を特定 |
| 新規 | `profile.html` | メンバープロフィールページ。`?member=` によりメンバーを特定 |
| 新規 | `articles/sample-article.html` | 動作確認用の記事本文フラグメント |
| 新規 | `ARTICLE_TEMPLATE.html` | 新規記事本文の安全なテンプレート |
| 新規 | `CONTENT_OPERATIONS_GUIDE.md` | 記事・メンバー・バッジ・更新情報の日常運用手順 |
| 新規 | `SUPABASE_CONTENT_SETUP.sql` | コンテンツ機能のテーブル、インデックス、RLS、ストレージバケット定義 |
| 新規 | `SUPABASE_CONTENT_INITIAL_DATA.sql` | 初期メンバー、開発者バッジ、コンテンツ担当、更新情報、沿革の登録SQL |
| 新規 | `SUPABASE_ARTICLE_TEST.sql` | テスト記事メタデータの登録SQL |

## Supabaseで実行済みの内容

| SQL | 状態 | 用途 |
|---|---|---|
| `SUPABASE_CONTENT_SETUP.sql` | 実行済み | `members`、`member_badges`、`content_items`、`updates`、`articles`、`site_settings`、`site_history`、RLSを作成 |
| `SUPABASE_CONTENT_INITIAL_DATA.sql` | 実行済み | `hourai-carrot`、`beeeeach`、青色の開発者バッジ、コンテンツ担当、公開更新情報等を登録 |
| `SUPABASE_ARTICLE_TEST.sql` | 実行済み | 公開済みテスト記事 `sample-article` を登録 |

匿名利用者には、RLSにより公開済みデータの閲覧だけが許可されます。ブラウザへ置く値はProject URLとPublishable keyだけであり、`service_role`、secret key、データベースパスワードは含めていません。

## 公開手順

1. ZIPの中身を、GitHubリポジトリの `SancStudy` 直下へ、フォルダ構成を保ったまま配置してください。`css/style.css`、`js/main.js`、`articles/` の階層を崩さないことが重要です。
2. `assets/` は既存のまま保持してください。今回のZIPには含めていません。
3. GitHubへコミット・プッシュしてください。GitHub Pagesの公開後、`https://hourai-carrot.github.io/SancStudy/articles.html` と `https://hourai-carrot.github.io/SancStudy/article.html?slug=sample-article` を開き、テスト記事を確認してください。
4. テスト記事を公開サイトに残さない場合は、GitHub上で `articles/sample-article.html` を削除し、Supabase Dashboardの `articles` テーブルで該当行の `is_published` を `false` にしてください。

## 日常の運用方法

### 記事を公開する

新しい記事は、`ARTICLE_TEMPLATE.html` をコピーして `articles/<slug>.html` として作成します。`<slug>` は半角小文字、数字、ハイフンだけで構成します。HTML本文をGitHubへプッシュして公開可能な状態にしたあと、Supabase Dashboard の `articles` テーブルに、タイトル、要約、カテゴリ、著者、公開日時、`html_path`、`is_published=true` を登録してください。

本文の中に `script`、`iframe`、フォーム、イベント属性を置かないでください。サイト側でも許可リスト方式で除去しますが、記事原稿自体を安全に保つことが運用上重要です。

### 下書きにする

`articles` テーブルの `is_published` を `false` にしてください。匿名閲覧のRLSとフロントエンドの公開データ取得の両方で一覧・詳細の対象外になります。本文HTMLだけを先にGitHubへ置いても、メタデータが非公開なら記事としては表示されません。

### メンバー・バッジ・担当コンテンツを更新する

Supabase Dashboardで `members` の情報と `is_active` を編集します。`member_badges` では `badge_key` を `developer`、`writer`、`supporter` から選びます。色はサイト側でそれぞれ青、赤、黄に固定されています。ゲーム・ツールの担当者は `content_items.author_member_id` を更新してください。

### 更新情報を追加する

`updates` テーブルにカテゴリ、タイトル、要約、公開日時、著者を登録し、公開するタイミングで `is_published=true` にします。記事と同様に、非公開の行は匿名閲覧者の画面には出ません。

## 検証結果

| 確認項目 | 結果 |
|---|---|
| 記事一覧 | 公開済みの `sample-article` がタイトル、要約、カテゴリ、公開日、著者名とともに表示 |
| 記事詳細 | HTMLフラグメントを同一オリジンで読込み、見出し・段落・注意枠・箇条書きを描画 |
| 著者導線 | 記事の著者チップから `profile.html?member=hourai-carrot` へ遷移 |
| 運営・更新情報 | Supabaseの公開データ、役割バッジ、カテゴリ絞り込みを表示 |
| XSS対策 | `script`、`onclick`、`javascript:` URL、危険な画像URLを除去することを確認 |
| 匿名RLS | 記事・メンバー・更新情報の匿名INSERTはHTTP 401で拒否。記事更新は対象0件で変更なし |
| 下書き条件 | 匿名APIの `is_published=false` 記事検索は空配列。RLS条件は `is_published=true` のみ |
| スライダー | 初期表示の白紙なし、手動切替・約5秒ごとの自動送りを確認 |
| ナビゲーション | PCのハンバーガーメニューを開き、`Escape` で閉じることを確認 |
| モバイル | 375px幅でトップ、記事一覧、記事詳細に横方向の崩れなし |
| JavaScript | トップページ起動後の新規コンソールエラーなし |

詳細な時系列ログは、同梱する `verification_notes.md` を参照してください。

## 公開後に確認するURL

| ページ | URL |
|---|---|
| トップ | `https://hourai-carrot.github.io/SancStudy/` |
| 記事一覧 | `https://hourai-carrot.github.io/SancStudy/articles.html` |
| テスト記事 | `https://hourai-carrot.github.io/SancStudy/article.html?slug=sample-article` |
| 制作者プロフィール | `https://hourai-carrot.github.io/SancStudy/profile.html?member=hourai-carrot` |
| 運営について | `https://hourai-carrot.github.io/SancStudy/about.html` |
| 更新情報 | `https://hourai-carrot.github.io/SancStudy/news.html` |

> 公開作業は、サイト内の既存画像・GitHub Pages設定・Supabaseプロジェクトを削除せずに行ってください。SQLはすでに実行済みのため、`SUPABASE_CONTENT_SETUP.sql` を同じプロジェクトへ再実行する必要はありません。
