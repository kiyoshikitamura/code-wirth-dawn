# クエスト仕様書：6018 — 第18話「戦神の洗礼」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6018 |
| **Slug** | `main_ep18` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 18 |
| **特記** | ボス: 軍神アレス（記憶戦）。遺産: 剣 |

---

## 2. 報酬定義
```
Exp:450|Gold:3500|Rep:25|Order:5|Items:506
```

---

## 3. シナリオノード構成（32ノード）

### 全体フロー
```text
start〜start_02 → port_01〜port_02 → voyage_01〜voyage_02
  → island_01〜island_02 → ruins_01 → stele_01 → touch_01
  → memory_01〜memory_02 → ares_01〜ares_05(speaker:軍神アレス)
  → battle(9051) → defeat_01〜defeat_04(speaker:軍神アレス)
  → sword_01〜sword_02 → return_01 → end_node
```

### ノード詳細（主要ノード）

#### 無人島到着（start〜island_02）— 背景: `bg_island`
龍京沖合の無人島。漁師「帰ってこなかった奴もいる」

#### 石碑と記憶（ruins_01〜memory_02）— 背景: `bg_memory_forest`
雨の森。英霊は肩から血を流し逃走していた。

#### アレス登場（ares_01〜ares_05）— speaker: `軍神アレス`
赤銅色の鎧。「その目は気に入った。折れた剣でもまだ斬れると思ってる目だ」

#### アレス戦（battle）— enemy_group_id: `9051` / BGM: `bgm_spot_final_boss`

#### 遺産獲得（sword_01〜end_node）
軍神の剣。「次は逃げずに最初から来いよ」
- **rewards**: items: [506]

#### `end_failure`（type: end_failure）
