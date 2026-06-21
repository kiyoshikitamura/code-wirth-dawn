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

## 本番リリース準備およびデータリセットに関する教訓 (Lessons Learned)

本番リリース準備、データリセット、Stripe本番キー適用、およびリリース待ちフェーズの運用において得られた教訓です。

### 1. 本番DBのデータ一括リセット時の順序（外部キー制約の回避）
本番データベースのリセットやアカウント削除を行うスクリプト（例: `scratch/reset-production-db.js`）を実行する際、親テーブルである `user_profiles` や Supabaseの `auth.users` から先に削除しようとすると、外部キー（FK）制約違反（`violates foreign key constraint`）で失敗します。
* **教訓**: 必ず依存関係の末端にある子テーブル（`prayer_logs`, `user_chronicles`, `inventory`, `reputations`, `user_share_triggers` 等）から順に `delete()` を実行し、最後に `user_profiles` および `auth.admin.deleteUser` を実行するクリーンアップパイプラインを構築すること。

### 2. PostgREST / Supabase Client での無条件 DELETE 句の指定
Supabaseの JavaScript SDK でテーブルの全レコードを一括削除したい場合、通常SQLでの `DELETE FROM table` に相当する処理に `delete().or('id.is.not.null, id.is.null')` のような条件式を指定すると、パーサーやAPIバージョンによって 400 エラーを誘発することがあります。
* **教訓**: 確実に全削除を実行したい場合は、`.not('created_at', 'is', null)` や、UUID主キーを持つテーブルに対しては `.neq('id', '00000000-0000-0000-0000-000000000000')` などのように、実質的に全行にマッチする安定した代替フィルターを使用すること。

### 3. Stripe本番移行とテストプレイアカウントの完全削除
Stripeの決済処理を本番環境へ移行する際、Vercelの環境変数 `STRIPE_WEBHOOK_SECRET` に本番用のWebHookキー（例: `whsec_fRCphwIwLbrDjEGsOBS6FbYUJlbRDZvM`）が正確に設定されている必要があります。
* **教訓**: 本番キーの切り替えと同時に、データベースに残っている古いテストアカウント（無料フラグが含まれるテストプレイデータ等）は完全に削除してクリーンな状態にすること。本番データにテスト用のゴミレコードを残したままリリースすると、ID衝突や不整合、不要なログのエラー検出を招きます。

### 4. 正式リリース指示待ちにおけるCronジョブの一時停止（SUSPEND_CRONの導入）
Vercelのデプロイが本番向けに完了したものの、正式なリリース開始（ユーザー流入）まで時間がある場合、バックグラウンドのCronジョブ（世界シミュレーションの進行やランキングの自動更新など）が先行して実行され、初期状態が崩れる問題が発生します。
* **教訓**: 各Cronエンドポイント（`daily-update`, `fraud-detect`, `world-reset`）の処理冒頭に、環境変数 `SUSPEND_CRON === 'true'` の場合は実行をバイパスして即座に `NextResponse.json({ success: true, message: 'Cron is suspended' })` を返すチェックロジックを実装すること。Vercel上で `SUSPEND_CRON=true` を有効にするだけで、スケジューラー設定自体を変更することなく、本番デプロイ済みのCron実行を安全に一時停止できます。

## メンテナンス運用手順および教訓

メンテナンスモード（特定のテストアカウントのみバイパス許可する設定）を有効化し、安全にテスト検証を行ってから解除する手順と教訓です。

### 1. メンテナンスモードのON/OFF（SQL操作）

Supabase Dashboard の SQL Editor または CLI 等から `system_settings` テーブルを更新して制御します。

```sql
-- ⚠️ メンテナンスモードを有効化（即時強制適用）
UPDATE system_settings
SET force_maintenance = true,
    start_at = NOW(),
    end_at = NOW() + INTERVAL '3 hours'; -- 例：3時間のメンテナンス

-- ⚠️ メンテナンスモードを解除（強制解除）
UPDATE system_settings
SET force_maintenance = false,
    start_at = NULL,
    end_at = NULL;
```

### 2. メンテナンス検証チェックリスト（リリース時必須）

メンテナンスに入った際、一般ユーザーへの遮断と管理者（きたむ様）バイパスが正しく動作しているか以下のステップで必ず検証してください。

* [ ] **一般遮断の確認**
  * ブラウザのシークレットウィンドウ（Cookieやキャッシュがない状態）で本番環境のトップページにアクセスする。
  * メンテナンス画面が正常に表示されること。
  * 画面がクラッシュ（500エラー）せず、タイムゾーン補正された終了予定時刻（JST）が正しく表示されていること。
* [ ] **未ログイン（Google認証前）バイパスの確認**
  * 管理者バイパスURL `https://<domain>/?bypass=<MAINTENANCE_BYPASS_KEY>` にアクセスする。
  * メンテナンス画面を通過し、ログイン画面（`/auth/signin` 等）が表示されること。
* [ ] **「きたむ様アカウント」を用いた通過＆ゲームプレイ検証（最重要）**
  * 実際にホワイトリストに登録されている「きたむ様アカウント（ID: `c1cf67dd-527a-497e-bf88-ce10c2cb516f`）」でGoogleログイン（OAuth）を実行する。
  * ログイン後、メンテナンス画面に引き戻されることなく、拠点（`/inn`）に入り通常通りゲームプレイが行えることを確認する。
  * クエストの開始、移動、戦闘、ギブアップ等の基本機能が本番DB上でエラーなく動作することを確認する。

### 3. メンテナンス時の技術的教訓 (Lessons Learned)

* **Edge Middleware での JWT / Base64 デコード処理の罠**:
  * Edge Runtime の `atob` は Base64 入力のパディング `=` が欠けているだけで `DOMException` をスローし、ミドルウェア全体をクラッシュさせます。JWTデコード前に必ず `while (base64.length % 4) { base64 += '='; }` などのパディング補正処理を挟むこと。
  * Supabase SSR はセッショントークンをサイズごとに分割クッキー（`sb-*-auth-token.0`, `sb-*-auth-token.1` 等）として保存するため、`auth-token` を含む全クッキーを収集・ソート結合してパースするロジックを崩さないこと。
* **サーバーコンポーネントにおけるUIインタラクション**:
  * `/maintenance/page.tsx` などのサーバーコンポーネントで、HTML要素に直接 `onMouseOver` などのイベントハンドラを付与するとSSR時にハイドレーションエラー（500エラー）を引き起こしクラッシュします。ホバー効果などは Pure CSS (`:hover`) や `<style>` を使用して実装すること。


