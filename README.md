# SancStudy - 中高生向け学習ポータルサイト

> 学びを、もっと楽しく。もっと身近に。

## 概要

SancStudyは中高生向けの学習ゲーム・ツールポータルサイトです。Apple風のデザインで、スクロール演出・ヒーロースライダー・レビュー機能・フィードバックフォームを搭載しています。

## ファイル構成

```
sancstudy/
├── index.html          # トップページ（ヒーロースライダー・レビュー）
├── games.html          # ゲーム一覧・詳細ページ
├── tools.html          # ツール一覧・詳細ページ
├── howto.html          # 使い方・こんな時に・FAQ
├── about.html          # 運営について・チーム・沿革
├── news.html           # 更新情報
├── sitemap.xml         # SEO用サイトマップ
├── robots.txt          # クローラー設定
├── css/
│   └── style.css       # メインスタイルシート
├── js/
│   └── main.js         # メインJavaScript
└── assets/
    ├── logo.png        # SancStudyロゴ
    ├── kanji_war.webp  # 漢字大戦スクリーンショット
    ├── leap_over_quest.webp  # LEAP OVER QUESTスクリーンショット
    ├── prime_striker.webp    # Prime Strikerスクリーンショット
    └── homework_manager.webp # 宿題マネージャースクリーンショット
```

## 公開方法

### GitHub Pages
1. GitHubリポジトリを作成
2. このフォルダの内容をすべてアップロード
3. Settings → Pages → Source: Deploy from a branch → main / (root)
4. `https://<username>.github.io/<repo>/` でアクセス可能

### Netlify / Vercel
1. このフォルダをそのままドラッグ＆ドロップでデプロイ
2. カスタムドメインを設定（任意）

### 注意事項
- `sitemap.xml` と `robots.txt` 内のURLを実際のドメインに変更してください
- `index.html` の `og:url` と `canonical` タグも実際のURLに変更してください

## 機能一覧

| 機能 | 説明 |
|------|------|
| ヒーロースライダー | 4コンテンツが自動で切り替わり、クリックで各サイトへ遷移 |
| ハンバーガーメニュー | PC・スマホ共通のドロワーナビゲーション |
| スクロール演出 | IntersectionObserverによるフェードイン |
| レビュー機能 | 星評価・コメント投稿（localStorage保存） |
| フィードバックフォーム | バグ報告・改善提案（localStorage保存） |
| 統計カウンター | スクロール時にカウントアップアニメーション |
| 更新情報フィルター | カテゴリ別フィルタリング |
| SEO対応 | meta tags, OGP, JSON-LD, sitemap.xml |

## リンク先

- 漢字大戦 KANJI WAR: https://hourai-carrot.github.io/KANJI-WAR/
- LEAP OVER QUEST: https://hourai-carrot.github.io/LEAP-OVER-QUEST/
- Prime Striker: https://beeeeach.github.io/Prime-Striker/
- 宿題マネージャー: https://homework-manager-azure.vercel.app/
