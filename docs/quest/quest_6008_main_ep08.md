# クエスト仕様書：6008 — 第8話「夜霧の刺客」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6008 |
| **Slug** | `main_ep08` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 8 |
| **特記** | 連続2戦（暗殺者第一波 + 精鋭） |

---

## 2. 報酬定義
```
Exp:200|Gold:350|Rep:10|Order:5
```

---

## 3. シナリオノード構成（27ノード）

### 全体フロー
```text
start → start_02 → rest_01 → rest_02 → sound_01 → sound_02
  → analysis_01 → analysis_02 → break_01 → break_02
  → battle1(206) → choice1 → wave_01 → wave_02 → wave_03
  → elite_01 → elite_02 → battle2(207) → choice2
  → silence_01 → silence_02 → silence_03
  → end_01 → end_node
```

### ノード詳細

#### `start`〜`rest_02`— BGM: `bgm_quest_tense` / 背景: `bg_tavern_night`
辺境の宿屋。久しぶりの屋根の下。

#### `sound_01`〜`break_02`— 背景: `bg_tavern_night`
真夜中の襲撃。三方向から気配。煙幕。

#### `battle1`（type: battle）— enemy_group_id: `206` / BGM: `bgm_battle`
暗殺者第一波。

#### `wave_01`〜`elite_02`— 背景: `bg_tavern_night`
夜刀の暗部。二人目の精鋭は格が違う。

#### `battle2`（type: battle）— enemy_group_id: `207`
暗殺者精鋭。

#### `silence_01`〜`end_node`— 背景: `bg_tavern_night`
「これで終わりではない」夜刀の闇は深い。
