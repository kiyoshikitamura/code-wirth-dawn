# クエスト仕様書：6014 — 第14話「疑心の囁き」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6014 |
| **Slug** | `main_ep14` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 14 |
| **ゲストNPC** | ヴォルグ（guest_join → leave） |
| **特記** | ボス: 大天使ガブリエル |

---

## 2. 報酬定義
```
Exp:400|Gold:2000|Rep:20|Order:5
```

---

## 3. シナリオノード構成（44ノード）

### 全体フロー
```text
start〜start_03 → volg_join → arrival_01〜arrival_02
  → chaos_01〜chaos_04 → volg_01〜volg_02(speaker:ヴォルグ)
  → shrine_01〜shrine_02 → whisper_01〜whisper_04
  → guard_01 → battle1(504)
  → inner_01〜inner_02 → gabriel_01〜gabriel_04(speaker:大天使ガブリエル)
  → volg_defiance_01〜volg_defiance_02(speaker:ヴォルグ)
  → battle2(9042) → retreat_01〜retreat_03
  → sanity_01〜sanity_02 → volg_leave
  → next_01 → end_node
```

### ノード詳細（主要ノード）

#### 出雲到着（arrival_01〜chaos_04）— 背景: `bg_izumo_ruined`
住民同士が戦っている。「お前が裏切者だ！天の声がそう言った！」

#### ガブリエルの啓示（whisper_01〜whisper_04）
頭の中に声。「背後ノ男ハオ前ヲ殺ソウトシテイル」互いに手が武器に伸びかけた。

#### 啓示の使徒（battle1）— enemy_group_id: `504`

#### ガブリエル（gabriel_01〜gabriel_04）— speaker: `大天使ガブリエル`
「人間ハ互イヲ信用シテイナイ。少シ背中ヲ押セバ自ラ殺シ合イヲ始メル」

#### ヴォルグ反論（volg_defiance_01〜02）— speaker: `ヴォルグ`
「俺がこいつと一緒にいる理由？面白ェからだよ」

#### ガブリエル戦（battle2）— enemy_group_id: `9042` / BGM: `bgm_battle_strong`

#### 正気回復（sanity_01〜volg_leave）— guest_id: `npc_guest_volg`
「残りは一体。ローランドの首都レガリアだ」

#### `end_failure`（type: end_failure）
