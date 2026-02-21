Code: Wirth-Dawn Specification v11.0 (Revised based on actual implementation)
# Battle System & Data Architecture

## 1. 概要 (Overview)
本仕様書は、Code: Wirth-Dawn のバトルシステムの定義である。
バトルの大部分は**クライアントサイド（`gameStore.ts`）**で処理され、サーバーAPI (`/api/battle/turn`) は補助的な敵行動処理を担う。

<!-- v11.0: クライアントサイド主体の実装に合わせて全面改訂。drain_vit制限・multi-enemy対応を反映。 -->

**Core Philosophy:**
- **Determinism**: ダメージ計算に乱数やスケーリングを含めず、計算通りの結果を出力する（完全情報ゲーム）。
- **High Risk**: 敗北時のリソース全ロストと、回復しないVitality（寿命）による緊張感。

---

## 2. データアーキテクチャ (Data Architecture)

### 2.1 関連テーブル

| テーブル | 主要カラム | 用途 |
|---|---|---|
| `enemies` | slug, hp, atk, def, action_pattern (JSONB) | 敵データ定義 |
| `enemy_skills` | slug, name, value, effect_type, inject_card_id | 敵スキル定義 |
| `cards` | id, name, type, cost_val, effect_val, ap_cost, description | カードデータ |
| `items` | id, slug, name, type, base_price, effect_data (JSONB) | アイテム/スキル定義 |

### 2.2 フロントエンド型定義
<!-- v11.0: 実装のCard/Enemy型を反映 -->
```typescript
export type CardType = 'Skill' | 'Item' | 'Basic' | 'Personality' | 'Consumable' | 'noise';
export type TargetType = 'single_enemy' | 'all_enemies' | 'random_enemy' | 'self' | 'single_ally' | 'all_allies';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  description: string;
  cost: number;
  ap_cost?: number;
  power?: number;
  isEquipment?: boolean;
  source?: string;
  effect_id?: string;
  effect_duration?: number;
  target_type?: TargetType;
  discard_cost?: number;      // Noise廃棄コスト (AP)
  isInjected?: boolean;       // 環境カード (Cost 0扱い)
  cost_type?: 'mp' | 'vitality';
}

export interface Enemy {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  def?: number;
  slug?: string;
  traits?: string[];          // ['drain_vit'] 等
  vit_damage?: number;
  status_effects?: { id: string; duration: number }[];
  drop_rate?: number;
  drop_item_slug?: string;
}
```

---

## 3. バトル初期化 (Battle Initialization)
<!-- v11.0: gameStore.startBattle() の実装を反映 -->

`startBattle(enemiesInput: Enemy | Enemy[])` で初期化。

1. **Multi-Enemy対応**: 入力は単体 or 配列。最大6体配置可能。
2. **パーティ取得**: `GET /api/party/list` からDBのパーティメンバーを取得。
3. **デッキ構築**: 装備中インベントリアイテム (`is_equipped: true`) からカードを生成。
4. **パーティカード混入**: NPC の `inject_cards` からカードIDを解決し、デッキに追加。
5. **環境カード**: `buildBattleDeck()` 内で `worldState.status` に応じた注入処理。
6. **初期AP**: `current_ap: 5`。

### BattleState 構造
<!-- v11.0: 実装のBattleState型を反映 -->
```typescript
export interface BattleState {
  enemy: Enemy | null;          // 現在のターゲット
  enemies: Enemy[];             // 全敵リスト (v3.5: multi-enemy)
  party: PartyMember[];
  turn: number;
  current_ap: number;
  messages: string[];
  isVictory: boolean;
  isDefeat: boolean;
  currentTactic: 'Aggressive' | 'Defensive' | 'Standby';
  player_effects: StatusEffect[];
  enemy_effects: StatusEffect[];
  exhaustPile: any[];
  consumedItems: string[];
  vitDamageTakenThisTurn?: boolean;  // drain_vit 1ターン1回制限
  battle_result?: string;
}
```

---

## 4. ターン進行プロセス (Turn Sequence)

### 4.1 フェーズ詳細
1. **Draw Phase (ドロー)**: `dealHand()` — 手札上限5枚まで引く。山札不足時は捨て札をリシャッフル。山札+捨て札+手札 = 0枚の場合、Struggle カード (0 AP, 1 Dmg, 自傷1) を生成。
2. **Energy Phase (AP回復)**: `AP = Min(10, CurrentAP + 5)`。Stun状態時はAP回復なし。
3. **Action Phase (行動)**: APがある限り行動可能。
   - **Purge (ノイズ廃棄)**: `type: noise` のカードは `discard_cost`（デフォルト1 AP）を支払って手札から消滅（Exhaust）。
4. **End Phase (ターン終了)**: `endTurn()` — 状態異常の処理（Poison: HP -5%, Regen: HP回復）、バフ・デバフの期間減算。全敵に対して個別にtick処理。
5. **Party Phase (味方行動)**: `processPartyTurn()` — 各NPCがAI判定で行動。
6. **Enemy Phase (敵行動)**: `processEnemyTurn()` — 全生存敵が順に行動。

### 4.2 ターン制限 (Turn Limit)
<!-- v11.0: 実装のendTurn()を反映 -->
- **Limit**: 30ターン。
- **Result**: 30ターン経過時点で敵が生存している場合、`battle_result: 'time_over'` で **敗北** となる。

---

## 5. ダメージとステータス計算 (Deterministic Logic)

### 5.1 計算式（固定値・乱数なし）
<!-- v11.0: 実装のcalculateDamage()を反映 -->
```
BaseDamage = Card.Power + Player.ATK
BuffedDamage = BaseDamage * BuffMultiplier
FinalDamage = Max(1, BuffedDamage - Enemy.DEF)
```
- `User.ATK`: `userProfile.atk` または `userProfile.attack`（互換性のため両方チェック）。
- **Min Damage**: 最終値が0以下の場合、**1** に補正。

### 5.2 敵攻撃力計算
<!-- v11.0: processEnemyTurn()の実装を反映 -->
```
EnemyATK = Enemy.level * 5 + 10
MitigatedDamage = Max(1, EnemyATK - Player.DEF)
```

### 5.3 特殊ダメージ：Vitality (寿命)
<!-- v11.0: drain_vit制限の実装確認を反映（gameStore L1026） -->
- **Effect**: `drain_vit` トレイトまたは `vit_damage > 0` を持つ敵攻撃は、HPではなく `user.vitality` を直接減らす。
- **Damage Value**: 固定で **-1**。
- **Safety Cap (即死防止)**: `vitDamageTakenThisTurn` フラグにより、**1ターンにつき最大1回まで**（クライアントサイドで実装済み）。
- **Trigger条件**: `mitigated > 0 && newHp > 0 && hasDrainVit && !vitDamageTaken`。
- **永続化**: `POST /api/profile/consume-vitality` で即座にDBに反映。

---

## 6. リソースの永続性とロスト (Persistence & Risk)
<!-- v11.0: useQuestState.ts の実装を反映 -->

| Resource | Rule | 実装 |
|---|---|---|
| HP | Carry Over (持ち越し) | `useQuestState.playerHp` で管理 |
| AP / Deck | Reset | バトルごとに初期化 |
| Loot / EXP | Risk (全ロスト) | `useQuestState.lootPool` — 敗北時に空配列化 |
| NPC | Permadeath (消滅) | `useQuestState.deadNpcs` — HP0で `is_active: false` に更新 |
| Consumables | Consumed | `useQuestState.consumedItems` で追跡 |

---

## 7. システム間干渉の解決 (Conflict Resolution)

### 7.1 環境カード介入 (World Injection)
- 環境カード（Injection Cards）は**デッキコスト計算の対象外（Cost 0扱い）**。
- `buildBattleDeck()` のバリデーション後に挿入。
- `isInjected: true` フラグで識別。

### 7.2 汚染カード対策 (Noise Handling)
<!-- v11.0: attackEnemy()内のNoise処理を反映 -->
- 全 `type: noise` カードに「廃棄 (Purge)」アクションが付与されている。
- Cost: `card.discard_cost ?? 1` AP。
- Effect: そのカードを `exhaustPile` に移動（ゲームから除外）。

### 7.3 残影の不正利用防止 (Shadow Constraints)
- Shadow登録時、消費アイテム (`type: consumable`) の登録を禁止。
- Shadowはスキルカード (`type: skill`) のみ使用可能。

---

## 8. ターゲットとAI挙動 (Targeting)

### 8.1 プレイヤーのターゲット選択
<!-- v11.0: gameStore の targetId 解決ロジックを反映 -->
- 指定なしの場合、`battleState.enemy` (現在のターゲット) を使用。
- ターゲットが死亡している場合、最初の生存敵に自動スイッチ。
- `setTarget(enemyId)` でターゲット変更可能。

### 8.2 敵の攻撃ルーティング
<!-- v11.0: routeDamage() を反映 -->
- 各NPCの `cover_rate` に基づき確率で庇う。
- 庇った場合 NPC がダメージを受ける（NPC.DEF で軽減）。

### 8.3 状態異常
- `stun`: 行動不能（AP回復なし）。
- `poison`: ターン終了時 HP -5% (Min 1)。
- `regen`: ターン終了時 HP +回復。
- `atk_up` / `def_up`: 攻撃/防御バフ。
- `bleed`: カード使用時に追加自傷。

---

## 9. サーバーサイド補助API

### 9.1 POST /api/battle/turn
<!-- v11.0: 現実装のサーバーAPIを反映 -->
敵ターンの処理を行うサーバーAPI（クライアントサイド処理と併用）。

- 敵スキルの `action_pattern` に基づく条件付きスキル選択。
- `effect_type: 'inject'` でデッキ注入。
- `effect_type: 'drain_vit'` でVitality攻撃。
- Meat Shield ロジック（NPC `cover_rate` による庇い）。

> **Note (v11.0)**: 現在、バトルの主要ロジック（ダメージ計算、ターン進行、勝敗判定）は全てクライアントサイド（`gameStore.ts`）で処理されている。サーバーAPIは補助的な使用に留まる。