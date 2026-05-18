# クエスト仕様書：6016 — 第16話「英霊の石碑」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6016 |
| **Slug** | `main_ep16` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 16 |
| **特記** | 英霊覚醒イベント。堕天使戦 |

---

## 2. 報酬定義
```
Exp:400|Gold:3000|Rep:20|Order:5
```

---

## 3. シナリオノード構成（33ノード）

### 全体フロー
```text
start〜start_03（平和の時代、胸の引っかかり）
  → border_01〜border_03（石碑発見）
  → stele_01〜stele_02 → touch_01〜touch_02（幻視）
  → vision_01〜vision_02（英霊の記憶）
  → hero_01〜hero_06（英霊の声: speaker:英霊）
  → awaken_01〜awaken_02
  → warning_01〜warning_02（堕天使降臨）
  → fallen_01〜fallen_02(speaker:堕天使)
  → battle(216) → post_01〜post_02 → end_node
```

### ノード詳細（主要ノード）

#### 石碑発見（border_01〜stele_02）— 背景: `bg_heroic_stele`
国境の町外れの丘。苔むした石碑の紋様が光り始める。

#### 英霊の声（hero_01〜hero_06）— speaker: `英霊`
「やっと目覚めたか」「世界に散らばった石碑を巡れ。武具を集めろ」
「全てが揃った時——お前は神に届く」

#### 堕天使戦（fallen_01〜battle）— enemy_group_id: `216`
「英霊ノ継承者カ。滅ビル運命ハ変ワラナイ」

#### `end_node`（type: end_success）
英霊の継承者として旅に出る。（第3部後半開始）

#### `end_failure`（type: end_failure）
