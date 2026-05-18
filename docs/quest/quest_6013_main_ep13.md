# クエスト仕様書：6013 — 第13話「眠りの都」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6013 |
| **Slug** | `main_ep13` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 13 |
| **ゲストNPC** | ヴォルグ（guest_join → leave） |
| **特記** | ボス: 大天使ラファエル |

---

## 2. 報酬定義
```
Exp:350|Gold:1800|Rep:20|Order:5
```

---

## 3. シナリオノード構成（43ノード）

### 全体フロー
```text
start〜start_02 → volg_join → arrival_01〜arrival_02
  → silence_01〜sleeping_02 → volg_01〜volg_02(speaker:ヴォルグ)
  → soldier_01〜soldier_02 → presence_01〜presence_03
  → guard_01 → battle1(503)
  → throne_01〜throne_02 → raphael_01〜raphael_04(speaker:大天使ラファエル)
  → volg_rage_01〜volg_rage_03(speaker:ヴォルグ)
  → battle2(9041) → retreat_01〜retreat_03
  → awaken_01〜awaken_02 → volg_leave
  → next_01 → end_node
```

### ノード詳細（主要ノード）

#### 龍京到着（arrival_01〜sleeping_02）— 背景: `bg_ryukyo_ruined`
城門に門番がいない。都市全体が眠りに落ちている。

#### 眠りの使徒（guard_01〜battle1）— enemy_group_id: `503`
祈る使徒が撒く光の膜で住民が眠る。

#### ラファエル（raphael_01〜raphael_04）— speaker: `大天使ラファエル`
「苦シミハモウ終ワリニシヨウ。全テ眠リノ中デ癒サレル」

#### ヴォルグ覚醒（volg_rage_01〜volg_rage_03）— speaker: `ヴォルグ`
自分の腕に刃を押し当て痛みで意識を繋ぐ。「偽物の安らぎなんざいらねェ！」

#### ラファエル戦（battle2）— enemy_group_id: `9041` / BGM: `bgm_battle_strong`

#### 都市覚醒（awaken_01〜volg_leave）— guest_id: `npc_guest_volg`
龍京が息を吹き返した。次は出雲。

#### `end_failure`（type: end_failure）
もう目覚めることはない。
