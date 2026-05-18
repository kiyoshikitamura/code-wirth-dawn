# クエスト仕様書：6009 — 第9話「血塗られた年貢」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6009 |
| **Slug** | `main_ep09` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 9 |

---

## 2. 報酬定義
```
Exp:250|Gold:500|Rep:15|Order:5
```

---

## 3. シナリオノード構成（33ノード）

### 全体フロー
```text
start → start_02 → start_03 → proc_01 → proc_02
  → captain_01 → captain_02 → mountain_01 → mountain_02
  → mob_01 → mob_02 → leader_01 → leader_02 → leader_03
  → rage_01 → rage_02 → battle(404) → choice1
  → after_01 → after_02 → after_03
  → reward_01 → reward_02 → reward_03
  → tools_01 → tools_02 → end_01 → end_node
```

### ノード詳細

#### `start`〜`proc_02`— BGM: `bgm_quest_tense` / 背景: `bg_mountain`
大名から護衛依頼。荷車が多すぎる。

#### `captain_01`〜`captain_02`
護衛団長「油断するな！逆賊がいつ襲うかわからんぞ！」

#### `mountain_01`〜`mob_02`— BGM: `bgm_quest_crisis`
山道で落石。農具武装の集団が押し寄せる。子供・女・老人。

#### `leader_01`〜`leader_03`
「米を返せ！不当に収奪した年貢の米だ！家族が餓死しそうだ！」

#### `rage_01`〜`rage_02`
護衛団長「黙れ逆賊ども！」

#### `battle`（type: battle）— enemy_group_id: `404` / BGM: `bgm_battle`
一揆勢との戦闘。

#### `after_01`〜`after_03`
「子供が三人飯が食えず死んだ。それでも剣を振るうのか」

#### `reward_01`〜`tools_02`
団長は満足げに笑い農民を踏みつけた。農具は武器ではなかった。

#### `end_node`（type: end_success）— 背景: `bg_mountain`
金貨の袋が異様に重く感じた。
