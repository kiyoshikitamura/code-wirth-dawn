# クエスト仕様書：6017 — 第17話「冥府の門」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6017 |
| **Slug** | `main_ep17` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 17 |
| **特記** | ボス: 冥王ハデス（記憶戦）。遺産: 護符 |

---

## 2. 報酬定義
```
Exp:450|Gold:3500|Rep:25|Order:5|Items:505
```

---

## 3. シナリオノード構成（31ノード）

### 全体フロー
```text
start〜start_02 → pyramid_01〜pyramid_02
  → interior_01〜interior_02 → passage_01〜passage_02
  → chamber_01〜chamber_02 → touch_01
  → memory_01〜memory_03 → hades_01〜hades_03(speaker:冥王ハデス)
  → battle(9050) → defeat_01〜defeat_03(speaker:冥王ハデス)
  → talisman_01〜talisman_02 → return_01〜return_02 → end_node
```

### ノード詳細（主要ノード）

#### ピラミッド探索（start〜passage_02）— 背景: `bg_desert` → `bg_catacombs`
イスハーク東の古代ピラミッド。壁画に翼を持つ存在との戦い。

#### 石碑発見（chamber_01〜touch_01）— 背景: `bg_pyramid_chamber`
「戦神の試練を越え力の欠片を受け継げ」

#### ハデス降臨（memory_01〜hades_03）— 背景: `bg_memory_oasis` / speaker: `冥王ハデス`
泉の底から冥界の門が開く。「死を恐れぬことと死を超えることは違う」

#### ハデス戦（battle）— enemy_group_id: `9050` / BGM: `bgm_spot_final_boss`

#### 遺産獲得（talisman_01〜end_node）
冥王の護符。「死は終わりではない。次の始まりだ」
- **rewards**: items: [505]

#### `end_failure`（type: end_failure）
