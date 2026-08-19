-- 1. レビューテーブルの作成
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  approved BOOLEAN DEFAULT false NOT NULL
);

-- 2. 行レベルセキュリティ(RLS)の有効化
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 3. ポリシーの設定

-- 誰でも（匿名ユーザー含む）承認済みのレビューのみ閲覧可能
CREATE POLICY "Allow anonymous select on approved reviews"
ON reviews FOR SELECT
TO anon
USING (approved = true);

-- 誰でも（匿名ユーザー含む）新規レビューの投稿が可能
-- ただし、approvedは必ずfalseでなければならない（CHECK制約またはポリシーで制御）
CREATE POLICY "Allow anonymous insert on reviews"
ON reviews FOR INSERT
TO anon
WITH CHECK (approved = false);

-- 匿名ユーザーによる更新・削除は不可（デフォルトで拒否されるため、ポリシーを作成しない）
