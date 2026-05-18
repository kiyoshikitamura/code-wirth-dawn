# クエスト仕様書：6003 — 第3話「黄昏のオアシス」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6003 |
| **Slug** | `main_ep03` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 3 |
| **ゲストNPC** | ガウェイン（guest_join → leave） |
| **サムネイル画像** | `/images/quests/bg_desert.png` |

---

## 1. クエスト概要
```
マルカンド砂塵王国の商業都市ジャハーラ。オアシスへの毒物投入事件を追う。
```

---

## 2. 報酬定義
```
Exp:120|Gold:300|Rep:5|Order:5
```

---

## 3. シナリオノード構成（31ノード）

### 全体フロー
```text
start → start_02 → start_03 → gawain_join
  → suspicion_01 → suspicion_02 → suspicion_03
  → water_01 → water_02 → trace_01 → trace_02 → trace_03
  → spy_01 → spy_02 → battle → choice1「毒を止めるために戦う」
  → dying_01 → dying_02 → emblem_01 → emblem_02 → emblem_03
  → shock_01 → shock_02 → shock_03 → farewell_01
  → gawain_leave → end_01 → end_node
```

### ノード詳細

#### `start`〜`start_03`（type: text）— BGM: `bgm_quest_calm` / 背景: `bg_desert`
ジャハーラの市場。色とりどりの布屋根。だが何かが違う。

#### `gawain_join`（type: guest_join）— guest_id: `npc_guest_gawain`

#### `suspicion_01`〜`suspicion_03`（type: text）— speaker: `ガウェイン`
街の人間の目が変わった。露天商の水に異変。

#### `water_01`〜`water_02`（type: text）— speaker: `ガウェイン`
オアシスの池が紫色に変色。毒だ。

#### `trace_01`〜`trace_03`（type: text）— BGM: `bgm_quest_tense`
水脈を辿り洞窟へ。毒薬の瓶と工作員を発見。

#### `spy_01`〜`spy_02`（type: text）
工作員「もう三つの都市に仲間が散っている」

#### `battle`（type: battle）— enemy_group_id: `201` / BGM: `bgm_battle`

#### `dying_01`〜`dying_02`（type: text）
工作員の手から紋章の欠片。

#### `emblem_01`〜`emblem_03`（type: text）— speaker: `ガウェイン`
紋章はローランド聖王国の特務機関のもの。

#### `shock_01`〜`shock_03`（type: text）— speaker: `ガウェイン`
「毒を撒いたのが王国の人間なら自分たちは何を守っているんだ」

#### `farewell_01`（type: text）— speaker: `ガウェイン`
解毒剤レシピを元に本隊へ。

#### `gawain_leave`（type: leave）— guest_id: `npc_guest_gawain`

#### `end_01`〜`end_node`（type: end_success）— 背景: `bg_desert`
水源は浄化されたが紋章の事実は重い。
