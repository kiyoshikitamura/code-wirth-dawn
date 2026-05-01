Code: Wirth-Dawn Specification v16.1 (Progression System)
# Progression System — Leveling, Growth, Deck Cost

## 1. 概要 (Overview)
キャラクターの成長ルール（EXP計算、レベルアップ時のステータス増加、デッキコスト制度）を定義する。

<!-- v15.0: HP/ATK/DEFを全体的に上方修正。ATK/DEFの上限を廃止、毎レベルランダム加算に変更。DeckCost上限を30に変更。 -->
<!-- v16.0: DeckCost成長速度をLv×2→Lv×1に減速、上限を30→40に拡張。手札上限にLv20+(6枚)とLv30+(7枚)の段階を追加。 -->
<!-- v16.1: NPC等のステータスインフレに合わせ、HP基底値を100に引き上げ。レベルアップ時のHP成長率をレベル帯ごとの可変式に変更。 -->

---

## 2. 成長定数 (Growth Constants)
<!-- v16.1: HP可変成長ロジックに更新 -->

```typescript
const BASE_HP_MIN = 100;       // キャラクター作成時の基底HP（v16.1で85→100に引き上げ）
const BASE_DECK_COST = 8;      // Lv1時の基底デッキコスト
const COST_PER_LEVEL = 1;      // v16.0: レベルあたりのデッキコスト増加（旧: 2）
const MAX_DECK_COST = 40;      // v16.0: デッキコスト上限（旧: 30。Lv32で到達）

// HP成長: レベル帯ごとの可変成長率 (v16.1)
function getHpLevelGain(level: number) {
    if (level < 10) return { min: 10, max: 12 }; // 平均11
    if (level < 20) return { min: 9, max: 11 };  // 平均10
    if (level < 30) return { min: 7, max: 9 };   // 平均8
    return { min: 6, max: 8 };                   // 平均7
}

// ATK/DEF: 上限廃止（v15.0）。毎レベルにランダム加算。
```

> **Note (v15.0)**: `MAX_ATK = 15` / `MAX_DEF = 15` の上限は廃止された。ATK/DEFは毎レベルアップでランダムに加算され、上限なしで成長する。

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
<!-- v15.2: メインクエストにexp固定値を追加（フォールバック依存を廃止） -->
- **クエスト報酬**: `quest.rewards.exp` (JSONB) — 各クエストに固定値を定義
  - フォールバック（未定義時）: `difficulty * randInt(10, 50)` — **非推奨、新規クエストには必ず`exp`を明示すること**
- **バトルボーナス**: `battleCount * randInt(100, 200)` (クエスト履歴内のバトルノード数)

> **v15.2 変更点**: メインクエスト(6001-6020)全てに`rewards.exp`を定義済み。フォールバック式はUGC/レガシークエスト向けの互換措置として残置。

#### メインクエストEXP一覧

| Quest ID | タイトル | Lv | Gold | **EXP** | Rep |
|---|---|---|---|---|---|
| 6001 | 始まりの轍 | 1 | 150 | **80** | 5 |
| 6002 | マーカンドへの道 | 2 | 200 | **100** | 5 |
| 6003 | 裏路地の剣 | 3 | 300 | **120** | 10 |
| 6004 | 疑惑の依頼 | 4 | 400 | **150** | 10 |
| 6005 | 夜討ちの旗印 | 5 | 600 | **200** | 15 |
| 6006 | 砂漠の遺跡 | 6 | 700 | **250** | 10 |
| 6007 | 嵐の夜の決断 | 7 | 800 | **300** | 10 |
| 6008 | 宵闇の襲撃 | 8 | 900 | **350** | 10 |
| 6009 | 仮面の商人 | 9 | 1,000 | **400** | 10 |
| 6010 | 国境を越えて | 10 | 1,500 | **500** | 20 |
| 6011 | 龍虎の対峙 | 11 | 2,000 | **600** | 15 |
| 6012 | 黄河の大防衛戦 | 12 | 2,500 | **700** | 15 |
| 6013 | 不死の傭兵王 | 13 | 3,500 | **800** | 20 |
| 6014 | 天地の剣 | 14 | 4,000 | **900** | 20 |
| 6015 | 聖都への巡礼 | 15 | 5,000 | **1,200** | 30 |
| 6016 | 奈落の胎動 | 16 | 6,000 | **1,500** | 20 |
| 6017 | 天上からの使者 | 18 | 7,000 | **2,000** | 25 |
| 6018 | 背信の代償 | 20 | 8,000 | **2,500** | 30 |
| 6019 | 天空の裁断 | 22 | 10,000 | **3,500** | 40 |
| 6020 | 神討つ者 | 25 | 15,000 | **5,000** | 50 |

### 3.3 多段レベルアップ
`calculateGrowth()` は while ループで処理。一度のクエスト完了で複数レベルアップ可能。

---

## 4. ステータス成長ルール

### 4.1 レベルアップ時の自動成長

<!-- v16.0: DeckCost成長速度をLv×1に減速、上限を40に拡張 -->

| ステータス | 増加 | 計算式 | 上限 |
|---|---|---|---|
| Max HP | `+randInt(3, 6)` / Lv | `baseStat.max_hp + hpIncrease` (累積加算) | なし |
| Max Deck Cost | `+1` / Lv | `BASE_DECK_COST + (Level * COST_PER_LEVEL)` | **40** |
| ATK | `+randInt(0, 2)` / Lv | 毎レベルで加算 | **なし** |
| DEF | `+randInt(0, 2)` / Lv | 毎レベルで加算 | **なし** |

> **v16.0 変更点:**
> - Max Deck Cost: Lv×2(上限30, Lv11到達) → **Lv×1(上限40, Lv32到達)**
> - 中盤〜終盤(Lv11-32)でデッキコストが成長し続け、レベルアップの実感を維持

| Lv | max_deck_cost |
|-----|---------------|
| 1 | 9 |
| 5 | 13 |
| 10 | 18 |
| 15 | 23 |
| 20 | 28 |
| 25 | 33 |
| 30 | 38 |
| 32+ | 40（上限） |

**実装例 (`calculateGrowth` 内):**
```typescript
// HP: ランダム増加
const hpGain = Math.floor(Math.random() * 4) + 3; // randInt(3, 6)
hpInc += hpGain;

// ATK/DEF: 毎レベルランダム加算（上限なし）
atkInc += Math.floor(Math.random() * 3); // randInt(0, 2)
defInc += Math.floor(Math.random() * 3); // randInt(0, 2)

// Deck Cost: 上限 40 に制限（v16.0: Lv×1成長）
const newCost = Math.min(40, BASE_DECK_COST + (level * COST_PER_LEVEL));
```

### 4.2 レベルアップ時の特殊効果
<!-- v11.0: quest/complete API の実装を反映 -->
- **HP全回復**: `updates.hp = info.new_max_hp`（レベルアップ時にMaxHPまで回復）。

### 4.2.1 レベルアップUI表示仕様
クエスト完了時にレベルアップが発生した場合、QuestResultModal内のキャラクター変化セクションに以下の数値を表示する:

| 項目 | 表示例 | APIフィールド |
|------|--------|---------------|
| レベル変化 | Lv.2 ▸ Lv.3 | `level_up.new_level` |
| 最大HP増加 | 最大HP +5 (90) | `level_up.hp_increase`, `level_up.new_max_hp` |
| ATK増加 | ATK +1 | `level_up.atk_increase` |
| DEF増加 | DEF +1 | `level_up.def_increase` |
| デッキコスト | デッキコスト 12 | `level_up.new_max_cost` |

増加値が0の項目は非表示。

### 4.3 静的ステータス

| ステータス | 説明 | 変動ルール |
|---|---|---|
| Vitality (寿命) | 生命の残り時間 | 老化で減算のみ（加齢ロジック: spec_v10参照） |
| Hand Size | 手札上限 | **レベル連動で段階的に拡張**（下記参照） |

### 4.4 老化によるATK/DEF減衰
<!-- v12.1: 実装意図を明記 -->

| 年齢帯 | Vit減衰 | ATK/DEF減衰 | 実装動作 |
|---|---|---|---|
| 40歳帯 (40-49) | -2/年 | -1 / 2年ごと | **偶数年齢に到達した年に発動** (40, 42, 44...) |
| 50歳帯 (50-59) | -5/年 | -1 / 1年ごと | 毎年発動 |
| 60歳以上 | -10/年 | -2 / 1年ごと | 毎年発動 |

> ATK/DEFの減衰は、高レベルで積み上げた値から削られていく。上限廃止により高齢でも高ステータスが維持されやすくなったが、減衰リスクとのバランスが重要。

#### Hand Size 値一覧 (spec v16 更新)

| レベル | 手札枚数 |
|---|---|
| Lv 1 〜 4 | 4枚 |
| Lv 5 〜 19 | 5枚 |
| Lv 20 〜 29 | 6枚 |
| Lv 30以上 | 7枚 |

> **v16.0 変更**: 手札拡張のタイミングを後ろにずらし、中盤〜終盤の成長感を維持。Lv10で即6枚だった旧仕様から、Lv20で6枚、Lv30で7枚に変更。

実装: `battleSlice.dealHand()` 内で `GROWTH_RULES.HAND_SIZE_BY_LEVEL` を追従。（旧: `gameStore.dealHand()` / v1.0 リファクタリングにより `src/store/slices/battleSlice.ts` に移動）
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
- `max_deck_cost` は `min(40, BASE_DECK_COST + (Level * COST_PER_LEVEL))` で決定。
- 環境カード (`isInjected: true`) は Cost 0 扱い。
- NPCの `inject_cards` はコスト検証の対象外（ただし注入上限6枚）。
- **Lv32 到達時点で MAX_DECK_COST = 40 に達し、それ以降は増加しない。**

### 5.3 デッキ構築改善（v16.0）

| ルール | 内容 |
|--------|------|
| **最小デッキ枚数** | `max(手札上限×2, 12)`枚。不足分は基本カード(ID 1-10)からランダム補充 |
| **パーティ注入上限** | NPC inject_cards の合計は最大 **6枚** |
| **装備枚数ボーナス** | 6枚以上: AP+1 / 8枚以上: AP+1,初ターン手札+1 / 10枚以上: AP+2,初ターン手札+1 |

### 5.3 バリデーション
- クライアントサイド: `buildBattleDeck()` 内でコスト合計チェック。
- サーバーサイド: `bypass_lock` オプションにより特例で許可（campノード）。

---

## 6. UserProfile 関連フィールド
<!-- v11.0: types/game.ts の実装を反映 -->
```typescript
export interface UserProfile {
  level?: number;
  exp?: number;
  max_deck_cost?: number;     // min(40, BASE_DECK_COST + level * COST_PER_LEVEL)
  max_hp?: number;            // 累積加算（各Lvで randInt(3,6) 増加）
  hp?: number;
  atk?: number;               // 上限なし（毎Lv +0〜2、老化で減衰）
  def?: number;               // 上限なし（毎Lv +0〜2、老化で減衰）
  vitality?: number;
  max_vitality?: number;
  quest_started_at?: string;  // クエスト開始日時 (デッキロック等に使用)
  // ... other fields
}
```

---

## 7. 変更履歴

| バージョン | 日付 | 主な変更内容 |
|---|---|---|
| v11.0 | 2026-04 | questService.calculateGrowth()の実装定数に合わせて全面改訂 |
| v12.1 | 2026-04 | BASE_DECK_COSTを10→8に修正 |
| **v15.0** | **2026-04-13** | **HP増加をランダム化(+3〜6/Lv)、ATK/DEF毎Lv加算(+0〜2)・上限廃止、DeckCost上限30に変更** |
| **v15.1** | **2026-04-23** | **レベルアップUI表示仕様追加（HP/ATK/DEF/コスト数値表示）** |
| **v15.2** | **2026-04-24** | **メインクエスト(6001-6020)全20件にrewards.expを定義。フォールバックランダム式への依存を廃止。EXP一覧テーブル追加** |
| **v16.0** | **2026-04-28** | **DeckCost成長速度をLv×1に減速（旧:×2）、上限を40に拡張（旧:30、Lv32到達）。手札上限にLv20+(6枚)/Lv30+(7枚)段階追加。デッキ構築改善（最小12枚/NPC注入上限6枚/装備枚数ボーナス）追加** |