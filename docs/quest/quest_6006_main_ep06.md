# クエスト仕様書：6006 — 第6話「密林の逃亡」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6006 |
| **Slug** | `main_ep06` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 6 |
| **ゲストNPC** | なし |
| **特記** | 分岐あり（けもの道 / 川沿い） |

---

## 2. 報酬定義
```
Exp:150|Gold:200|Rep:5|Order:5
```

---

## 3. シナリオノード構成（33ノード）

### 全体フロー
```text
start → start_02 → start_03 → wound_01 → wound_02
  → flash_01 → flash_02 → pursuit_01 → pursuit_02
  → dogs_01 → dogs_02 → choice1
    ├─「険しいけもの道」→ hard_01 → hard_02 → hard_03 → hard_04 → end_node
    └─「川沿いを急ぐ」→ river_01 → river_02
      → ambush_01 → ambush_02 → taunt_01 → taunt_02
      → battle(406) → choice2 → dying_01 → dying_02
      → run_01 → run_02 → end_node
```

### ノード詳細

#### `start`〜`start_03`— BGM: `bgm_quest_calm` / 背景: `bg_forest_day`
敗残兵に紛れ東へ逃走。夜刀神国の国境域に到達。

#### `wound_01`〜`flash_02`— 背景: `bg_forest_day`
肩の傷。ガウェインの最後の言葉がフラッシュバック。

#### `pursuit_01`〜`dogs_02`— BGM: `bgm_quest_tense`
軍用犬の吠え声。前方に二本の道。

#### `choice1`（分岐）
| ラベル | 次ノード |
|--------|----------|
| 険しいけもの道を進む | `hard_01` |
| 川沿いを急ぐ | `river_01` |

#### けもの道ルート（`hard_01`〜`hard_04`）
vitality_dmg: 5 あり。追手を欺き関所に辿り着く。

#### 川沿いルート（`river_01`〜`run_02`）
追討部隊に発見。battle(enemy_group_id: 406)。「後ろにあと三十人いる」

#### `end_node`（type: end_success）— 背景: `bg_forest_day`
関所の影に辿り着いた。生きている。ガウェイン、まだ生きている。
