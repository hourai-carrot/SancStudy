# SancStudy コンテンツ運用ガイド

このガイドでは、SancStudy の運営メンバー、役割バッジ、更新情報、記事を安全に運用するために、**管理者が行う操作だけ**を説明します。公開サイトの利用者は、これらのデータを閲覧できますが、追加・編集・削除はできません。

## 1. 最初に一度だけ行う設定

### 1.1 Supabase のテーブルとRLSを作成する

1. Supabase Dashboard で対象プロジェクトを開きます。
2. 左側のメニューから **SQL Editor** を開きます。
3. `SUPABASE_CONTENT_SETUP.sql` の全文を貼り付けます。
4. **Run** を押します。
5. 成功メッセージを確認します。

このSQLは、メンバー・バッジ・コンテンツ制作者・更新情報・記事メタデータ・沿革を管理するテーブルと、公開済みデータだけを閲覧可能にする RLS を作成します。既存の `reviews` テーブルは変更しません。

> `service_role`、secret key、データベースパスワードを、HTML、JavaScript、GitHubリポジトリに貼り付けないでください。公開サイトでは Project URL と Publishable key だけを使用します。

### 1.2 メンバー画像を用意する

メンバー画像は次のいずれかで用意できます。

| 方法 | 操作 | 推奨度 |
|---|---|---|
| Supabase Storage | Dashboard の Storage から `member-avatars` バケットへ画像をアップロードし、公開URLをコピーする | 推奨 |
| HTTPS画像URL | 運営者が管理する安全な HTTPS URL を使用する | 可 |

画像は正方形、推奨 512 × 512 px 以上、PNG・WebP・JPEG のいずれかにしてください。公開URLを `members.avatar_url` に登録します。

## 2. 運営メンバーを登録・変更する

### 2.1 メンバーの登録

1. **Table Editor** を開き、`members` テーブルを選択します。
2. **Insert row** を押し、以下を入力します。

| 列 | 入力内容 | 例 |
|---|---|---|
| `slug` | URL用の識別子。英小文字、数字、ハイフンのみ | `hourai-carrot` |
| `name` | サイトに表示する名前 | `hourai-carrot` |
| `avatar_url` | 上記で用意した公開画像URL | `https://...` |
| `role_title` | 役職・担当を短く記載 | `ゲーム開発` |
| `bio` | 紹介文 | `学習ゲームの企画・開発を担当しています。` |
| `started_on` | 活動開始日 | `2025-04-01` |
| `profile_url` | 任意の外部プロフィールURL | `https://github.com/...` |
| `sort_order` | 表示順。小さい数字ほど先に表示 | `1` |
| `is_active` | サイトに公開する場合は `true` | `true` |

3. 保存します。

### 2.2 初期メンバーの正しい担当

| メンバー | 担当コンテンツ | 推奨 `role_title` |
|---|---|---|
| `hourai-carrot` | 漢字大戦 KANJI WAR、LEAP OVER QUEST | ゲーム開発 |
| `beeeeach` | Prime Striker、宿題マネージャー | ゲーム・ツール開発 |

`ツール担当`という別メンバーは登録しません。

## 3. 役割バッジを付与する

1. `member_badges` テーブルを開き、**Insert row** を押します。
2. `member_id` には該当メンバーの `members.id` を選択します。
3. `badge_key` と `label` を入力し、保存します。

| `badge_key` | `label` の例 | サイトでの色 |
|---|---|---|
| `developer` | 開発者 | 青 |
| `writer` | ライター | 赤 |
| `supporter` | サポーター | 黄 |

一人に複数のバッジを付けられます。例として、開発と記事執筆を担当するメンバーには `developer` と `writer` の2行を登録します。

## 4. コンテンツと制作者を紐付ける

`content_items` テーブルに以下の4件を登録します。`author_member_id` には対象メンバーの UUID を指定し、公開時は `is_published` を `true` にします。

| `slug` | `name` | `content_type` | 制作者 | `destination_url` |
|---|---|---|---|---|
| `kanji-war` | 漢字大戦 KANJI WAR | `game` | `hourai-carrot` | `https://hourai-carrot.github.io/KANJI-WAR/` |
| `leap-over-quest` | LEAP OVER QUEST | `game` | `hourai-carrot` | `https://hourai-carrot.github.io/LEAP-OVER-QUEST/` |
| `prime-striker` | Prime Striker | `game` | `beeeeach` | `https://beeeeach.github.io/Prime-Striker/` |
| `homework-manager` | 宿題マネージャー | `tool` | `beeeeach` | `https://homework-manager-azure.vercel.app/` |

## 5. 更新情報を公開する

1. `updates` テーブルで **Insert row** を選びます。
2. 必須項目を入力します。

| 列 | 内容 |
|---|---|
| `category` | `game`、`tool`、`site` のいずれか |
| `title` | 更新の見出し |
| `summary` | サイトに表示する本文。HTMLタグは入力しない |
| `related_content_id` | 関連コンテンツがある場合のみ指定 |
| `author_member_id` | 担当メンバーがいる場合のみ指定 |
| `published_at` | 公開日時 |
| `is_published` | 内容確認前は `false`、公開時は `true` |
| `sort_order` | 同日時に並びを調整したい場合に使用 |

保存後、`is_published = true` の更新情報だけがサイトに表示されます。

## 6. 記事を公開する

### 6.1 HTML原稿を作成する

1. `ARTICLE_TEMPLATE.html` をコピーします。
2. ファイル名を `articles/<slug>.html` に変更します。例: `articles/kanji-study-tips.html`。
3. 本文だけを記述します。次の要素は使用しないでください。

| 使用禁止 | 理由 |
|---|---|
| `<script>`、`<style>`、`<iframe>`、`<form>` | スクリプト実行・外部埋め込み・意図しない操作を防ぐため |
| `onclick` などの `on*` 属性 | JavaScript実行を防ぐため |
| `javascript:` で始まるURL | XSSを防ぐため |
| `<html>`、`<head>`、`<body>` | 本文フラグメントとして読み込むため |

4. GitHubリポジトリへコミット・プッシュし、GitHub Pages 上で `articles/<slug>.html` が直接開けることを確認します。

### 6.2 Supabase に記事のメタデータを登録する

1. `articles` テーブルを開いて **Insert row** を選びます。
2. 以下を入力します。

| 列 | 入力内容 | 例 |
|---|---|---|
| `slug` | 英小文字・数字・ハイフンだけの識別子 | `kanji-study-tips` |
| `title` | 記事タイトル | `ゲームで楽しく漢字を覚える3つのコツ` |
| `excerpt` | 記事一覧用の要約 | `毎日の学習に取り入れやすい方法を紹介します。` |
| `category` | カテゴリ | `学習のコツ` |
| `cover_image_url` | 任意の公開カバー画像URL | `https://...` |
| `author_member_id` | 執筆者の UUID | メンバーの `id` |
| `published_at` | 公開日時 | `2026-08-20 10:00:00+09` |
| `html_path` | GitHub上の本文パス | `articles/kanji-study-tips.html` |
| `is_published` | 公開する時だけ `true` | `true` |
| `featured` | 注目記事にする場合だけ `true` | `false` |

3. `is_published = true` にすると、記事一覧に表示されます。`false` の下書きはサイト利用者には表示されません。

## 7. 公開後の確認

メンバー・更新情報・記事を変更した後は、必ずシークレットウィンドウで公開サイトを確認してください。

1. 表示名、アイコン、役職、バッジ、開始年月が正しいことを確認します。
2. ゲーム・ツールの制作者チップを押し、正しいプロフィールが開くことを確認します。
3. `is_active = false` のメンバー、`is_published = false` の更新情報・記事が表示されないことを確認します。
4. 記事本文、著者名、画像、リンク、モバイル表示を確認します。
5. Supabaseのキーや管理画面のURL、個人情報を記事本文や紹介文へ掲載していないことを確認します。

## 8. 将来の管理画面について

本バージョンは、記事HTMLを GitHub で、公開メタデータを Supabase Dashboard で管理する安全な運用です。ブラウザだけで記事をアップロード・編集・公開できる管理画面を将来追加する場合は、以下を別途実装します。

1. Supabase Auth による管理者ログイン。
2. 認証済みユーザーだけが使用できる管理画面。
3. 認証済み管理者だけに限定した Storage のアップロードポリシー。
4. 記事HTMLのサニタイズと公開前プレビュー。
5. 監査ログ、下書き・承認ワークフロー。

この管理画面は、公開用の静的サイトとは分離して設計します。
