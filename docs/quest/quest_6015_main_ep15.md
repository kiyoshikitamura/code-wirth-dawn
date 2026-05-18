# クエスト仕様書：6015 — 第15話「天軍の長」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6015 |
| **Slug** | `main_ep15` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 15 |
| **ゲストNPC** | ヴォルグ（guest_join → leave） |
| **特記** | ボス: 大天使ミカエル。第3部前半完結 |

---

## 2. 報酬定義
```
Exp:500|Gold:2500|Rep:30|Order:5|Items:503
```

---

## 3. シナリオノード構成（44ノード）

### 全体フロー
```text
start〜start_02 → volg_join → arrival_01〜arrival_02
  → devastation_01〜devastation_02 → soldiers_01〜soldiers_02
  → volg_resolve_01〜volg_resolve_02(speaker:ヴォルグ)
  → cathedral_01〜cathedral_02 → michael_01〜michael_03
  → elite_01 → battle1(505)
  → descend_01〜descend_02 → michael_voice_01〜michael_voice_02(speaker:大天使ミカエル)
  → volg_final_01〜volg_final_02(speaker:ヴォルグ)
  → battle2(9043) → retreat_01〜retreat_03
  → saved_01 → volg_leave → farewell_01〜farewell_03(speaker:ヴォルグ)
  → end_01〜end_02 → end_node
```

### ノード詳細（主要ノード）

#### レガリア到着（arrival_01〜soldiers_02）— 背景: `bg_regalia_ruined`
城壁が半分崩壊。ミカエルは純粋な武力で都市を叩き潰した。

#### 親衛隊（elite_01〜battle1）— enemy_group_id: `505`

#### ミカエル降臨（michael_01〜michael_voice_02）— speaker: `大天使ミカエル`
六枚の翼。光の鎧。「貴様ラハ強イ。ダガ神ニハ届カナイ」

#### ミカエル戦（battle2）— enemy_group_id: `9043` / BGM: `bgm_spot_final_boss`

#### 撤退〜別れ（retreat_01〜farewell_03）— guest_id: `npc_guest_volg`
「命令ヲ下シタ者ハマダ天ノ上ニイル」ヴォルグ「人間は人間らしく生き抜くべきだ」

#### `end_node`（type: end_success）
四大天使の侵攻は退けた。世界はまだ生きている。（第3部前半完）
- **rewards**: items: [503]

#### `end_failure`（type: end_failure）
