# クエスト仕様書：6004 — 第4話「消えゆく商人」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6004 |
| **Slug** | `main_ep04` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 4 |
| **ゲストNPC** | ガウェイン（guest_join → leave） |

---

## 2. 報酬定義
```
Exp:150|Gold:400|Rep:10|Order:5
```

---

## 3. シナリオノード構成（36ノード）

### 全体フロー
```text
start → gawain_join → patrol_01 → patrol_02
  → rumor_01 → rumor_02 → merchant_01 → merchant_02
  → plea_01 → plea_02 → analysis_01 → analysis_02
  → trail_01 → trail_02 → ambush_01 → ambush_02
  → hunter_01 → hunter_02 → hunter_03 → hunter_04
  → battle → choice1 → post_01 → post_02
  → identity_01 → identity_02 → omen_01 → omen_02 → omen_03
  → farewell_01 → farewell_02 → gawain_leave
  → end_01 → end_node
```

### ノード詳細

#### `start`（type: text）— BGM: `bgm_quest_tense` / 背景: `bg_desert`
毒物事件から数日。マルカンド領内の交易路巡回。

#### `gawain_join`（type: guest_join）— guest_id: `npc_guest_gawain`

#### `patrol_01`〜`rumor_02`— speaker: `ガウェイン`
交易路が静かすぎる。商人が消えている噂。

#### `merchant_01`〜`plea_02`— 背景: `bg_desert`
血まみれの男が「賞金稼ぎが商隊を襲った」と証言。

#### `analysis_01`〜`analysis_02`— speaker: `ガウェイン`
消えた商人の共通点：ローランドとの交易に反対する有力者。

#### `trail_01`〜`trail_02`— 背景: `bg_wasteland`
砂漠の東へ。岩場に野営の跡。

#### `ambush_01`〜`hunter_04`— 背景: `bg_wasteland`
賞金稼ぎが別の商隊を包囲。リーダーの腰にローランド王国の公印。

#### `battle`（type: battle）— enemy_group_id: `230` / BGM: `bgm_battle`
王国公認の賞金稼ぎとの戦闘。

#### `post_01`〜`identity_02`— 背景: `bg_wasteland`
リーダーの身分証：第三遠征大隊・元伍長。王国が汚れ仕事をさせていた。

#### `omen_01`〜`omen_03`— speaker: `ガウェイン`
「これは戦争の前哨戦だ」

#### `farewell_01`〜`farewell_02`— speaker: `ガウェイン`
証拠を携え報告に向かう。「時間がない」

#### `gawain_leave`（type: leave）— guest_id: `npc_guest_gawain`

#### `end_node`（type: end_success）— 背景: `bg_wasteland`
戦争の歯車はもう回り始めている。
