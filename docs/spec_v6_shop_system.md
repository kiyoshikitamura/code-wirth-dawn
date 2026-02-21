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

---

## 3. 購入ロジック

### 3.1 API: GET /api/shop
<!-- v11.0: 実装の価格計算ロジックを反映 -->
```
GET /api/shop?location_id={uuid}
Response: { items: ShopItem[] }
```

### 3.2 価格計算
```typescript
// 初心者保護 (Lv <= 5): 50%割引
const isNewbie = userLevel <= 5;
const finalPrice = isNewbie ? Math.floor(basePrice * 0.5) : basePrice;
```

> **Note (v11.0)**: 繁栄度によるインフレ係数は**未実装**。現在は `base_price` を直接使用（初心者保護のみ適用）。

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

> **Note (v11.0)**: `.limit(1)` は購入により同一アイテムが複数行存在する問題への対処。闇市ボーナスは**未実装**。

### 4.3 売却価格ルール

| 条件 | 売却価格 | 実装状態 |
|---|---|---|
| 通常 | `base_price / 2` | ✅ 実装済み |
| 崩壊拠点 (闇市) | `base_price * 1.5` | ❌ 未実装 |
| 裏切り売却 (key_item) | `base_price * 2` | ❌ 未実装 |

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
| `key_item` | ❌ | ❌ (将来) | ❌ | クエスト報酬 |