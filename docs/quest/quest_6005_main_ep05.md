# クエスト仕様書：6005 — 第5話「老騎士の背中」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6005 |
| **Slug** | `main_ep05` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 5 |
| **ゲストNPC** | ガウェイン（guest_join → leave / 犠牲離脱） |

---

## 2. 報酬定義
```
Exp:200|Gold:500|Rep:15|Order:5|Items:501
```

---

## 3. シナリオノード構成（32ノード）

### 全体フロー
```text
start → start_02 → start_03 → gawain_join
  → ambush_01 → ambush_02 → commander_01 → commander_02
  → resolve_01 → resolve_02 → resolve_03 → wave_01
  → battle1(203) → choice1 → clear_01 → clear_02
  → second_01 → battle2(203) → choice2 → last_01 → last_02
  → last_03 → last_04 → gawain_leave
  → run_01 → run_02 → run_03 → end_node
```

### ノード詳細

#### `start`〜`start_03`— BGM: `bgm_quest_tense` / 背景: `bg_bandit_camp`
王国がガウェインを「反逆者」として公表。鉄騎隊が接近。

#### `gawain_join`（type: guest_join）— guest_id: `npc_guest_gawain`

#### `ambush_01`〜`commander_02`— BGM: `bgm_quest_crisis`
逃走中に四方から包囲。部隊長「反逆者ガウェイン、ここで処断する」

#### `resolve_01`〜`resolve_03`— speaker: `ガウェイン`
「ここは俺が引き受ける。お前は東へ行け。夜刀の国境を越えろ」

#### `battle1`（type: battle）— enemy_group_id: `203` / BGM: `bgm_battle_strong`
#### `battle2`（type: battle）— enemy_group_id: `203`
王国軍精鋭部隊との連続2戦。

#### `last_01`〜`last_04`— speaker: `ガウェイン`
背中に矢が三本。「お前は生き延びろ。世界の果てを見届けろ」

#### `gawain_leave`（type: leave）— guest_id: `npc_guest_gawain`
ガウェインは一人で残る兵士の前に立ちはだかった。

#### `run_01`〜`run_03`— 背景: `bg_bandit_camp`
走った。背後で剣戟の音。叫び声。静寂。

#### `end_node`（type: end_success）
「生き延びて、世界の果てを見届けろ」（第1部完）
- **rewards**: items: [501]
