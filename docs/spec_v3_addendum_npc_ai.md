Code: Wirth-Dawn Specification v14.0
# NPC / Shadow AI 仕様書 (Addendum to v2)

## 1. 概要 (Overview)
NPCおよびShadow（影の残像）がバトル中に自動的に行動するためのAIロジックを定義する。
AIは全て**クライアントサイド**（`battleSlice.processPartyTurn()` / 旧: `gameStore.processPartyTurn()`）で実行される。
<!-- v1.0 refactor: processPartyTurn は src/store/slices/battleSlice.ts に移動 (2026-04-15) -->

<!-- v14.0: ターン進行順序正規化・NPCステータス取得優先順位確定・npcsテーブルHP列廃止 -->
<!-- v13.0: startBattle時のdurability正規化、resolveNpcTurn null-safe guard追加 -->
<!-- v12.0: v3.3の heal action / durability更新 / HPバー同期対応 -->

---

## 2. 基本規則

| 項目 | ルール | 実装 |
|---|---|---|
| 行動 | 固定・シグネチャデッキ (`signature_deck`) からランダムに1枚ずつ選出 | `processPartyTurn()` 内で `Math.random()` による選出 |
| AP制約 | プレイヤーと同じAP制約に従う | `current_ap >= ap_cost` チェック |
| カード使用制限 | 1ターンにつき同一カード1枚 | `used_this_turn` 配列で管理 |
| 行動不能 | Stun状態の場合はスキップ | `isStunned()` チェック |
| 死亡 | `durability <= 0` で行動不能 | `is_active: false` |

---

## 3. ロールと定義 (Role Definition)
<!-- v11.0: determineRole()の実装に基づく -->

ロールは**デッキ内容から動的に決定**される（DBにはロール情報を保存しない）。

| Role | 決定条件 | 優先行動 |
|---|---|---|
| `guardian` | `def >= 3` または `cover_rate >= 30` | 防御/バフ優先 |
| `medic` | デッキに回復系カード（`regen`, `Heal`系, `type: 'Heal'`）が存在 | 回復/バフ優先 |
| `striker` | 上記に該当しない | 攻撃一択 |

### 3.1 グレード (AI Grade)
<!-- v11.0: determineGrade()の実装に基づく -->
- `smart`: Heroic Shadow（英雄格）および特定NPC → 効率的なスキル選択
- `random`: 通常NPC → ランダム選択

```typescript
function determineGrade(pm: PartyMember): 'smart' | 'random' {
  if (pm.origin_type === 'shadow_heroic') return 'smart';
  return 'random';
}
```

---

## 4. ターン進行フロー (Turn Sequence)
<!-- v14.0: ターン番号更新タイミングをエネミーターン完了後に変更 -->

### 4.1 正しいターン進行順序

```
[プレイヤー] ターンエンドボタン押下
  ↓
endTurn():
  - 状態異常Tick処理（毒ダメージ等）
  - AP回復
  - ターン番号は据え置き（まだ更新しない）
  ↓
processPartyTurn():
  - 生存NPC全員が順番に行動（カード使用・攻撃・回復）
  ↓
processEnemyTurn():
  - 全エネミーが行動
  - エネミーターン完了後 → turn: N+1 に更新
  - "--- ターン N+1 ---" をログに追加
  - dealHand() で次のターンの手札配布
```

> **重要**: プレイヤーのターンエンド直後にターン番号を更新してはならない。
> NPC・エネミー全員の行動が完了した後に初めてターンが切り替わる。

### 4.2 AI行動フロー (Decision Flow)
<!-- v13.0: null-safe durability guard 反映 -->

```mermaid
flowchart TD
    Start["NPC Action Start"] --> CheckAlive{"(durability ?? 100) > 0 && is_active?"}
    CheckAlive -->|No| Skip["Skip"]
    CheckAlive -->|Yes| CheckStun{"Stunned?"}
    CheckStun -->|Yes| Skip
    CheckStun -->|No| SelectCard["Select Card from signature_deck"]
    SelectCard --> CheckAP{"AP >= card.ap_cost?"}
    CheckAP -->|No| Skip
    CheckAP -->|Yes| CheckUsed{"Used this card this turn?"}
    CheckUsed -->|Yes| TryAnother["Try next card"]
    CheckUsed -->|No| Execute["Execute Card Action"]
    Execute --> ApplyDamage["Apply Damage/Effect"]
```

### 4.3 カード選択ロジック

**`random` グレード:**
1. `signature_deck` からランダムに1枚を優先的に選出。
2. AP不足の場合 → 行動スキップ。
3. `used_this_turn` に含まれている場合 → 別のカードを再選出。
4. 有効なカードが見つからない場合 → 行動スキップ。

**`smart` グレード（英雄・特殊NPC）:**
1. **緊急回復チェック**: プレイヤー or 味方の HP が50%以下 → 先頭の回復系カードを優先使用。
2. **AP貯蓄判断**: 高コストスキル（AP≥ 5）があり AP不足する場合 → 行動を「スキップ」し次ターンに向けてAPを貯蓄。
3. APを使い切れる限り、高コスト順にカードを使用。

実装: `npcAI.ts` 内の `evaluateWaitLogic()` および `tryEmergencyHeal()`。

### 4.4 ターゲット選択
<!-- v11.0: processPartyTurn()のターゲットロジックを反映 -->
- **攻撃カード**: 最初の生存敵に対して実行。
- **バフ/回復カード (self系)**: 自身に対して実行。

### 4.5 heal action の詳細 (v3.3+)

`action.type === 'heal'` の場合：

| `action.targetName` | HP変更 | HPバー同期 |
|---|---|---|
| `'あなた'` | プレイヤーの `userProfile.hp` に `healAmount` を加算 | `__hp_sync:NNN` マーカーを `messages` に追加 |
| その他（member.name等） | `updatedParty[idx].durability` に `healAmount` を加算（max_durability上限） | `__party_sync:ID:NNN` マーカーを `messages` に追加 |

---

## 5. バトル開始時の初期化 (Battle Initialization)
<!-- v14.0: HP取得優先順位確定・npcsテーブルカラム廃止反映 -->

### 5.1 NPCのHP取得優先順位（確定版）

NPC最大HPは以下の優先順位で取得する：

```
1. party_members.max_durability  （hire時スナップショット。100以外の値が入っている場合）
2. npcs.max_hp                   （npcsマスタの個別上限HP）
3. 100                           （フォールバック）
```

**実装（`startBattle()` 内）:**
```typescript
// party_members.max_durability を最優先（hire時スナップショット）
const pmAny = pm as any;
const fullHp = pm.max_durability || pmAny.max_hp || pm.durability || 100;
```

**実装（`party/list` API 内）:**
```typescript
const rawMaxDur = member.max_durability;
const npcHp = npc?.max_hp ?? null;
// max_durabilityが100以外（=個別設定済み）ならそれを優先、なければnpcsのmax_hpを使用
const resolvedHp = (rawMaxDur && rawMaxDur !== 100)
    ? rawMaxDur
    : (npcHp ?? member.durability ?? 100);
```

### 5.2 npcsテーブルのHP関連カラム（廃止・存続）

| カラム | 状態 | 説明 |
|---|---|---|
| `npcs.max_hp` | ✅ **使用中** | 各NPC個別の正しい上限HP（マスタ設定値） |
| `npcs.hp` | ❌ **廃止** | 50固定のデフォルト値。2026-04-14に削除 |
| `npcs.max_durability` | ❌ **廃止** | 100固定のDBデフォルト値。2026-04-14に削除 |
| `npcs.durability` | ⚠️ **非推奨** | 現在HPとして使用予定だったが実際は100固定。参照回避 |
| `party_members.max_durability` | ✅ **使用中** | hire時のNPC HPスナップショット。バトルのHP源泉 |

### 5.3 雇用時（hire）のスナップショット保存

酒場でNPCを雇用する際、`shadowService.hireShadow()` が以下の順でHP値を取得し `party_members.max_durability` に保存する：

```typescript
// generateSystemMercenaries() 内（shadowService.ts）
stats: { hp: npc.max_hp || 100 }  // npcs.max_hp を使用

// hireShadow() 内
const snapshotHp = shadow.stats?.hp || 100;
durability: snapshotHp,
max_durability: snapshotHp,  // party_membersに保存
```

### 5.4 Durability Null-Safe Guard

`resolveNpcTurn()` 内の生存チェックでは `null` / `undefined` に対して `?? 100` でフォールバックする。

```typescript
// npcAI.ts
if (!npc.is_active || (npc.durability ?? 100) <= 0) return actions;
```

> **注意**: `null <= 0` は JavaScript で `true` と評価されるため、null-safe処理なしでは有効なメンバーが誤ってスキップされる。

---

## 6. パーティメンバー型定義
<!-- v14.0: atk/defフィールド追加 -->
```typescript
export interface PartyMember {
  id: string;
  owner_id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Unknown';
  origin: 'system' | 'ghost';
  origin_type?: string;        // 'system_mercenary', 'shadow_heroic', 'active_shadow'
  job_class: string;
  durability: number;          // バトル中の現在HP（開始時に max_durability/max_hp で上書き）
  max_durability: number;      // hire時にスナップショットされた最大HP
  atk?: number;                // 基礎攻撃力
  def?: number;                // 基礎防御力
  cover_rate: number;          // 0-100: 庇う確率
  loyalty: number;
  inject_cards: string[];      // Card IDs
  passive_id?: string;
  is_active: boolean;

  // AI Fields (runtime only, not persisted)
  ai_role?: 'striker' | 'guardian' | 'medic';
  ai_grade?: 'smart' | 'random';
  current_ap?: number;
  signature_deck?: Card[];
  used_this_turn?: string[];
  status_effects?: { id: string; duration: number }[];
}
```

---

## 7. 実装上の制約と注意事項

| 項目 | 実装状況 |
|---|---|
| Heroicの貯め行動 | ✅ **実装済み** (`evaluateWaitLogic()`) |
| Smart AIの戦略決定 | ✅ **実装済み** (`resolveNpcTurn()` AP順・高コスト優先) |
| Medic の HP 逼迫 | ✅ **実装済み** (`tryEmergencyHeal()`) |
| パーティメンバーへのheal時 durability 更新 | ✅ **実装済み** (v3.3) |
| heal によるHPバーリアルタイム同期 | ✅ **実装済み** (v3.3: `__hp_sync` / `__party_sync` マーカー) |
| startBattle時のdurability正規化 | ✅ **実装済み** (v14.0: max_durability優先) |
| resolveNpcTurn の null-safe durability guard | ✅ **実装済み** (v13.0) |
| ターン番号更新タイミング | ✅ **修正済み** (v14.0: エネミーターン完了後に更新) |
| npcsテーブルHP列廃止 (hp / max_durability) | ✅ **DB変更済み** (2026-04-14) |

---

## 8. 変更履歴

| バージョン | 日付 | 主な変更内容 |
|---|---|---|
| v11.0 | 2026-04 | processPartyTurn()の実装に合わせて全面改訂 |
| v12.0 | 2026-04-12 | v3.3対応: heal actionのdurability更新修正・HPバー同期マーカー追加 |
| v13.0 | 2026-04-13 | startBattle時のdurability正規化・resolveNpcTurnのnull-safe guard追加 |
| **v14.0** | **2026-04-14** | **ターン進行順序正規化（エネミー完了後にターン番号更新）・NPCのHP取得優先順位確定（party_members.max_durability → npcs.max_hp）・npcsテーブルhp/max_durabilityカラム廃止反映** |
| v15.0 | 2026-04-15 | フェーズ制バトルフロー（player/npc_done/enemy_done）導入。endTurn→runNpcPhase に改名。setTimeout連鎖廃止 |
| **v1.0 refactor** | **2026-04-15** | **コードリファクタリング。processPartyTurn を含む全バトルアクションを `src/store/slices/battleSlice.ts` に移動。詳細: spec_v18_code_architecture.md 参照** |
