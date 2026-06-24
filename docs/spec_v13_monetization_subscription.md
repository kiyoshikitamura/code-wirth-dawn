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
| Weeklyログインボーナス | なし | **2,000G ＋ 知識と契約の鍵x1 ＋ 魔道と知識の鍵x1 / 週** | **5,000G ＋ 知識と契約の鍵x3 ＋ 魔道と知識の鍵x2 / 週** |
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
- **1回限定の制限**:
  - 無料トライアル（7日間）は、BasicおよびPremiumプランを通じて**1アカウントあたり生涯で1回のみ**に制限される。
  - ユーザーが一度でもトライアル契約（`trialing`）または通常契約（`active`）を開始した時点で、DBの `user_profiles.has_used_trial` フラグが `true` に更新される。
  - Checkout Session 作成前に `has_used_trial` を検証し、すでに消費済みの場合は `trial_period_days` オプションを指定せずに Checkout Session を作成し、即時課金を開始する。
- **Weeklyゴールドボーナスの付与タイミング**:
  - 無料トライアル（`trialing`）期間中は、毎週のゴールドボーナス（Basic: 2,000G / Premium: 5,000G）は付与対象外（スキップ）となる。
  - 有料サブスクリプションの本課金（`active`）に移行した当日（加入日またはトライアル終了日）に、Stripe Webhook 経由で初回分ボーナスが即時付与され、同時に `last_weekly_bonus_at = NOW()` に初期化される。以降は daily-update 判定により、初日決済からちょうど7日後（および以降7日おき）にゴールドが自動的に付与される。


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
ユーザーがサブスクリプションを解約またはダウングレードした際、直ちに機能制限を適用するのではなく、すでに作成済みのキャラクター枠や登録済みの英霊は次回死亡/引退時まで維持される猶予処理を行う。

---

## 6. パッケージおよびゴールドの都度購入 (One-time Package & Gold Purchases)

### 6.1 商品ラインナップ

#### 6.1.1 アカウント限定パッケージ (1アカウントにつき1回のみ購入可能)
ユーザーはアカウント保護（Google等との連携）を完了している場合、以下の限定お得パッケージを1回限り購入できる。

| パッケージ名 | 価格（税込） | 内容アイテム | 実質価値換算 | 環境変数 |
|---|---|---|---|---|
| **スターターパック** | 880円 | 10,000 G ＋ 知識と契約の鍵 x5 ＋ 魔道と知識 of 鍵 x3 | 実質 40,000 G 分 | `STRIPE_PRICE_ID_STARTER_PACK` |
| **エリートパック** | 1,320円 | 30,000 G ＋ 知識と契約の鍵 x8 ＋ 魔道と知識 of 鍵 x5 | 実質 79,000 G 分 | `STRIPE_PRICE_ID_ELITE_PACK` |

* **購入制限判定**:
  - `user_profiles` テーブルに追加された `has_purchased_starter` / `has_purchased_elite` カラムでフラグ管理する。
  - フロントエンド、Checkout API (`/api/billing/checkout`)、Stripe Webhook (`/api/webhooks/stripe`) の各レイヤーで重複購入を防止・検証する。

#### 6.1.2 通常ゴールドパッケージ (購入回数の制限なし)
必要なゴールドを単品で都度購入することができる。

| パッケージ名 | 獲得ゴールド | 価格（税込） | 環境変数 | 説明 |
|---|---|---|---|---|
| **ゴールドパック・ミニ** | 10,000 G | 330円 | `STRIPE_PRICE_ID_GOLD_10K` | お手軽な初期ブースト用（旧スターターパック） |
| **スタンダードパック** | 30,000 G | 950円 | `STRIPE_PRICE_ID_GOLD_30K` | 標準的なパッケージ |
| **アドベンチャーパック** | 50,000 G | 1,430円 | `STRIPE_PRICE_ID_GOLD_50K` | コスパ重視向け |

> [!NOTE]
> 通常ゴールドパッケージの購入回数制限はない。スターターパック／エリートパックのみが「1回限り」の制限を受ける。

### 6.2 購入フローとセキュリティ

1. **購入トリガー**: 統合課金モーダル（`BillingModal.tsx`）からパッケージを選択し、「特定商取引法に基づく表示に同意する」にチェックを入れて購入ボタンを押下する。
2. **決済セッション発行**: `POST /api/billing/checkout` に `{ mode: 'payment', packageKey }` を送信する。
   - API側はJWT検証から `userId` を特定。
   - `packageKey` が `gold_starter` または `gold_elite` の場合、DBを検索してすでに `has_purchased_starter` または `has_purchased_elite` が `true` になっていないかチェックし、購入済みの場合は `400 Bad Request` で処理を遮断する。
   - Stripe Session 作成時の metadata に `package_key` として `'starter_pack'` または `'elite_pack'` を設定し、`gold_amount` も含める。
3. **Stripe決済画面**: Stripe決済ページへ遷移し、決済完了後 `/inn?billing=gold_success&amount=<付与G>&package=<packageKey>` にリダイレクトされる。
4. **Webhook付与処理**: Stripe Webhook (`checkout.session.completed`) でイベントを受信。
   - メタデータに `package_key` が含まれている場合、PostgreSQL RPC である `process_package_purchase` を呼び出す。
   - RPC内部でアトミックに「ゴールドの加算」「鍵アイテムのインベントリ追加 (upsert)」「購入済みフラグの `true` 更新」を行い、多重付与や二重購入をデータベースのトランザクションレベルで防ぐ。
   - `package_key` が含まれない通常ゴールド購入の場合は、従来通り `increment_gold` RPC にてゴールドのみを加算する。

### 6.3 UI実装箇所

| ファイル | 内容 |
|---|---|
| `BillingModal.tsx` | 統合課金モーダル。サブスクプラン表示および通常・限定都度課金パッケージの選択、1回限り購入済み商品の非活性化、特商法確認チェックのUIを実装。 |
| `billing/checkout/route.ts` | JWT認証、1回限り購入パッケージの事前チェック、Metadata追加。 |
| `webhooks/stripe/route.ts` | 限定パッケージのWebhookハンドリング、アトミック付与RPC `process_package_purchase` の呼び出し。 |

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
| `STRIPE_PRICE_ID_GOLD_30K` | ゴールド 30,000G パッケージの Stripe Price ID |
| `STRIPE_PRICE_ID_GOLD_50K` | ゴールド 50,000G パッケージ of the Stripe Price ID |

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
- **追記 (2026-06-24 追加修正)**: Stripeカスタマーポータルや外部決済UIから解約が行われた際、Stripeの Subscription オブジェクト自体に `metadata.user_id` が付与されない場合がある。この場合でも確実にユーザーを特定して即時解約を適用するため、Stripe Customer ID から顧客オブジェクトを逆引きして `customer.metadata.user_id` を参照するフォールバック処理を Webhook (`/api/webhooks/stripe`) に追加し、解約漏れバグを完全に防止した。

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
| キャラクター削除時のStripe自動解約 | ✅ **実装済み** |

---

## 11. v32.4 改訂: キャラクター削除時の Stripe サブスクリプション自動解約 (2026-06-13)

### 11.1 キャラクター削除（リセット）時の Stripe 自動解約
ユーザーがタイトル画面などから「キャラクター削除（リセット）」を実行した際、Stripe上にアクティブなサブスクリプション（Basic/Premiumプラン）が存在する場合は、自動的かつ即座に Stripe 側でもサブスクリプションの即時解約（`stripe.subscriptions.cancel`）を実行する。

* **実装API**: `POST /api/profile/reset`
* **解約判定ロジック**:
  1. `STRIPE_SECRET_KEY` が定義されている場合、Stripe SDK を初期化する。
  2. 削除対象のユーザーID（`userId`）に紐づく Stripe 顧客情報（Customer）をメールアドレスまたはメタデータから特定する。
  3. 該当の Stripe 顧客に紐づくサブスクリプションリストを取得し、`status` が `active` または `trialing` のものを即時解約する。
* **フォールバック設計**:
  Stripe APIの呼び出しに失敗（ネットワーク障害やAPI Keyの不備等）した場合でも、ユーザーのゲーム体験を阻害しないよう例外をキャッチして警告ログを出力し、データベース上のキャラクターデータ削除処理自体は正常に進める。

---

## 12. v38.0 改訂: 課金導線UIの分離と新規パッケージ (2026-06-24)

### 12.1 課金導線UIの分離再設計
従来は設定画面（`AccountSettingsModal`）に混在していた「ゴールド購入」および「プラン入会」のUIを完全に削除し、Stripeカスタマーポータルの起動ボタンのみを維持する。
新しく、設定画面とは独立した統合課金モーダル `BillingModal.tsx` を新設し、全ての課金（サブスクプラン紹介・加入手続き、通常およびアカウント限定都度課金パッケージの購入）をここに集約・カプセル化する。

### 12.2 統合課金モーダルへのアクセス導線
統合課金モーダル `BillingModal` へアクセスする導線を以下の箇所に新規配置する。
1. **宿屋ヘッダーおよびワールドマップヘッダー**: ⚙アイコンの左隣に「カード・コイン」を模した課金ボタンを追加し、クリック時に直接 `BillingModal` を起動させる。
2. **魔術学院 (AcademyModal)**: ゴールドまたは鍵が不足しており、カードパックの購入・開封が行えない場合、エラー文の隣に「ゴールド/鍵をチャージする」等の導線ボタンを動的に表示。クリック時に `BillingModal` をポップアップ起動し、ユーザーにチャージを促すシームレスなUXを構築する。

### 12.3 新規限定パッケージと購入制御
- 1アカウントにつき1回限り購入可能な「スターターパック (880円 / 実質40k G分)」および「エリートパック (1320円 / 実質79k G分)」を追加。
- アカウント限定チェックのバリデーションは、ゲーム側（サーバー Checkout API、フロントUIの非活性化、Stripe Webhook）の3層ガードで厳密に行う。
- 決済成功時のゴールドおよび鍵アイテムの付与は、DBレベルのトランザクションを保証する PostgreSQL RPC (`process_package_purchase`) により、アトミックに処理される。

### 12.4 既存加入者への鍵アイテム一括補填
サブスクリプション特典のアップデートに伴い、現在アクティブな既存加入者に対し、本来付与されるべきだった鍵アイテム（Basic: 知識と契約の鍵x1, 魔道と知識の鍵x1 / Premium: 知識と契約の鍵x3, 魔道と知識の鍵x2）を一度だけインベントリに補填付与するマイグレーション SQL (`20260624000001_compensate_existing_subscribers.sql`) を実行する。

### 12.5 実装状態（更新）

| 機能 | 状態 |
|---|---|
| 統合課金モーダル (`BillingModal.tsx`) | ✅ **実装済み** |
| 設定画面 (`AccountSettingsModal.tsx`) からの課金分離 | ✅ **実装済み** |
| ヘッダー（GlobalStatusBar, InnHeader）への課金導線配置 | ✅ **実装済み** |
| 魔術学院 (`AcademyModal.tsx`) でのゴールド/鍵不足チャージ遷移 | ✅ **実装済み** |
| アトミックなWeeklyサブスクボーナスRPC (`process_weekly_subscription_bonus`) | ✅ **実装済み** |
| アトミックなパッケージ購入処理RPC (`process_package_purchase`) | ✅ **実装済み** |
| Stripe Webhook での限定パッケージ処理とWeeklyボーナス鍵対応 | ✅ **実装済み** |
| 既存加入者への鍵アイテム一括補填SQL | ✅ **実装済み** |

### 12.6 プレビューテストに基づく追加仕様およびバグ修正 (2026-06-24)

プレビュー環境でのテストユーザーによる検証段階で発生した問題に対応するため、以下の追加仕様および修正を適用した。

#### 12.6.1 価格表記の「（税込）」統一
- 統合課金モーダル（`BillingModal`）および購入確認ポップアップ（`PurchaseConfirmModal`）に表示されるすべてのサブスクプラン金額および都度購入パッケージ金額に対し、例外なく「（税込）」を付与する。
  - 例: 「880円（税込）/月」「1,320円（税込）」

#### 12.6.2 同意チェックボックスの「購入確認ポップアップ」への完全移行
- 決済開始前の法的な確認の確実性を担保するため、「利用規約および特定商取引法に基づく表示への同意」チェックボックスを統合課金モーダル（`BillingModal`）から、購入ボタン押下直前の確認ポップアップ（`PurchaseConfirmModal`）へ全面的に移行する。
- ユーザーがチェックを入れない限り、Stripe 決済画面（Checkout URL）を発行するAPIの呼び出し自体を完全に無効化（ボタンの disabled 化）する。

#### 12.6.3 サブスクリプション重複移行エラーの解消
- Basic プラン加入中のユーザーが Premium プランを購入しようとする際、Stripe 側で `the price specified is inactive` などの不整合エラーが発生する問題の解決。
- `POST /api/billing/checkout` 内において、すでにアクティブなサブスクリプション（`active` または `trialing`）が存在するユーザーの場合は、Stripe API を用いて既存サブスクリプションの即時キャンセル（`stripe.subscriptions.cancel`）を実行し、同一の Stripe 顧客 ID をバインドして新規セッションを再発行する仕様。

#### 12.6.4 決済完了時アトミック報酬ダイアログの表示
- Stripe 決済が成功して宿屋（`/inn`）に戻った際、ユーザーに対して何がゲームに反映されたかを明示するための演出。
- URL パラメータ（`?billing=success` 等）をトリガーにして、アトミックに加算されたゴールド数と鍵数を算出して明記した「購入完了反映ダイアログ」を表示し、ゲーム内SE `se_item_get` を再生するとともに、`fetchUserProfile()` によって表示ゴールド・鍵数を即時更新する。

