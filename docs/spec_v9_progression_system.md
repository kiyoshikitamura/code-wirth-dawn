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
const BASE_DECK_COST = 8;     // Lv1時の基底デッキコスト → MaxCost = 8 + (Lv * 2) = Lv1で10
const COST_PER_LEVEL = 2;
const MAX_ATK = 15;            // ATK上限
const MAX_DEF = 15;            // DEF上限
```

> **Note (v12.1)**: `BASE_DECK_COST` は実装値の `8` を正とする。`game_rules.ts` 定義値または実装と一致している。
> 旧記述（`BASE_DECK_COST = 10`）は誤りだったため削除された。

---

## 3. レベルアップとEXP

### 3.1 EXP計算式
<!-- v15.0: game_rules.ts EXP_FORMULA の実装値に合致（50 × Lv²）-->
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
| Hand Size | 手札上限 | **レベル連動で段階的に拡張**（下記参照） |

### 4.2 老化によるATK/DEF減衰
<!-- v12.1: 実装意図を明記 -->

| 年齢帯 | Vit減衰 | ATK/DEF減衰 | 実装動作 |
|---|---|---|---|
| 40歳帯 (40-49) | -2/年 | -1 / 2年ごと | **偶数年齢に到達した年に発動** (40, 42, 44...) |
| 50歳帯 (50-59) | -5/年 | -1 / 1年ごと | 毎年発動 |
| 60歳以上 | -10/年 | -2 / 1年ごと | 毎年発動 |

**`processAging()` 実装注意**: 40歳帯のATK/DEF減衰は `if (newAge % 2 === 0)` で判定しているため、正確には「2年ごと」ではなく「偶数年齢となる導年က00に発動」が正展。
界善には無視できる差异だが、少なくとも実装の意図を了解するための記述である。

#### Hand Size 値一覧 (spec v15 更新)

| レベル | 手札枚数 |
|---|---|
| Lv 1 〜 4 | 4枚 |
| Lv 5 〜 9 | 5枚 |
| Lv 10以上 | 6枚 |

実装: `gameStore.dealHand()` 内で `GROWTH_RULES.HAND_SIZE_BY_LEVEL` を追従。
* 【UI/モバイル対応】SPA化に伴い、レベル10以上の最大6枚の手札は、画面下部の領域に扇状（Fan Layout）で重ねて配置およびホバー拡大変換される仕様とした。

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
- クライアントサイド: `buildBattleDeck()` 内でコスト合計チェック、およびシナリオの一時的な`camp`ノードでの特例解除。
- サーバーサイド: `current_quest_id` と `quest_started_at` を元に、クエスト開始前から所持しているアイテムの装備変更（`is_equipped: true` にする操作）を禁止。`camp`ノード滞在時に付与される `bypass_lock` オプションにより特例で許可。

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
  def?: number;          // 基礎防御力 (1-15)
  vitality?: number;
  max_vitality?: number;
  quest_started_at?: string; // クエスト開始日時 (デッキロック等に使用)
  // ... other fields
}
```