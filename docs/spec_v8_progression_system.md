Code: Wirth-Dawn Specification v11.0 (Revised based on actual implementation)
# Progression System — Leveling, Growth, Deck Cost

## 1. 概要 (Overview)
キャラクターの成長ルール（EXP計算、レベルアップ時のステータス増加、デッキコスト制度）を定義する。

<!-- v11.0: questService.calculateGrowth()の実装定数に合わせて全面改訂 -->

---

## 2. 成長定数 (Growth Constants)
<!-- v11.0: questService.ts の実装値を正として記載 -->

```typescript
const BASE_HP = 80;            // Lv1時の基底HP → MaxHP = 80 + (Lv * 5) = Lv1で85
const HP_PER_LEVEL = 5;
const BASE_DECK_COST = 10;     // Lv1時の基底デッキコスト → MaxCost = 10 + (Lv * 2) = Lv1で12
const COST_PER_LEVEL = 2;
const MAX_ATK = 15;            // ATK上限
const MAX_DEF = 15;            // DEF上限
```

> **Note (v11.0)**: 旧仕様の `BASE_HP = 20` は実プレイ調整により `80` に変更。

---

## 3. レベルアップとEXP

### 3.1 EXP計算式
<!-- v11.0: calculateGrowth() の getNextExp を反映 -->
```
NextLevelExp = 50 * (CurrentLevel ^ 2)
```

| Level | Required EXP | Cumulative |
|---|---|---|
| 1 → 2 | 50 | 50 |
| 2 → 3 | 200 | 250 |
| 3 → 4 | 450 | 700 |
| 5 → 6 | 1,250 | 2,700 |
| 10 → 11 | 5,000 | 16,750 |

### 3.2 EXP獲得源
<!-- v11.0: quest/complete APIの実装を反映 -->
- **クエスト報酬**: `quest.rewards.exp` (JSONB) or fallback `difficulty * 20`
- **バトルボーナス**: `battleCount * 30` (クエスト履歴内のバトルノード数)

### 3.3 多段レベルアップ
`calculateGrowth()` は while ループで処理。一度のクエスト完了で複数レベルアップ可能。

---

## 4. ステータス成長ルール

### 4.1 レベルアップ時の自動成長
| ステータス | 増加 | 計算式 | 上限 |
|---|---|---|---|
| Max HP | +5 / Lv | `BASE_HP + (Level * HP_PER_LEVEL)` | なし |
| Max Deck Cost | +2 / Lv | `BASE_DECK_COST + (Level * COST_PER_LEVEL)` | なし |
| ATK | +1 / 3Lv (3, 6, 9...) | `level % 3 === 0` | 15 |
| DEF | +1 / 3Lv (3, 6, 9...) | `level % 3 === 0` | 15 |

### 4.2 レベルアップ時の特殊効果
<!-- v11.0: quest/complete API の実装を反映 -->
- **HP全回復**: `updates.hp = info.new_max_hp`（レベルアップ時にMaxHPまで回復）。

### 4.3 静的ステータス

| ステータス | 説明 | 変動ルール |
|---|---|---|
| Vitality (寿命) | 生命の残り時間 | 老化で減算のみ（加齢ロジック: v9仕様参照） |
| Hand Size | 手札上限 | **固定5枚**（仕様の段階的上昇は未実装） |

> **Note (v11.0)**: 旧仕様で定義されていた Hand Size の段階的上昇（Lv10: 4枚 → Lv20: 5枚）は**未実装**。現在は全レベルで5枚固定。

---

## 5. デッキコスト制度 (Deck Cost System)
<!-- v11.0: 実装のバリデーションロジックを反映 -->

### 5.1 概要
プレイヤーがバトルに持ち込むデッキには「コスト上限」がある。

### 5.2 ルール
```
sum(Card.cost for Card in EquippedDeck) <= user.max_deck_cost
```
- `max_deck_cost` は `BASE_DECK_COST + (Level * COST_PER_LEVEL)` で決定。
- 環境カード (`isInjected: true`) は Cost 0 扱い。
- NPCの `inject_cards` はコスト検証の対象外。

### 5.3 バリデーション
- クライアントサイド: `buildBattleDeck()` 内でコスト合計チェック。
- サーバーサイド: クエスト中のデッキ変更は `current_quest_id` の存在で禁止（未完全実装）。

---

## 6. UserProfile 関連フィールド
<!-- v11.0: types/game.ts の実装を反映 -->
```typescript
export interface UserProfile {
  level?: number;
  exp?: number;
  max_deck_cost?: number;
  max_hp?: number;
  hp?: number;
  atk?: number;         // 基礎攻撃力 (1-15)
  attack?: number;       // 旧フィールド (互換用)
  def?: number;          // 基礎防御力 (1-15)
  vitality?: number;
  max_vitality?: number;
  // ... other fields
}
```