Code: Wirth-Dawn Specification v15.0 (Battle System v3.3)
# Battle System & Data Architecture

## 1. 概要 (Overview)

本仕様書は、Code: Wirth-Dawn のバトルシステムの定義である。バトルの大部分は**クライアントサイド（`battleSlice.ts` / 旧: `gameStore.ts`）**で処理され、サーバーAPI (`/api/battle/turn`) は補助的な敵行動処理を担う。

<!-- v14.0: HPバーリアルタイム同期（マーカー方式）、カードimage_url/description取得フロー改善、パーティHP修正 -->
<!-- v1.0 refactor: バトルアクションは src/store/slices/battleSlice.ts に移動 (2026-04-15) -->

**Core Philosophy:**
- **Determinism**: ダメージ計算に乱数やスケーリングを含めず、計算通りの結果を出力する（完全情報ゲーム）。
- **High Risk**: 敗北時のリソース全ロストと、回復しないVitality（寿命）による緊張感。

---

## 2. データアーキテクチャ (Data Architecture)

### 2.1 関連テーブル

| テーブル | 主要カラム | 用途 |
|---|---|---|
| `enemies` | slug, hp, atk, def, action_pattern, image_url | 敵データ定義 |
| `enemy_skills` | slug, name, value, effect_type, inject_card_id | 敵スキル定義 |
| `cards` | id, name, type, cost_val, effect_val, description, image_url, ap_cost, target_type, effect_id | カードデータ（v3.3: image_url/descriptionカラム追加済み） |
| `skills` | id, slug, name, card_id, image_url, description, base_price, deck_cost | スキルアイテム定義 |
| `user_skills` | id, user_id, skill_id, is_equipped | ユーザー装備スキル |
| `items` | id, slug, name, type, base_price, effect_data, image_url | アイテム/スキル定義 |

### 2.2 フロントエンド型定義

<!-- v12.0: StatusEffect に value フィールド追加（仕様書追記）を反映 -->

```typescript
export type CardType = 'Skill' | 'Item' | 'Basic' | 'Personality' | 'Consumable' | 'noise';
// ⚠ 重要な仕様変更 (Passiveの廃止):
// 永続的に効果を発動・管理する「Passive」型は実装・UIの複雑化を招くため完全に廃止する。
// 以降はすべて「APを払って発動・バフを付与する Support 型」などに統合される。
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
  image_url?: string;         // v3.3: バトルUIカード画像
}

// v3.0: StatusEffect に value フィールドを追加（仕様書追記）
export interface StatusEffect {
  id: StatusEffectId;
  duration: number;
  value?: number; // def_up: DEF加算値（effect_val）、atk_down: 未使用（固定0.7倍）
}

export type StatusEffectId =
  | 'atk_up' | 'def_up' | 'def_up_heavy' | 'taunt' | 'regen' | 'poison'
  | 'stun' | 'bind' | 'bleed' | 'bleed_minor' | 'fear' | 'stun_immune'
  | 'blind' | 'blind_minor' | 'evasion_up' | 'atk_down'
  | 'cure_status' | 'cure_debuff' | 'ap_max';

export interface Enemy {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  def?: number;
  slug?: string;
  traits?: string[];
  vit_damage?: number;
  status_effects?: StatusEffect[]; // v3.0: value込みStatusEffectを使用
  drop_rate?: number;
  drop_item_slug?: string;
  image_url?: string;
}
```

---

## 3. バトル初期化 (Battle Initialization)

<!-- v14.0: v3.3の実装を反映 -->

### バトル初期化の流れ

`startBattle(enemiesInput: Enemy | Enemy[])` で初期化。

1. **Multi-Enemy対応**: 入力は単体 or 配列。最大5体配置可能。
2. **パーティ取得**: `GET /api/party/list` からDBのパーティメンバーを取得。
3. **インベントリ取得（v3.3追加）**: `fetchInventory()` を必ず実行し、最新の image_url / description を含む装備スキルデータを取得する。キャッシュ（zustand persist）の古いデータを使わないための施策。
4. **デッキ構築**: 装備中インベントリアイテム (`is_equipped: true`) からカードを生成。`effect_data.image_url` / `effect_data.description` をカードに追加。
5. **カードのロールフェッチ（v3.3追加）**: NPCカードに加えて、基本カード（id=1、10: 攻撃・防具の礎等）もDBから `cards` テーブルより単独フェッチし `image_url` / `description` を充填。
6. **パーティカード混入**: NPC の `inject_cards` からカードIDを解決し、デッキに追加。
7. **環境カード**: `buildBattleDeck()` 内で `worldState.status` に応じた注入処理。
8. **初期AP**: `current_ap: 5`。
9. **装備ボーナス**: `battleSlice.equipBonus`（ストアレベルで管理）を `battleState.equipBonus` にコピー。
   - `fetchEquipment()` は `StatusModal` 起動時にストアを更新するため、バトル開始時に追加API呼び出し不要。
   - `getEffectiveAtk(userProfile, battleState)` および `getEffectiveDef` ヘルパー関数で実効値を算出。
10. **共鳴ボーナス**: 同拠点プレイヤーが存在している場合、`resonanceActive: true` → ATK/DEF +10%。
11. **【UI/モバイル対応】SPA挙動**: バトル画面は単独のページ遷移（`/battle`）を行わず、拠点・クエスト進行画面（`quest/[id]/page.tsx`）内にネストされた状態（`<BattleView />`）でSPAとしてシームレスに開閉される。

### BattleState 構造

<!-- v12.0: 実装のBattleState型を反映 -->

```typescript
export interface BattleState {
  enemy: Enemy | null;          // 現在のターゲット
  enemies: Enemy[];             // 全敵リスト (v3.5: multi-enemy)
  party: PartyMember[];
  turn: number;
  current_ap: number;
  messages: string[];           // v3.3: __hp_sync:NNN / __party_sync:ID:NNN マーカーを含む（非表示メッセージ）
  isVictory: boolean;
  isDefeat: boolean;
  currentTactic: 'Aggressive' | 'Defensive' | 'Standby';
  player_effects: StatusEffect[]; // v3.0: value込みStatusEffect
  enemy_effects: StatusEffect[];
  exhaustPile: any[];
  consumedItems: string[];
  vitDamageTakenThisTurn?: boolean;  // drain_vit 1ターン1回制限
  battle_result?: string;
  // v3.1: ボーナス管理（getEffectiveAtk/Defで使用）
  resonanceActive: boolean;          // 共鳴ボーナス: ATK/DEF +10%
  equipBonus: { atk: number; def: number; hp: number }; // 装備ボーナス合計
}
```

---

## 4. ターン進行プロセス (Turn Sequence)

### 4.1 フェーズ詳細

1. **Draw Phase (ドロー)**: `dealHand()` — 手札が上限枚数になるまで引く。山札不足時は捨て札をリシャッフル。
   - **手札上限**: Lv1-4: 4枚 / Lv5-9: 5枚 / Lv10+: 6枚（`HAND_SIZE_BY_LEVEL` 定義）
2. **Energy Phase (AP回復)**: `AP = Min(10, CurrentAP + 5)`。Stun/Bind状態時はAP回復なし。
3. **Action Phase (行動)**: APがある限り行動可能。
   - **Purge (ノイズ廃棄)**: `type: noise` のカードは `discard_cost`（デフォルト1 AP）を支払って手札から消滅（Exhaust）。
4. **End Phase (ターン終了)**: `endTurn()` — 状態異常の処理（Poison: HP -5%, Regen: HP回復）、バフ・デバフの期間減算。
5. **Party Phase (味方行動)**: `processPartyTurn()` — 各NPCがAI判定で行動。
6. **Enemy Phase (敵行動)**: `processEnemyTurn()` — 全生存敵が順に行動。（v3.0: スタン/blind/evasion_up対応）

### 4.2 ターン制限 (Turn Limit)

- **Limit**: 30ターン。
- **Result**: 30ターン経過時点で敵が生存している場合、`battle_result: 'time_over'` で **敗北** となる。

---

## 5. ダメージとステータス計算 (v3.0)

### 5.1 プレイヤーの攻撃ダメージ計算

<!-- v13.0: equipBonus.atk と resonanceActive を考慮した実効ATK計算を追記 -->

```
// 実効ATK計算（profileSlice getEffectiveAtk ヘルパー）
EffectiveATK = (userProfile.atk + battleState.equipBonus.atk)
               × (battleState.resonanceActive ? 1.1 : 1.0)

// ダメージ計算
BaseDamage = Card.Power + EffectiveATK
BuffedDamage = floor(BaseDamage × AtkMod)    // atk_up時: ×1.5
FinalDamage = Max(1, BuffedDamage - Enemy.DEF)  // 通常（貫通なし）
              or Max(1, BuffedDamage)            // 貫通（pierce）: DEF無効
```

- `AtkMod`: `atk_up` 効果時 1.5、それ以外 1.0。

### 5.2 敵の攻撃・プレイヤーへのダメージ計算（v3.0）

<!-- v12.0: def_up固定値化、atk_down/blind/evasion_up追加を反映 -->

```
// 敵スタン中チェック
if (enemy.stun || enemy.bind) → 行動スキップ

// 目眩（blind）ミス判定
if (enemy.blind)       → 50%でミス（行動スキップ）
if (enemy.blind_minor) → 30%でミス（行動スキップ）

// 敵の攻撃力算出
BaseEnemyATK = Enemy.level × 3 + 5
EnemyATK = floor(BaseEnemyATK × skill.value × AtkDownMod)
  // AtkDownMod: 敵にatk_downがあれば ×0.7、なければ ×1.0

// プレイヤー回避（evasion_up）
if (player.evasion_up) → 30%でミス（行動スキップ）

// ダメージ計算（v3.1: equipBonus.def と resonanceActive を考慮）
EffectiveDEF = (userProfile.def + battleState.equipBonus.def)
               × (battleState.resonanceActive ? 1.1 : 1.0)
DefSkillBonus = player_effects.def_up.value ?? 0   // StatusEffect.valueから取得
MitigatedDamage = Max(1, EnemyATK - EffectiveDEF - DefSkillBonus)
```

**v3.0の重要変更** — `def_up` の計算方式の変更:
- **旧方式（v2.x）**: `def_up` 効果時、ダメージに固定0.5倍軽減（全カード同一効果）
- **新方式（v3.0）**: `def_up.value`（カードの `effect_val`）をDEFに加算
  - `card_guard` (effect_val=10) → DEF+10
  - `card_holy_wall` (effect_val=20) → DEF+20
  - `card_iron_body` / `def_up_heavy` (effect_val=30) → DEF+30
  - `card_absolute_def` (effect_val=50) → DEF+50

### 5.3 スキルなし（フォールバック / `action_pattern` 未定義の場合）

```
EnemyATK = Enemy.level × 5 + 10
MitigatedDamage = Max(1, EnemyATK - Player.DEF - DefBonus)
```

### 5.4 特殊ダメージ：Vitality (寿命)

- **Effect**: `drain_vit` トレイトまたは `vit_damage > 0` を持つ敵攻撃は、HPではなく `user.vitality` を直接減らす。
- **Damage Value**: 固定で **-1**。
- **Safety Cap**: `vitDamageTakenThisTurn` フラグにより、**1ターンにつき最大1回まで**。
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

- 全 `type: noise` カードに「廃棄 (Purge)」アクションが付与されている。
- Cost: `card.discard_cost ?? 1` AP。
- Effect: そのカードを `exhaustPile` に移動（ゲームから除外）。

### 7.3 残影の不正利用防止 (Shadow Constraints)

- Shadow（英霊）登録時、`inject_cards` に保存できるのは **`type === 'skill'` のアイテムのみ**（✅ 実装済み）。
- `type: 'consumable'`（消費アイテム）は登録を厳密に禁止。
- `cost_type: 'vitality'`（寿命コストカード）は `type` チェックの段階で自動除外される。
- Free Tier ユーザーは英霊登録自体がスキップされる（`subscription_tier: 'free'` で制御）。

---

## 8. ターゲットとAI挙動 (Targeting)

### 8.1 プレイヤーのターゲット選択

- 指定なしの場合、`battleState.enemy` (現在のターゲット) を使用。
- ターゲットが死亡している場合、最初の生存敵に自動スイッチ。
- `setTarget(enemyId)` でターゲット変更可能。

### 8.2 敵の攻撃ルーティング

- 各NPCの `cover_rate` に基づき確率で庇う。
- 庇った場合 NPC がダメージを受ける（NPC.DEF で軽減）。

### 8.3 状態異常（v3.0 統合一覧）

<!-- v12.0: v3.0実装済みの全効果を追記 -->

| 効果 | 対象 | 詳細 |
|---|---|---|
| `stun` / `bind` | 敵/プレイヤー | 適用されたターン、行動不可。AP回復もなし。 |
| `poison` | 敵/プレイヤー | ターン終了時 HP -5% (Min 1)。 |
| `regen` | プレイヤー | ターン終了時 HP +5% (Min 1)。 |
| `atk_up` | プレイヤー | 攻ダメージ ×1.5。 |
| `def_up` / `def_up_heavy` | プレイヤー | **受けるダメージを `value` 分固定軽減**（value = effect_val）。 |
| `bleed` | プレイヤー | カード使用時に追加3ダメ。 |
| `bleed_minor` | プレイヤー | カード使用時に追加1ダメ。 |
| `blind` | 敵 | 敵の攻撃が50%でミス。 |
| `blind_minor` | 敵 | 敵の攻撃が30%でミス。 |
| `evasion_up` | プレイヤー | 敵の攻撃を30%で自動回避。 |
| `atk_down` | 敵 | 敵の攻撃ダメージが0.7になる。 |
| `cure_status` | — | 即時（Poison/bleed/stun等）を解除。 |
| `cure_debuff` | — | 即時（atk_down/blind等）を解除。 |
| `taunt` | プレイヤー | 敵の単体攻撃を引き受ける。 |
| `stun_immune` | プレイヤー | 次回スタン効果を1回無効化。 |

---

## 9. サーバーサイド補助API

### 9.1 POST /api/battle/turn

敵ターンの処理を行うサーバーAPI（クライアントサイド処理と併用）。

- 敵スキルの `action_pattern` に基づく条件付きスキル選択。
- `effect_type: 'inject'` でデッキ注入。
- `effect_type: 'drain_vit'` でVitality攻撃。
- Meat Shield ロジック（NPC `cover_rate` による庇い）。

> **Note (v13.0)**: 現在、バトルの主要ロジック（ダメージ計算、ターン進行、勝敗判定）は全てクライアントサイド（`battleSlice.ts`）で処理されている。
> `/api/battle/turn` は現在デッドコード状態だが、将来の不正防止・マルチプレイヤー対応のための「権威サーバー」能力として保持・整備する。

---

## 10. 装備ボーナスのバトルへの適用 (v3.1)

### 10.1 データの流れ

```
[装備タブ] 装備ボタン
    → POST /api/equipment → equipped_items テーブル
    → PATCH /api/inventory → inventory.is_equipped = true (同期)
    → fetchEquipment() → battleSlice.equipBonus / battleSlice.equippedItems 更新

[バトル開始時] (v3.3改善)
    → startBattle()
        → fetchInventory() を必ず実行（キャッシュ遮断）
        → get().equipBonus を battleState.equipBonus にセット
        → getEffectiveAtk/Def ヘルパーで実効値算出 → 攻撃・防御時に使用
```

### 10.2 ストアレベル管理

| フィールド | 場所 | 備考 |
|---|---|---|
| `equipBonus` | `GameState` | `{atk, def, hp}` 装備ボーナス合計 |
| `equippedItems` | `GameState` | 装備中アイテムオブジェクト一覧（UI表示用） |
| `fetchEquipment()` | `GameState` | `/api/equipment` を呼び store を更新 |

### 10.3 ヘルパー関数

```typescript
// src/store/slices/profileSlice.ts (旧: src/store/gameStore.ts)
// v1.0 リファクタリングにより profileSlice.ts に移動
function getEffectiveAtk(userProfile, battleState): number {
  const base = (userProfile?.atk ?? 1) + (battleState?.equipBonus?.atk ?? 0);
  return battleState?.resonanceActive ? Math.floor(base * 1.1) : base;
}

function getEffectiveDef(userProfile, battleState): number {
  const base = (userProfile?.def ?? 0) + (battleState?.equipBonus?.def ?? 0);
  return battleState?.resonanceActive ? Math.floor(base * 1.1) : base;
}

function getEffectiveMaxHp(userProfile, battleState): number {
  const base = (userProfile?.max_hp ?? 100) + (battleState?.equipBonus?.hp ?? 0);
  return battleState?.resonanceActive ? Math.floor(base * 1.1) : base;
}
```

---

## 11. 状態異常バッジ UI (v3.1)

### 11.1 概要

バトル画面において、有効な状態異常（buff / debuff）をアイコン上にリアルタイム表示する。
**実装コンポーネント**: `src/components/battle/StatusEffectBadges.tsx`

### 11.2 表示対象

| 対象 | サイズ | 状態参照元 | 最大数 |
|---|---|---|---|
| ターゲット敵（大スプライト左上） | md (18px) | `target.status_effects` | 6 |
| 非ターゲット敵アイコン（左上） | sm (14px) | `enemy.status_effects` | 3 |
| プレイヤーアイコン（左上） | sm (14px) | `battleState.player_effects` | 6 |
| パーティメンバーアイコン（左上） | sm (14px) | `member.status_effects` | 3 |

### 11.3 バッジ仕様

| ラベル | StatusEffectId | カテゴリ | 色 | 点滅 |
|---|---|---|---|---|
| `↑A` | atk_up | BUFF | オレンジ | なし |
| `↑D` | def_up / def_up_heavy | BUFF | 白 | なし |
| `♻` | regen | BUFF | 緑 | ゆっくり(1.5s) |
| `↑E` | evasion_up | BUFF | 黄緑 | なし |
| `★` | taunt | BUFF | 赤 | なし |
| `免` | stun_immune | BUFF | 紫 | なし |
| `S` | stun / bind | DEBUFF | 灰 | 速い(0.6s) |
| `B` / `b` | blind / blind_minor | DEBUFF | 暗紫 | 中速(1.0s) |
| `P` | poison | DEBUFF | 灰緑 | ゆっくり(1.5s) |
| `出` / `出(小)` | bleed / bleed_minor | DEBUFF | 赤 | 速い(0.6s) |
| `!` | fear | DEBUFF | 橙 | 中速(1.0s) |
| `↓A` | atk_down | DEBUFF | 茶緑 | なし |

### 11.4 表示ルール

- `duration > 0` の効果のみ表示（効果切れは自動的に消える）
- BUFF 優先（左）→ DEBUFF（右）の順で並び
- `cure_status` / `cure_debuff` / `ap_max` は即時効果のため非表示
- ホバー時に `{effectId} (残り{duration}T)` ツールチップを表示

---

## 12. HP バーのリアルタイム同期 (v3.3)

### 12.1 概要

ダメージや回復のテキストログがタイプライターで流れるタイミングに合わせてHPバーを段階的に更新する。React 18の自動バッチ処理を回避するため、**ログマーカー方式**を採用。

**実装フック**: `src/components/battle/hooks/useBattleTypewriter.ts`（v1.0 リファクタリングにより BattleView.tsx から分離）

### 12.2 マーカー形式

| マーカー | 更新対象 | 形式 |
|---|---|---|
| `__hp_sync:NNN` | プレイヤーHPバー | NNN = 更新後HP値 |
| `__party_sync:ID:NNN` | パーティメンバーHPバー | ID = member.id, NNN = 更新後durability |

### 12.3 マーカー挿入タイミング

| イベント | 挿入箇所 | 実装 |
|---|---|---|
| 敵からプレイヤーへのダメージ | `processEnemyTurn` — ダメージメッセージ直後 | `newMessages.push(__hp_sync:newHp)` |
| プレイヤーの回復カード使用 | `attackEnemy` — heal case の logMsg 後 | `healSyncHp` ローカル変数 → `__hp_sync` 追加 |
| NPCがプレイヤーを回復 | `processPartyTurn` — heal action 処理後 | `newMessages.push(__hp_sync:newHp)` |
| 敵からパーティへのダメージ | `processEnemyTurn` — ダメージメッセージ直後 | `newMessages.push(__party_sync:ID:NNN)` |
| NPCがパーティメンバーを回復 | `processPartyTurn` — heal action 処理後 | `newMessages.push(__party_sync:ID:NNN)` + durability更新 |

### 12.4 BattleView での処理

`useBattleTypewriter.ts` の `processQueue()` 関数がタイプライターキューを処理しながら:
- `__hp_sync:NNN` を検知 → `setLiveHp(NNN)` → プレイヤーHPバーを即時更新（非表示メッセージ）
- `__party_sync:ID:NNN` を検知 → `setLivePartyDurability(prev => ({...prev, [ID]: NNN}))` → 該当パーティメンバーHPバーを即時更新（非表示メッセージ）

---

## 13. 変更履歴

| バージョン | 日付 | 主な変更内容 |
|---|---|---|
| v11.0 | 2026-04 | 実装準拠の全面改善、クライアントサイド主体化 |
| v12.0 | 2026-04-11 | バトルエンジンv3.0対応（def_up固定値化、新StatusEffectId追加、敵スタン/blind/evasion_up/atk_down対応） |
| v13.0 | 2026-04-11 | 装備ボーナスのバトル計算への適用（equipBonus）のストアレベル管理移行、状態異常バッジUI追加（StatusEffectBadges） |
| **v14.0** | **2026-04-12** | **HPバーリアルタイム同期（マーカー方式）、カードimage_url/description取得フロー改善、パーティHP同期（max_durability取得修正）、startBattle での fetchInventory 強制実行** |
| v14.1 | 2026-04-15 | spec_v2 文字化け修復（Shift-JIS二重化け → UTF-8完全再構築） |

---

## v15.0 Phase-Based Battle Flow (2026-04-15)

### Overview
Each turn is split into two manual phases controlled by the NEXT button.
This eliminates all log/UI synchronization bugs by making phase transitions
explicit player actions rather than timer-based automation.

### battlePhase State Machine

| Phase | Description | NEXT Button |
|---|---|---|
| `'player'` | Player uses cards freely | Always enabled (fast-forwards logs) |
| `'npc_done'` | NPC actions processed, logs flowing | Disabled until logs finish |
| `'enemy_done'` | Enemy actions processed, logs flowing | Disabled until logs finish > advances turn |

### Turn Sequence (v15.0)

```
[Turn N Start]
  TURN N overlay -> PLAYER overlay
  Player uses cards (canInteract = true, NEXT always enabled)
    |
  [NEXT tapped]
  runNpcPhase(): AP recovery, tick effects, NPC actions
  -> battlePhase: 'npc_done', NPC messages added
  -> Logs flow (NEXT disabled)
  -> Logs complete (NEXT enabled)
    |
  [NEXT tapped]
  ENEMY overlay shown
  runEnemyPhase(): Enemy attacks
  -> battlePhase: 'enemy_done', enemy messages added
  -> Currently auto-advances via processEnemyTurn setting battlePhase:'player'
[Turn N+1 Start]
```

### Store Actions (v15.0)

| Action | Description |
|---|---|
| `runNpcPhase()` | Replaces old endTurn(). AP + tick + NPC actions, no setTimeout. |
| `runEnemyPhase()` | Alias for processEnemyTurn(true). Enemy attacks + turn++. |
| `endTurn()` | Backward-compat alias for runNpcPhase(). |

### UI Controls (v15.0)

| Control | Condition | Behavior |
|---|---|---|
| Cards | battlePhase === 'player' | Freely usable regardless of log playback |
| NEXT (player phase) | Always enabled | Fast-forwards logs + starts NPC phase |
| NEXT (npc_done) | isTypingDone only | Starts enemy phase with ENEMY overlay |
| NEXT (enemy_done) | isTypingDone only | Advances to next turn |
| Flee button | battlePhase === 'player' only | Hidden during NPC/enemy phase |

### Removed Mechanisms
- isWaitingForLogs state flag (replaced by battlePhase)
- useGameStore.getState().isPlayerTurn checks inside processQueue
- setTimeout(300ms) before processPartyTurn()
- setTimeout(600ms) before processEnemyTurn()
- isSelfBuff missing evasion_up/taunt (fixed in all 3 paths)

---

## 14. コードアーキテクチャ変更履歴 (リファクタリング v1.0)

| バージョン | 日付 | 変更内容 |
|---|---|---|
| v15.0 | 2026-04-15 | フェーズ制バトルフロー導入（battlePhase: player→npc_done→enemy_done）、NEXTボタン実装、setTimeout連鎖廃止、evasion_up敵誤付与バグ修正 |
| **v1.0 refactor** | **2026-04-15** | **コードリファクタリング。gameStore.ts(2154行)→スライス分割(~75行)。useBattleTypewriter / useScenarioNodeProcessor フック抽出。ScenarioEngine 988行→559行。詳細: spec_v18_code_architecture.md 参照** |

> getEffectiveAtk / getEffectiveDef / getEffectiveMaxHp は v1.0 リファクタリングにより
> src/store/gameStore.ts から src/store/slices/profileSlice.ts に移動した。
