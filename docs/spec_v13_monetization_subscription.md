Code: Wirth-Dawn Specification v13.0 (Complete)
# Monetization, Persistence & 3-Tier Subscription

## 1. 概要 (Overview)
本仕様書は、匿名アカウントを保護するための「アカウント永続化（OAuth連携）」、およびStripeを利用した「ゴールド都度購入」と「3段階（Free / Basic / Premium）のサブスクリプションシステム」の実装を定義する。
これらの機能は、ゲーム内エコシステムの維持とマネタイズの根幹を担う。

---

## 2. アカウントの永続化 (Account Persistence)

現在のシステムでは、ユーザーはタイトル画面で「はじめる」を押下した際、バックグラウンドで匿名ユーザー（Anonymous Sign-in）として登録されている。
課金や長期間のプレイを行う前提として、このデータを保護するフローを実装する。

### 2.1 OAuthプロバイダ連携 (linkIdentity)
- **対象UI**: アカウント設定画面（⚙アイコンから開くモーダル）。
- **処理フロー**:
  1. 未連携の匿名ユーザーに対し、「データを保護し、課金機能を利用するためにアカウント連携を行ってください」という案内と、Google等のOAuthログインボタンを表示する。
  2. ボタン押下時、Supabaseの `supabase.auth.linkIdentity()` メソッドを呼び出し、現在の匿名アカウントにOAuthプロバイダを紐付ける。
  3. 既存のメールアドレス＆パスワードによるユーザー登録画面は**完全に廃止**する。
  4. 連携完了後、ユーザーは端末が変わってもOAuthログインを用いることで、元のプロフィールデータや課金状態を完全に復元（データ引き継ぎ）できるようになる。

---

## 3. データベースの変更 (Schema Update)

サブスクリプションを3段階で管理するため、`user_profiles` テーブルを改修する。

| 项目 | 内容 |
|---|---|
| 対象テーブル | `user_profiles` |
| 変更カラム | `subscription_tier` (`ENUM: 'free', 'basic', 'premium'`) |
| デフォルト値 | `'free'` |
| 廃止カラム | `is_subscriber` (BOOLEAN) → `subscription_tier` に移行・廃止 |

```sql
-- カラム追加
ALTER TABLE user_profiles
  ADD COLUMN subscription_tier TEXT NOT NULL DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'basic', 'premium'));

-- 旧カラムからの移行
UPDATE user_profiles
  SET subscription_tier = CASE WHEN is_subscriber THEN 'basic' ELSE 'free' END;

-- 旧カラム廃止（移行確認後に実行）
-- ALTER TABLE user_profiles DROP COLUMN is_subscriber;
```

---

## 4. Tier別 特権・制限一覧 (Tier Privileges)

ユーザーの `subscription_tier` に基づき、ゲーム内で以下の機能制限を動的に適用する。

| 特権 / 制限項目 | Free | Basic | Premium |
|---|---|---|---|
| キャラクタースロット数 | 1枠 | 3枠 | 5枠 |
| 英霊 (Heroic) 登録数 | 不可 (0) | 最大 3体 | 最大 10体 |
| UGC 公開枠 (published) | 最大 1クエスト | 最大 5クエスト | 最大 20クエスト |
| UGC 保存枠 (unpublished) | 最大 3クエスト | 最大 10クエスト | 最大 50クエスト |

### 4.1 英霊登録時の上限ハンドリング (spec v14 実装済み)
引退時、Basic以上のユーザーが英霊の登録上限に達している場合は、**最も古い自身の英霊を削除（押し出し）した上で新規登録を行うFIFO（First In, First Out）方式**を採用する。

| Tier | 英霊登録上限 | FIFO条件 |
|---|---|---|
| `free` | 登録不可 | スキップ |
| `basic` | 最大3体 | 上限到達時に最古の英霊を削除 |
| `premium` | 最大10体 | 上限到達時に最古の英霊を削除 |

実装箇所: `lifeCycleService.ts §83-180` (`handleCharacterDeath` 内部)

> [!NOTE]
> Free Tier (`'free'`) のユーザーは英霊登録自体が不可とする。旧仕様の `is_subscriber: true` に相当する最低保証は `'basic'` とする。

---

## 5. Stripe決済連携とWebhook API

アカウントを永続化したユーザーが、サブスクリプションの加入・変更、およびゲーム内通貨（ゴールド）の購入を行うための決済フロー。

### 5.1 決済セッションの発行 (POST /api/billing/checkout)

| mode | 内容 |
|---|---|
| `'subscription'` | Basic または Premium Tierを有効化するための決済画面URLを発行する |
| `'payment'` | ゴールドの都度購入（例: 10,000G）のための決済画面URLを発行する |

> [!IMPORTANT]
> Stripe側のメタデータ（`client_reference_id` 等）に必ず Supabase の `user_id` を埋め込むこと。Webhook で DB を特定するために必須。

### 5.2 Stripe Webhook エンドポイント (POST /api/webhooks/stripe)

Stripe側で決済完了・解約イベントを受信し、DBを更新する最重要機能。

| Stripeイベント | 処理内容 |
|---|---|
| `checkout.session.completed`（サブスク） | 購入された Price ID を判定し、`user_profiles.subscription_tier` を `'basic'` または `'premium'` に更新 |
| `checkout.session.completed`（ゴールド購入） | メタデータの `user_id` と購入量に基づき、`user_profiles.gold` にゴールドを加算 |
| `customer.subscription.deleted` / `canceled` | 解約イベント。該当ユーザーの `subscription_tier` を `'free'` にダウングレード |

**Webhook 署名検証**: `STRIPE_WEBHOOK_SECRET` 環境変数を使用して `stripe.webhooks.constructEvent()` でリクエストの正当性を検証すること。

**冪等性 (Idempotency) と Race Condition 防止**:
Stripe Webhookでは、ネットワーク障害等による重複送信（リトライ）への対策が必須である。イベント受信直後に `stripe_webhook_events` テーブルにイベントIDを挿入（INSERT）し、DBレベルの一意制約（UNIQUE CONSTRAINT）を用いて二重処理やレースコンディションによる「ゴールドの二重付与」などを完全にブロックするアーキテクチャを採用する（セキュリティ監査対応済）。

### 5.3 ダウングレード時の猶予処理
ダウングレードによって現在のキャラクター数やUGC数がTier上限を超過した場合、**即座に削除・非公開にはしない**。
ただし、新規の作成・公開・英霊登録アクションを実行した際にバリデーションエラーを返し、ユーザーへ整理を促す設計とする。

---

## 6. 環境変数（追加が必要なもの）

| 変数名 | 用途 |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe API呼び出し用シークレットキー |
| `STRIPE_WEBHOOK_SECRET` | Webhook署名検証用シークレット |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | フロントエンドでの Stripe.js 初期化用 |
| `STRIPE_PRICE_ID_BASIC` | Basic プランの Stripe Price ID |
| `STRIPE_PRICE_ID_PREMIUM` | Premium プランの Stripe Price ID |

---

## 7. 実装状態

| 機能 | 状態 |
|---|---|
| 匿名ログイン（Anonymous Sign-in） | ✅ 実装済み |
| linkIdentity (OAuth連携 UI) | ✅ 実装済み |
| `subscription_tier` カラム追加 | ✅ 実装済み |
| `is_subscriber` 廃止 | ✅ 実装済み |
| POST /api/billing/checkout | ✅ 実装済み |
| POST /api/webhooks/stripe | ✅ 実装済み |
| Tier別機能制限の動的適用（UGC枠等） | ✅ 実装済み |
| 英霊登録FIFO | ✅ 実装済み |
