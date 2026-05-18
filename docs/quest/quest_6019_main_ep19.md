# クエスト仕様書：6019 — 第19話「月光の狩人」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6019 |
| **Slug** | `main_ep19` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 19 |
| **特記** | ボス: 女神アルテミス（記憶戦）。遺産: 鎧 |

---

## 2. 報酬定義
```
Exp:450|Gold:3500|Rep:25|Order:5|Items:507
```

---

## 3. シナリオノード構成（33ノード）

### 全体フロー
```text
start〜start_02 → mountain_01〜mountain_03
  → fog_01〜fog_02 → shrine_01〜shrine_02
  → stele_01 → touch_01 → memory_01〜memory_02
  → artemis_01〜artemis_05(speaker:女神アルテミス)
  → battle(9052) → defeat_01〜defeat_03(speaker:女神アルテミス)
  → armor_01〜armor_02 → return_01 → end_node
```

### ノード詳細（主要ノード）

#### 山岳探索（start〜fog_02）— 背景: `bg_mountain`
出雲北の山脈。霧が石碑の守り。

#### 秘境の石碑（shrine_01〜touch_01）— 背景: `bg_mountain_shrine`
谷間の朽ちた鳥居。月光に輝く石碑。

#### 記憶の中（memory_01〜memory_02）— 背景: `bg_memory_mountain`
月夜の山道で銀色の矢が飛んでくる。

#### アルテミス（artemis_01〜artemis_05）— speaker: `女神アルテミス`
「獲物は逃げれば追う。隠れれば見つける。立ち向かえば射抜く」

#### アルテミス戦（battle）— enemy_group_id: `9052` / BGM: `bgm_spot_final_boss`

#### 遺産獲得（armor_01〜end_node）
女神の鎧。月光を編み込んだ銀色の鎧。「次の狩りを楽しみにしている」
- **rewards**: items: [507]

#### `end_failure`（type: end_failure）
