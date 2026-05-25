# 開発環境セットアップガイド

本番環境と分離された開発環境のセットアップ手順です。

## 前提条件

- Node.js 22 以上
- npm
- Git
- Supabase CLI (`npx supabase` で実行可能)

## 環境構成

| 環境 | ブランチ | Vercel Deploy | Supabase Project | Stripe |
|------|---------|--------------|-----------------|--------|
| **本番** | `main` | Production | `zvoroixjuypnintkpmux` | Live Mode |
| **開発** | `develop` / `feature/*` | Preview | `drbqnpzxgcbicpritcpi` | Test Mode |

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/kiyoshikitamura/code-wirth-dawn.git
cd code-wirth-dawn
git checkout develop
npm install
```

### 2. 環境変数の設定

`.env.example` を参考に `.env.local` を作成します。**開発用の値**を設定してください：

```bash
cp .env.example .env.local
```

`.env.local` に以下を設定（開発用 Supabase + Stripe テストキー）:

```env
# Supabase — 開発プロジェクト (drbqnpzxgcbicpritcpi)
NEXT_PUBLIC_SUPABASE_URL=https://drbqnpzxgcbicpritcpi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<開発用 anon key>
SUPABASE_SERVICE_ROLE_KEY=<開発用 service role key>
SUPABASE_DB_URL=<開発用 DB 接続 URL>

# Stripe — テストモード
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID_BASIC=price_xxxxx
STRIPE_PRICE_ID_PREMIUM=price_xxxxx
STRIPE_PRICE_ID_GOLD_10K=price_xxxxx
STRIPE_PRICE_ID_GOLD_50K=price_xxxxx

# Authentication
ADMIN_SECRET_KEY=<開発用の任意の値>
CRON_SECRET=<開発用の任意の値>

# Analytics — 開発では空にして無効化
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. ローカルサーバーの起動

```bash
npm run dev
```

`http://localhost:3000` で開発用 Supabase に接続されたアプリケーションが起動します。

### 4. Vercel Preview Deploy

`develop` ブランチに push すると、Vercel が自動的に Preview Deploy を生成します。Preview Deploy は開発用の Supabase + Stripe テストモードに接続されます。

## Supabase CLI の使い方

### ログイン

```bash
npx supabase login
```

### プロジェクトのリンク切り替え

```bash
# 開発用にリンク
npx supabase link --project-ref drbqnpzxgcbicpritcpi

# 本番用にリンク（作業後は必ず戻す）
npx supabase link --project-ref zvoroixjuypnintkpmux
```

### マイグレーションの適用

詳細は `docs/migration-guide.md` を参照してください。

## Vercel 環境変数の構成

Vercel Dashboard > Settings > Environment Variables で、同じ変数名に対して Production / Preview で異なる値を設定しています:

| 変数 | Production | Preview |
|------|-----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | 本番 Supabase | 開発 Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 本番 Key | 開発 Key |
| `SUPABASE_SERVICE_ROLE_KEY` | 本番 Key | 開発 Key |
| `STRIPE_SECRET_KEY` | `sk_live_xxx` | `sk_test_xxx` |
| `STRIPE_WEBHOOK_SECRET` | 本番 Secret | テスト Secret |
| `STRIPE_PRICE_ID_*` | 本番 Price ID | テスト Price ID |
| `NEXT_PUBLIC_GA_ID` | 本番 GA ID | 空（無効化） |
| `ADMIN_SECRET_KEY` | 本番値 | 開発用値 |
| `CRON_SECRET` | 本番値 | 開発用値 |

## 環境別の制限事項

### デバッグ API (`/api/debug/*`)
- **本番**: 403 エラーを返す（`VERCEL_ENV === 'production'` チェック）
- **開発**: 正常に動作

### ダッシュボード (`/admin/dashboard`)
- **本番**: 正常に動作（本番データを集計）
- **開発**: KPI API が 403 を返す（本番データの誤参照を防止）

### Google Analytics
- **本番**: 有効（`NEXT_PUBLIC_GA_ID` が設定済み）
- **開発**: 無効（`NEXT_PUBLIC_GA_ID` が空）
