Code: Wirth-Dawn Specification v11.0 (Revised based on actual implementation)
# Shop System

## 1. 概要 (Overview)
本仕様書は、各拠点に存在するショップの購入・売却ロジック、UIフロー、および例外処理を定義する。

<!-- v11.0: 実装のShopModal.tsx, shop/route.ts, shop/sell/route.tsに合わせて全面改訂 -->

---

## 2. ショップ画面 (Shop UI)
<!-- v11.0: ShopModal.tsx コンポーネントの実装を反映 -->

### 2.1 レイアウト
- **タブ切替**: 「購入」 / 「売却」
- **購入タブ**: 拠点で販売中のアイテム一覧。
- **売却タブ**: プレイヤーの所持アイテム一覧（在庫のフラット表示）。
- **装備バッジ**: `is_equipped === true` のアイテムには "E" マークを表示。
- **闇市レイアウト (v13.0)**: 拠点の繁栄度 (`prosperity_level`) が 1（崩壊）である場合、ショップのUIは「闇市」レイアウトに切り替わる。通常のUIデザインから、暗く怪しいデザイン（専用NPC画像と専用台詞）に変更し、通常アイテムを完全に非表示にして「禁術の秘薬」等の闇市専用アイテムのみを表示する。

---

## 3. 購入ロジック

### 3.1 API: GET /api/shop
<!-- v11.0: 実装の価格計算ロジックを反映 -->
```
GET /api/shop?location_id={uuid}
Response: { items: ShopItem[] }
```

### 3.2 価格計算
<!-- v12.0 (Phase 2-A): インフレ係数と初心者保護の適用順序を正式定義 -->
```typescript
// ステップ1: 繁栄度インフレ係数を適用
const inflationMap = { 5: 1.0, 4: 1.0, 3: 1.2, 2: 1.5, 1: 3.0 };
let price = Math.floor(basePrice * inflationMap[prosperityLevel]);

// ステップ2: 初心者保護（Lv <= 5）は闇市アイテム以外に 50%割引（インフレ後に適用）
if (userLevel <= 5 && !item.is_black_market) price = Math.floor(price * 0.5);
```

> **Note (v12.0)**: `is_black_market` アイテム（禁術の秘薬等）は強力なゴールドシンクのため、初心者保護割引の対象外とする。

### 3.3 闇市専用アイテム (Black Market Exclusives)
<!-- v12.0 (Phase 2-A): 崩壊拠点での動作を正式仕様として追記 -->
- 拠点の繁栄度が「1（崩壊）」の場合のみ购入可能なアイテムが存在する。
- **崩壊拠点（Prosperity=1）では通常アイテムの表示をすべて非表示にする**。`GET /api/shop` は闇市アイテムのみを返却する。
- **禁術の秘薬** (`item_elixir_forbidden`): 失われた寿命 (Vitality) を 1 回復する超高額アイテム（50,000G）。
- **名声ロンダリング（身分洗浄） (v16)**: 「帳簿の改竄」等の特殊項目として提供。費用は `LAUNDERING_COST` (100,000G)。任意の拠点の名声を 0 にリセットする救済措置。


### 3.3 API: POST /api/shop (購入実行)
```
POST /api/shop
Body: { item_id: number, user_id: string }
```

処理:
1. ゴールド残高チェック。
2. `inventory` テーブルに**新規行を挿入**（同一アイテムの複数行が生じる）。
3. `user_profiles.gold` を減算。

---

## 4. 売却ロジック

### 4.1 API: POST /api/shop/sell
<!-- v11.0: 実装のsell APIを反映（bug fix後の正式仕様） -->
```
POST /api/shop/sell
Headers: { Authorization: Bearer <jwt> }
Body: { inventory_id: string }
```

### 4.2 売却処理フロー
1. **認証**: JWT から `user_id` を取得。Service Role Client で RLS をバイパス。
2. **在庫確認**: `inventory` テーブルから `id = inventory_id` かつ `user_id = userId` の行を `.limit(1)` で取得。
3. **装備チェック**: `is_equipped === true` の場合 → **売却拒否** (400エラー)。
4. **価格計算**: `sell_price = Math.floor(base_price / 2)`（固定50%換金）。
5. **在庫削除**: `inventory` テーブルから該当行を削除。
6. **ゴールド加算**: `user_profiles.gold` に `sell_price` を加算。

> **Note (spec v14 実装済み)**: `.limit(1)` は購入により同一アイテムが複数行存在する問題への対処。崩壊拠点（Prosperity=1）での**闇市売却ボーナス（base_price × 1.5）実装済み**。

### 4.3 売却価格ルール

| 条件 | 売却価格 | 実装状態 |
|---|---|---|
| 通常 | `base_price / 2` | ✅ 実装済み |
| 崩壊拠点 (闇市) | `base_price * 1.5` | ✅ 実装済み（`sell/route.ts` L93） |
| 裏切り売却 (クエスト関連) | `base_price / 2` | ✅ 実装済み（クエスト失敗＆名声-50ペナルティ） |
| UGCレプリカ (`is_ugc: true`) | `1 Gold` 固定 | ✅ エコシステム防衛用 |

---

## 5. 装備システム
<!-- v11.0: inventory PATCH APIの実装を反映 -->

### 5.1 装備トグル
```
PATCH /api/inventory
Headers: { 'x-user-id': string, 'Content-Type': 'application/json' }
Body: { item_id: string, is_equipped: boolean }
```

- `is_skill: true` のアイテムのみ装備可能（デッキに組み込まれる）。
- 装備中アイテムは売却不可。
- **重要**: `x-user-id` ヘッダーが必須（認証済ユーザーのデータのみ更新するため）。

---

## 6. アイテム種別ごとの挙動

| type | 購入可 | 売却可 | 装備可 | 備考 |
|---|---|---|---|---|
| `consumable` | ✅ | ✅ | ❌ | バトル中1回限り使用 |
| `trade_good` | ✅ | ✅ | ❌ | 売却専用 |
| `skill` | ✅ | ✅ | ✅ (`is_skill`) | デッキ装備 |
| `key_item` | ✅ (一部) | ❌ | ❌ | クエスト報酬、または許可証など |

### 6.1 通行許可証 (Pass) (v16)
首都への入場に必要な `consumable` 扱いの特殊アイテム。
- **価格**: 20,000G (インフレ適用前・エンドコンテンツの重みを持たせるための高額設定)。
- **販売場所**: 全地域のショップ。
- **有効期限**: 購入から 30日（ゲーム内経過日数ベース）。購入すると `user_profiles.pass_expires_at` に全首都共通のアクセス権が付与される。


---

## 5. インフレシステム (spec v14 実装済み)

各ロケーションの「繁栄度（prosperity）」に応じて、ショップ価格が動的に変動（インフレ）するシステム。

| 繁栄度 | 価格倍率 |
|---|---|
| 5 (最高) | 1.0x (基準額) |
| 4 | 1.0x |
| 3 (通常) | 1.2x |
| 2 | 1.5x |
| 1 (崩壊) | 3.0x (闇市価格適用前ベース) |

### 5.1 適用対象
*   **対象**: 鍛冶屋 (Blacksmith), 道具屋 (Item Shop), 宿屋 (Inn), 傭兵ギルド (Tavern).
*   **非対象**: 闇市 (Black Market) は独自の高額レートを持つため影響を受けない。
*   **UI表示**: 繁栄度に基づく現在の価格倍率を表示。

## 6. 利用制限とペナルティ (spec v14 実装済み)

### 6.1 出禁ペナルティ
*   **条件**: ロケーションの悪名（Reputation）が **-100以下**。
*   **効果**: 当該ロケーションのすべての施設（NPCとの取引）が利用不可。
    *   APIは `403 Forbidden` を返却する。
    *   **メッセージ**: 「我々の街から立ち去れ、小悪党め！お前との取引はご免だ。」

### 6.2 賞金首と賞金稼ぎ
*   **条件**: 悪名が -100以下のロケーションから「移動」を試みた場合。
*   **効果**: 移動処理が中断され、「賞金稼ぎ」エリートNPCとの戦闘が強制的に発生（`require_battle: 'bounty_hunter_ambush'`）。
    *   敗北時: 所持ゴールドの半分（50%）を没収される。