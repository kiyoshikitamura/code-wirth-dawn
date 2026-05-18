# クエスト仕様書：6012 — 第12話「灼熱の審判」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6012 |
| **Slug** | `main_ep12` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 12 |
| **ゲストNPC** | ヴォルグ（guest_join → leave） |
| **特記** | ボス: 大天使ウリエル |

---

## 2. 報酬定義
```
Exp:350|Gold:1500|Rep:15|Order:5
```

---

## 3. シナリオノード構成（45ノード）

### 全体フロー
```text
start〜start_03 → volg_join → arrival_01〜arrival_03
  → flames_01〜flames_02 → refugees_01〜refugees_02
  → volg_fury_01〜volg_fury_02(speaker:ヴォルグ)
  → plaza_01〜plaza_03 → battle1(502)
  → clear_01〜clear_02 → uriel_01〜uriel_04(speaker:大天使ウリエル)
  → volg_charge_01〜volg_charge_02(speaker:ヴォルグ)
  → battle2(9040) → retreat_01〜retreat_03
  → aftermath_01〜aftermath_02 → volg_next_01〜volg_next_02
  → volg_leave → next_01〜next_02 → end_node
```

### ノード詳細（主要ノード）

#### 導入（start〜volg_join）— BGM: `bgm_quest_crisis`
避難民の列。「イスハークが燃えている」ヴォルグ合流。

#### イスハーク（arrival_01〜flames_02）— 背景: `bg_ishaq_ruined`
黄金都市が半壊。空から炎の柱が降り注ぐ。

#### 使徒前衛（plaza_01〜battle1）— enemy_group_id: `502`
住民の退路を塞ぐ使徒を突破。

#### ウリエル降臨（uriel_01〜uriel_04）— speaker: `大天使ウリエル`
「穢レタ砂ノ都ヨ。炎ニヨリ清メラレヨ」

#### ウリエル戦（battle2）— enemy_group_id: `9040` / BGM: `bgm_battle_strong`

#### 撤退（retreat_01〜volg_leave）— guest_id: `npc_guest_volg`
ウリエルは天へ退く。「他の都を裁いている」次は龍京。

#### `end_node`（type: end_success）
守れた命がある。次は龍京だ。

#### `end_failure`（type: end_failure）— 背景: `bg_ishaq_ruined`
