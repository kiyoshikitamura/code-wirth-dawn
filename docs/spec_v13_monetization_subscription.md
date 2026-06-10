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

**実装箇所** (v13.2 実装済み):
- `AccountSettingsModal.tsx` §5.5: 匿名ユーザー向け「Google アカウントと連携する」ボタン
- `inn/page.tsx`: linkIdentity コールバック処理（`?code=` 検出 → `is_anonymous` を `false` に更新）
- `useAuthGuard.ts` L53-57: OAuth コールバック中のガードスキップ処理

---

## 3. データベースの変更 (Schema Update)

サブスクリプションを3段階で管理するため、`user_profiles` テーブルを改修する。

| 項目 | 内容 |
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

<!-- v13.2 (2026-05-16): UGC枠をPhase 2に移動、英霊ロイヤリティ/Weeklyボーナス/称号を追加 -->

ユーザーの `subscription_tier` に基づき、ゲーム内で以下の機能制限を動的に適用する。

| 特権 / 制限項目 | Free | Basic | Premium |
|---|---|---|---|
| **月額料金** | **無料** | **880円（税込）/月** | **2,200円（税込）/月** |
| **無料トライアル** | — | **最初の1週間無料** | **最初の1週間無料** |
| キャラクタースロット数 | 1枠 | 3枠 | 5枠 |
| 英霊 (Heroic) 登録数 | 不可 (0) | 最大 3体 | 最大 10体 |
| 英霊ロイヤリティ率 | — | **25%** (Free=登録不可) | **35%** |
| Weeklyログインボーナス | なし | **2,000G/週** (約8,000G/月) | **5,000G/週** (約20,000G/月) |
| プロフィール装飾 | なし | ⚡ 青枠 + Basicバッジ | 👑 金枠 + Premiumバッジ |
| UGC 公開枠 *(Phase 2)* | 最大 1クエスト | 最大 5クエスト | 最大 30クエスト |
| UGC 保存枠 *(Phase 2)* | 最大 5クエスト | 最大 10クエスト | 最大 50クエスト |
| UGC ゴールド枠追加 *(Phase 2)* | 下書き+1=2,000G / 公開+1=10,000G | 同左 | 同左 |

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
| `'payment'` | ゴールドの都度購入のための決済画面URLを発行する |

#### 無料トライアル (Free Trial)
Basic・Premium プランの初回購入時は、**最初の1週間（7日間）を無料**とする。
決済セッション作成時に `subscription_data.trial_period_days: 7` を指定することで、Stripe側で自動的にトライアル期間が付与される。
トライアル期間中は `subscription_tier` が有料Tierに即時アップデートされ、`subscription_status` は `trialing` となる。期間終了（本課金開始）後にステータスは `active` に移行し、初回課金が発生する。
- **Weeklyゴールドボーナスのスキップ**: 無料トライアル（`trialing`）期間中は、毎週のゴールドボーナス（Basic: 2,000G / Premium: 5,000G）は付与対象外（スキップ）となる。本課金（`active`）に移行したタイミングから付与が開始される。

> [!IMPORTANT]
> Stripe側のメタデータ（`client_reference_id` 等）に必ず Supabase の `user_id` を埋め込むこと。Webhook で DB を特定するために必須。

### 5.2 Stripe Webhook エンドポイント (POST /api/webhooks/stripe)

Stripe側で決済完了・解約イベントを受信し、DBを更新する最重要機能。

| Stripeイベント | 処理内容 |
|---|---|
| `checkout.session.completed`（サブスク） | 購入された Price ID を判定し、`user_profiles.subscription_tier` を `'basic'` または `'premium'` に、`subscription_status` を契約ステータスに更新 |
| `checkout.session.completed`（ゴールド購入） | メタデータの `user_id` と購入量に基づき、`user_profiles.gold` にゴールドを加算 |
| `customer.subscription.updated` | トライアル終了やプラン変更（Basic ⇔ Premium）を検知し、`subscription_tier` および `subscription_status` を同期更新 |
| `customer.subscription.deleted` / `canceled` | 解約イベント。該当ユーザーの `subscription_tier` を `'free'` に、`subscription_status` を `'inactive'` にダウングレード |

**Webhook 署名検証**: `STRIPE_WEBHOOK_SECRET` 環境変数を使用して `stripe.webhooks.constructEvent()` でリクエストの正当性を検証すること。

**冪等性 (Idempotency) と Race Condition 防止**:
Stripe Webhookでは、ネットワーク障害等による重複送信（リトライ）への対策が必須である。イベント受信直後に `stripe_webhook_events` テーブルにイベントIDを挿入（INSERT）し、DBレベルの一意制約（UNIQUE CONSTRAINT）を用いて二重処理やレースコンディションによる「ゴールドの二重付与」などを完全にブロックするアーキテクチャを採用する（セキュリティ監査対応済）。

### 5.3 ダウングレード時の猶予処理
ダウングレードによって現在のキャラクター### 🟢 Bug-2: UGC保存枠の上限値が仕様と +1 ずれている [修正済み]

**影響度**: 中（Freeユーザーが仕様上3件のところ4件まで保存できてしまう）

**対応状況 (2026-06-05 修正完了)**:
- `src/app/api/ugc/save/route.ts` にて上限値を `free: 3 / basic: 10 / premium: 50` に修正。
- クリエイターIDカラム `creator_id` で直接フィルタする形に最適化し、スキャン効率を改善。��税込）** | `STRIPE_PRICE_ID_GOLD_50K` | まとめ買い・コスパ重視向け |

> [!NOTE]
> 価格はStripe管理コンソール上の Price 設定に依存する。コード側では Price ID と付与ゴールドのみを管理する。

### 6.2 購入フロー

1. アカウント設定モーダル（`AccountSettingsModal.tsx`）の「ゴールド購入」セクションから、パッケージを選択してボタンを押下する。
2. `POST /api/billing/checkout` に `{ userId, mode: 'payment', priceId }` を送信し、Stripe Checkout URL を取得する。
3. Stripe の決済画面にリダイレクト。決済完了後、`/inn?billing=gold_success&amount=<付与G>` へリダイレクトされる。
4. Stripe から `checkout.session.completed` Webhook が届き、`increment_gold` RPC を実行してゴールドを加算する。

### 6.3 UI実装箇所

| ファイル | 内容 |
|---|---|
| `AccountSettingsModal.tsx` | ゴールド購入ボタンの配置 ✅ **実装済み** |
| `billing/checkout/route.ts` | `mode: 'payment'` の Checkout Session 発行 ✅ **実装済み** |
| `webhooks/stripe/route.ts` | `gold_amount` の加算処理 ✅ **実装済み** |

---

## 7. 環境変数（追加が必要なもの）

| 変数名 | 用途 |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe API呼び出し用シークレットキー |
| `STRIPE_WEBHOOK_SECRET` | Webhook署名検証用シークレット |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | フロントエンドでの Stripe.js 初期化用 |
| `STRIPE_PRICE_ID_BASIC` | Basic プランの Stripe Price ID |
| `STRIPE_PRICE_ID_PREMIUM` | Premium プランの Stripe Price ID |
| `STRIPE_PRICE_ID_GOLD_10K` | ゴールド 10,000G パッケージの Stripe Price ID |
| `STRIPE_PRICE_ID_GOLD_50K` | ゴールド 50,000G パッケージの Stripe Price ID |

---

## 8. 実装状態

<!-- v13.5 (2026-06-02): UGC枠管理、ゴールド枠追加機能、およびUI・モバイル対応の実装完了 -->

| 機能 | 状態 |
|---|---|
| 匿名ログイン（Anonymous Sign-in） | ✅ 実装済み |
| Google OAuth (New Game / Continue) | ✅ 実装済み |
| linkIdentity (テストプレイ→OAuth紐付け) | ✅ **実装済み** |
| `subscription_tier` カラム追加 | ✅ 実装済み |
| `is_subscriber` 廃止 | ✅ 実装済み |
| POST /api/billing/checkout（サブスク・ゴールド） | ✅ 実装済み |
| POST /api/webhooks/stripe（冪等性チェック含む） | ✅ 実装済み |
| Tier別機能制限の動的適用（UGC枠等） | ✅ 実装済み |
| 英霊登録FIFO | ✅ 実装済み |
| ゴールド購入 バックエンド（checkout / webhook） | ✅ 実装済み |
| ゴールド購入 フロントエンドUI（AccountSettingsModal） | ✅ **実装済み** |
| プランアップグレードUI（AccountSettingsModal） | ✅ **実装済み** |
| 英霊ロイヤリティ強化（Tierベース: Basic=25%, Premium=35%） | ✅ **実装済み** |
| Weeklyログインボーナス（Basic=2,000G/週, Premium=5,000G/週） | ✅ **実装済み** |
| プロフィール装飾（Tierバッジ: Basic=⚡, Premium=👑） | ✅ **実装済み** |
| キャラクタースロット上限チェック | ⏳ **未実装（Phase 2）** |
| UGC Workshop ステータスパネル | ✅ **実装済み** (縦3段積み、ローディング・キャッシュ最適化) |
| UGC ゴールド枠追加（purchase-slot API） | ✅ **実装済み** |
| UGC 使用状況API（usage API） | ✅ **実装済み** |

---

## 9. 既知の問題点・修正待ちバグ (Known Issues)

整合性チェック（2026-04-07）で発見された問題点を記録する。実装時は優先度順に対応すること。

### 🟢 Bug-1: 解約時に `user_id` が取得できずダウングレード処理が失敗する [修正済み]

**影響度**: 高（サブスクを解約しても課金状態がDBに反映されない）

**対応状況 (2026-06-05 修正完了)**:
- `billing/checkout/route.ts` でセッション作成時に `customer_email: user.email` を指定し、Stripe 顧客のメールアドレスを Google 連携メールアドレスと統一。
- `webhooks/stripe/route.ts` の `checkout.session.completed` 受信時に、動的に `stripe.customers.update` を実行して顧客オブジェクトの `metadata.user_id` に `userId` を設定するように修正。
- これにより、カスタマーポータル（`/api/billing/portal`）呼び出し時に、メールアドレスによる検索、およびメタデータ `user_id` による検索の両方のルートで確実に顧客情報が特定できるようになり、解約・変更処理が完全に動作することを確認。

---

### 🟡 Bug-2: UGC保存枠の上限値が仕様と +1 ずれている

**影響度**: 中（Freeユーザーが仕様上3件のところ4件まで保存できてしまう）

**原因**:
`ugc/save/route.ts` L149 のドラフト上限値が以下のようになっており、仕様書（§4）の値と1件ずつズレている。

| Tier | 仕様書（正） | 実装（誤） |
|---|---|---|
| `free` | 3件 | 4件 |
| `basic` | 10件 | 12件 |
| `premium` | 50件 | 52件 |

また、カウント方法が `rewards._ugc_meta.creator_id` のJSONB内フィールドを全件スキャンする非効率な実装になっている（`creator_id` カラムが追加済みなので直接フィルタすべき）。

**修正方針**:
```typescript
// 修正前
const draftLimit = tier === 'premium' ? 52 : tier === 'basic' ? 12 : 4;
// 修正後
const draftLimit = tier === 'premium' ? 50 : tier === 'basic' ? 10 : 3;
```

カウントも以下に変更:
```typescript
const { count: draftCount } = await supabase
    .from('scenarios')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', userId)
    .in('status', ['draft']);  // draft のみカウント
```

**対応ファイル**:
- `src/app/api/ugc/save/route.ts`

---

### 🟡 Bug-3: キャラクタースロット上限チェックが未実装

**影響度**: 低〜中（現在の実装では実質的に問題が発生しない）

**調査結果（2026-04-07）**:
キャラクター作成フローは `src/app/title/page.tsx` の `handleNewGame()` にあり、毎回 `supabase.auth.signOut()` → `signInAnonymously()` で**新規UUIDを発行**してからプロフィールを作成する設計になっている。
現状では `auth.users.id : user_profiles.id = 1:1` の関係が強制されているため、Free ユーザーが複数キャラクターを同一アカウントに紐付けることは**現在の実装上不可能**である。

**将来的な実装方針**:
複数キャラクタースロット機能（Basic:3枠 / Premium:5枠）の実現には、以下のアーキテクチャ変更が必要:
1. OAuth連携ユーザーの auth.users.id と複数の user_profiles を 1:N で紐付けるスキーマの設計
2. `Continue / Transfer` ボタンと組み合わせた「既存キャラ選択 → 再ログイン」フローの実装
3. `/api/profile/init` でのスロット上限チェック追加

**現在の対応**: 機能として未実装だが、現構造上の被害は発生しない。別スプリントでの実装を推奨。

---

## 10. v27.0 改訂: 設定画面改善 (2026-05-18)

### 10.1 課金確認ポップアップ（PurchaseConfirmModal）

特商法に基づく最終確認画面として、プランアップグレード・ゴールド購入の前に確認ポップアップを表示する。

**サブスクリプション確認画面の表示内容**:
- プラン名と月額料金
- 「毎月自動更新」の明記
- 無料トライアル期間（7日間）
- 特典一覧（キャラスロット、英霊、Weekly等）
- 利用規約・特商法ページへのリンクと同意チェックボックス

**ゴールド購入確認画面の表示内容**:
- パッケージ名、付与ゴールド量、価格
- 「一度限りの購入（自動更新なし）」の明記

**実装ファイル**: `src/components/ui/PurchaseConfirmModal.tsx`

### 10.2 billing/checkout API の JWT 認証化

`POST /api/billing/checkout` に JWT 認証を追加。

| 項目 | 旧 | 新 |
|:---|:---|:---|
| ユーザー特定 | body.userId（クライアント指定） | JWT トークンの `auth.getUser(token)` |
| 認証 | なし | Bearer トークン必須（401を返す） |

### 10.3 Stripe Customer Portal API

新規 API `POST /api/billing/portal` を追加。有料プランユーザーがプラン変更・解約を行うためのStripe Customer Portal URLを発行。

**実装ファイル**: `src/app/api/billing/portal/route.ts`

### 10.4 汎用確認ダイアログ（ConfirmDialog）

`window.confirm()` の代替として、ゲーム世界観に合わせたダークファンタジーUIの確認ダイアログを新設。

- 3バリアント: `danger` / `warning` / `default`
- アイコン、タイトル、メッセージ、確認/キャンセルボタン

**実装ファイル**: `src/components/ui/ConfirmDialog.tsx`
**適用箇所**: AccountSettingsModal の「タイトルに戻る」（匿名/連携の両パターン）

### 10.5 プラン詳細表示

設定画面の「プラン」セクションに詳細展開UI（アコーディオン）を追加。月額、キャラスロット数、英霊登録数、Weeklyボーナスをティアごとに表示。

### 10.6 avatar API の x-user-id 全廃

`character/avatar/route.ts` の PATCH / POST 両メソッドから `x-user-id` フォールバックを削除。フロント側（AccountSettingsModal）の送信も削除。

### 10.7 実装状態（更新）

| 機能 | 状態 |
|---|---|
| 課金確認ポップアップ（PurchaseConfirmModal） | ✅ **実装済み** |
| billing/checkout JWT認証 | ✅ **実装済み** |
| Stripeカスタマーポータル（billing/portal） | ✅ **実装済み** |
| 汎用ConfirmDialog | ✅ **実装済み** |
| プラン詳細表示 | ✅ **実装済み** |
| avatar API x-user-id廃止 | ✅ **実装済み** |
