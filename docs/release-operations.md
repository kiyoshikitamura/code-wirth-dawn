# リリース運用ガイド

開発から本番リリースまでの日常的な運用手順です。

## 日常の開発フロー

```
1. develop で開発
2. push → CI 自動実行 + Preview Deploy 生成
3. Preview Deploy で動作確認
4. main にマージ → Production Deploy
```

### 基本コマンド

```bash
# develop で開発を開始
git checkout develop

# 開発作業...
git add .
git commit -m "feat: 新機能の説明"
git push

# Preview Deploy の URL で確認 (Vercel が自動生成)
# CI (lint + build) も自動実行される

# リリース準備ができたら main にマージ
git checkout main
git merge develop
git push
git checkout develop
```

### 大きな機能開発

```bash
# feature ブランチで開発
git checkout develop
git checkout -b feature/new-battle-system

# 開発作業...
git add .
git commit -m "feat: バトルシステム v3"
git push -u origin feature/new-battle-system

# 完了後、develop にマージ
git checkout develop
git merge feature/new-battle-system
git push

# feature ブランチを削除
git branch -d feature/new-battle-system
git push origin --delete feature/new-battle-system
```

### 本番の緊急修正

```bash
# main から直接 hotfix ブランチを作成
git checkout main
git checkout -b hotfix/fix-critical-bug

# 修正作業...
git add .
git commit -m "hotfix: クリティカルバグ修正"

# main にマージ（本番デプロイ）
git checkout main
git merge hotfix/fix-critical-bug
git push

# develop にも反映
git checkout develop
git merge hotfix/fix-critical-bug
git push

# hotfix ブランチを削除
git branch -d hotfix/fix-critical-bug
```

## データベース変更（マイグレーション）

詳細は `docs/migration-guide.md` を参照。要点のみ記載します。

### 新しいマイグレーションの作成〜適用

```bash
# 1. マイグレーション作成
npx supabase migration new add_new_column

# 2. SQL を編集
# supabase/migrations/YYYYMMDDHHMMSS_add_new_column.sql

# 3. 開発 DB に適用してテスト
npx supabase link --project-ref drbqnpzxgcbicpritcpi
npx supabase db push
npm run dev  # ローカルで動作確認

# 4. コミット & push (develop へ)
git add supabase/migrations/
git commit -m "migration: add_new_column"
git push

# 5. Preview Deploy で統合テスト

# 6. main にマージ後、本番 DB に適用
npx supabase link --project-ref zvoroixjuypnintkpmux
npx supabase db push

# ⚠️ 本番にリンクを戻したままにする
```

## マスターデータの投入

デバッグ API (`/api/debug/seed-*`) を使用してマスターデータを投入できます。

- **開発環境**: Preview Deploy の URL で直接アクセス可能
- **本番環境**: `VERCEL_ENV === 'production'` で 403 が返る — 本番のシード投入は Supabase Dashboard の SQL Editor を使用

## CI/CD

### GitHub Actions

`.github/workflows/ci.yml` により、以下のタイミングで自動チェックが実行されます:

- `develop` への push
- `main` への push
- `develop` / `main` への PR

チェック内容:
1. `npm ci` — 依存関係のインストール
2. `npm run lint` — ESLint チェック
3. `npm run build` — Next.js ビルド

### Vercel 自動デプロイ

| トリガー | デプロイ先 | 接続先 |
|---------|----------|--------|
| `main` に push | Production | 本番 Supabase + Stripe Live |
| `develop` / `feature/*` に push | Preview | 開発 Supabase + Stripe Test |

## トラブルシューティング

### `npx vercel` でデプロイしてもブランチ連動URLに反映されない

Vercelには **2種類のデプロイ方式** があり、それぞれ独立しています。

| 方式 | URL形式 | トリガー | 更新方法 |
|------|---------|---------|---------|
| **Git連動** | `code-wirth-dawn-git-develop-*.vercel.app` | `git push` | リモートにpush |
| **CLI手動** | `code-wirth-dawn-XXXXX-*.vercel.app` | `npx vercel` | CLI再実行 |

**`npx vercel` でデプロイしてもブランチ連動URL（`git-develop-...`）には反映されません。** ブランチ連動URLを更新するには `git push` が必要です。

```bash
# ✅ 正しい手順: コミット → push → 自動デプロイ
git add .
git commit -m "feat: 変更内容"
git push origin develop
# → Vercelがdevelopブランチの変更を検知して自動ビルド・デプロイ

# ⚠️ CLIデプロイは即時確認用（ブランチURLには反映されない）
npx vercel          # Preview（個別URL生成）
npx vercel --prod   # Production（本番URLに反映）
```

### Vercel ビルドキャッシュで旧コードが使われる

Vercelはビルド高速化のためにキャッシュを使用します。ローカルで編集したファイルが反映されない場合、キャッシュが原因の可能性があります。

```bash
# キャッシュを無視してデプロイ
npx vercel --force
npx vercel --prod --force
```

**発生しやすいケース**: 前回のデプロイ以降にファイルの内容が変わったが、ファイル名やパスが同じ場合。

### Preview Deploy に Deployment Protection（401エラー）がかかる

Vercelの **Deployment Protection** が有効な場合、Preview DeployへのAPIリクエストが `401 Unauthorized` を返します。ブラウザではVercel SSOでログイン済みならページは見えますが、`fetch()` によるAPIリクエストは認証ページのHTMLが返され、JSONパースに失敗します。

**対処法**:
1. Vercel Dashboard > Settings > Deployment Protection で `Vercel Authentication` を **Disabled** に変更
2. 設定変更後に**新しいデプロイ**が必要（既存デプロイには遡及適用されない）
3. または Production にデプロイ（本番はProtection対象外）

### Preview Deploy が開発 DB に接続しない

Vercel Dashboard > Settings > Environment Variables で、Preview 環境に開発用の Supabase キーが設定されているか確認してください。

### Supabase CLI でエラーが発生する

```bash
# ログイン状態を確認
npx supabase projects list

# 再ログイン
npx supabase login

# リンク状態を確認（.temp/project-ref を確認）
cat supabase/.temp/project-ref
```

### マイグレーションの競合

開発 DB と本番 DB でマイグレーション履歴がずれた場合:

```bash
# リモートのマイグレーション状態を確認
npx supabase db push --dry-run
```
