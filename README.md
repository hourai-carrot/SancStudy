# SancStudy — 中高生向け学習ポータル

> **学びを、もっと楽しく。もっと身近に。**

SancStudyは、漢字・英単語・数学をゲームで学ぶコンテンツと、毎日の学習を支えるツールをまとめた中高生向けポータルサイトです。GitHub Pagesで配信する静的サイトとして構成しつつ、公開済みのレビュー、運営メンバー、役割バッジ、更新情報、記事メタデータをSupabaseから安全に読み込みます。

## ページ構成

| ファイル | 内容 |
|---|---|
| `index.html` | トップページ、ヒーロースライダー、コンテンツ、承認制レビュー |
| `games.html` / `tools.html` | 学習コンテンツの紹介と制作者プロフィールへの導線 |
| `articles.html` | Supabaseの公開済み記事メタデータを一覧表示 |
| `article.html?slug=<slug>` | GitHub上のHTML本文フラグメントを安全に読み込んで表示 |
| `profile.html?member=<slug>` | 運営メンバーのプロフィール、バッジ、担当コンテンツ |
| `about.html` | Supabaseの公開データから表示するメンバー・沿革・運営情報 |
| `news.html` | Supabaseの公開済み更新情報をカテゴリ別に表示 |
| `privacy.html` | Cookie、Google Analytics 4、Microsoft Clarityに関するポリシー |

## 重要なファイルと運用資料

| ファイル | 用途 |
|---|---|
| `SUPABASE_SETUP.sql` | 既存の管理者承認制レビュー機能用SQL |
| `SUPABASE_CONTENT_SETUP.sql` | メンバー、記事、更新情報、RLS、公開画像バケットを作成するSQL |
| `SUPABASE_CONTENT_INITIAL_DATA.sql` | 正しい制作者対応を含む初期公開データを登録するSQL |
| `CONTENT_OPERATIONS_GUIDE.md` | Supabase DashboardとGitHubを使う日常運用の手順 |
| `ARTICLE_TEMPLATE.html` | 安全な記事本文フラグメントのテンプレート |
| `articles/sample-article.html` | 記事読み込みを確認するテスト用本文 |

## セキュリティ方針

公開サイトの `js/main.js` に含めるのは **Supabase Project URL と Publishable keyのみ**です。secret key、service_role key、データベースパスワードはHTML、JavaScript、Gitリポジトリに保存してはいけません。

メンバー、記事、更新情報、制作者紐付けの各テーブルではRLSを有効にしています。匿名利用者には公開済みデータの閲覧のみを許可し、作成・編集・削除は許可しません。管理操作はSupabase Dashboardで実行します。レビューは別途、未承認投稿のみ許可し、承認済みレビューだけを表示する既存ポリシーを維持します。

記事本文は `articles/<slug>.html` のHTMLフラグメントとしてGitHubで管理します。ブラウザ側では、タグ・属性・リンク先を許可リストで検査してから表示します。ただし、安全性を最優先するため、記事の作成・アップロードは公開サイトから行わず、GitHubの管理者権限を持つ運営者だけが行ってください。

## 新しい記事を公開する手順

1. `ARTICLE_TEMPLATE.html` をコピーし、`articles/<slug>.html` として保存します。`slug` には英小文字、数字、ハイフンのみを使います。
2. 本文フラグメントを作成します。`script`、`style`、`iframe`、フォーム要素、イベント属性、`javascript:` URLは使用しません。
3. GitHubへコミット・プッシュし、`https://hourai-carrot.github.io/SancStudy/articles/<slug>.html` が開けることを確認します。
4. Supabase Dashboard の `articles` テーブルに、`slug`、タイトル、要約、カテゴリ、著者、公開日時、`html_path`、`is_published=true` を登録します。
5. `articles.html`、記事詳細、著者リンク、スマホ表示を確認します。重要記事を検索結果へ早く反映したい場合は、`sitemap.xml`に記事詳細のURLも追記してください。

詳しいデータ入力方法は [`CONTENT_OPERATIONS_GUIDE.md`](CONTENT_OPERATIONS_GUIDE.md) を参照してください。

## ローカル確認

プロジェクト直上で、次のように静的サーバーを起動します。

```bash
python3 -m http.server 8080
```

ブラウザで `http://127.0.0.1:8080/` を開き、トップページ、記事一覧、プロフィール、更新情報、レビュー、スマホ幅の表示を確認してください。

## GitHub Pagesへの公開

1. リポジトリのルートに本フォルダの内容を配置します。
2. GitHubの **Settings → Pages** を開きます。
3. **Deploy from a branch** を選択し、`main` ブランチの `/ (root)` を指定します。
4. 公開先は `https://hourai-carrot.github.io/SancStudy/` です。
5. 公開前に、`sitemap.xml`、canonical URL、記事リンク、Supabaseの公開状態、RLS、モバイル表示を確認します。

## 主な機能

| 機能 | 説明 |
|---|---|
| ヒーロースライダー | 初期表示、矢印、ドット、スマホスワイプに対応 |
| 制作者プロフィール | 全ゲーム・ツールから制作者名、アイコン、役割バッジ、プロフィールへ遷移 |
| 役割バッジ | 青色の開発者、赤色のライター、黄色のサポーターをSQLデータから描画 |
| 記事 | HTML本文フラグメントを安全に読み込み、記事一覧・詳細・著者を表示 |
| 運営について | メンバー、開始時期、沿革、担当情報をSupabaseから読み込み |
| 更新情報 | 公開済み更新情報をカテゴリ別に表示し、著者プロフィールにリンク |
| 承認制レビュー | `approved = true` のレビューのみ表示し、平均評価・件数を自動計算 |
| Cookie通知 | プライバシーポリシーへの導線とブラウザ設定の案内 |

## 外部コンテンツ

| コンテンツ | URL |
|---|---|
| 漢字大戦 KANJI WAR | https://hourai-carrot.github.io/KANJI-WAR/ |
| LEAP OVER QUEST | https://hourai-carrot.github.io/LEAP-OVER-QUEST/ |
| Prime Striker | https://beeeeach.github.io/Prime-Striker/ |
| 宿題マネージャー | https://homework-manager-azure.vercel.app/ |
