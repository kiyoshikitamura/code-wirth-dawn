# マイグレーション運用ガイド

本番環境と開発環境を分離した状態でのデータベースマイグレーション運用手順です。

## 環境構成

| 環境 | Supabase プロジェクト | 用途 |
|------|---------------------|------|
| 本番 (Production) | `zvoroixjuypnintkpmux` | ユーザーが利用する本番環境 |
| 開発 (Development) | `code-wirth-dawn-dev` | 開発・テスト用 |

## マイグレーション作成〜適用フロー

### 1. マイグレーションの作成

```bash
# develop ブランチで作業
git checkout develop

# 新しいマイグレーションファイルを作成
supabase migration new <マイグレーション名>
# 例: supabase migration new add_user_level_column
```

`supabase/migrations/` に新しい SQL ファイルが作成されます。このファイルに SQL を記述してください。

### 2. 開発 DB でテスト

```bash
# 開発用プロジェクトにリンク
supabase link --project-ref <dev-project-ref>

# マイグレーションを開発 DB に適用
supabase db push

# 動作確認（ローカルサーバーで確認）
npm run dev
```

### 3. develop ブランチにコミット & push

```bash
git add supabase/migrations/
git commit -m "migration: <マイグレーション内容の説明>"
git push
```

Vercel Preview Deploy が生成され、開発用 Supabase に接続した状態で統合テストが可能です。

### 4. 本番への適用

```bash
# main ブランチにマージ
git checkout main
git merge develop
git push

# 本番用プロジェクトにリンクを切り替え
supabase link --project-ref zvoroixjuypnintkpmux

# 本番 DB にマイグレーションを適用
supabase db push
```

## 破壊的変更の安全な進め方

カラム削除や型変更など、既存データに影響する変更は **2段階方式** で行います。

### 例: カラムの削除

**ステップ 1（リリース 1）**: コード側でカラムの使用を停止
```sql
-- マイグレーション: deprecate_old_column
-- この時点ではカラムを残しておく（コード側の修正のみ）
COMMENT ON COLUMN users.old_column IS 'DEPRECATED: 次回リリースで削除予定';
```

**ステップ 2（リリース 2）**: カラムを実際に削除
```sql
-- マイグレーション: remove_old_column
ALTER TABLE users DROP COLUMN old_column;
```

### 例: カラムの型変更

```sql
-- ステップ 1: 新しいカラムを追加
ALTER TABLE users ADD COLUMN status_new text;

-- ステップ 2: データを移行
UPDATE users SET status_new = status::text;

-- ステップ 3: 古いカラムを削除し、新しいカラムをリネーム
ALTER TABLE users DROP COLUMN status;
ALTER TABLE users RENAME COLUMN status_new TO status;
```

## ロールバック手順

マイグレーション適用後に問題が発生した場合:

### 1. 手動ロールバック SQL の作成

各マイグレーションに対して、逆操作の SQL を用意しておくことを推奨します。

```sql
-- ロールバック用 SQL（例: add_user_level_column のロールバック）
ALTER TABLE users DROP COLUMN IF EXISTS level;
```

### 2. Supabase Dashboard からの実行

1. [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. ロールバック SQL を実行
3. `supabase_migrations.schema_migrations` テーブルから該当レコードを削除

```sql
DELETE FROM supabase_migrations.schema_migrations
WHERE version = '<マイグレーションのタイムスタンプ>';
```

## 注意事項

- **本番 DB への直接 SQL 実行は避ける**: 必ずマイグレーションファイル経由で変更する
- **開発 DB で必ずテスト**: 本番適用前に開発環境で動作確認する
- **バックアップ**: 大きな変更前には Supabase Dashboard からバックアップを取得する
- **リンク切り替えを忘れない**: `supabase link` で接続先を間違えないよう注意する
