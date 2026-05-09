# クエスト仕様書：7021 — 幻覚サソリの毒針調達

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7021 |
| **Slug** | `qst_mar_scorpion` |
| **クエスト種別** | マルカンドクエスト（Markand） |
| **推奨レベル** | 5（Normal） |
| **難度** | 2 |
| **依頼主** | 闇商人 |
| **出現条件** | 制限なし / 出現拠点: loc_marcund |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 5） |
| **経過日数 (time_cost)** | 2（成功: 2日 / 失敗: 1日） |
| **ノード数** | 18ノード |
| **サムネイル画像** | `/images/quests/bg_desert.png` |

## 1. クエスト概要

### 短文説明
```
[納品] 砂漠の奥地に棲む幻覚サソリを狩り、闇商人に毒針を納品する。
```

### 長文説明
```
マルカンドの裏路地で、闇商人から密かに依頼を受けた。「幻覚サソリの毒針」——暗殺用の薬や違法な麻薬の原料となる希少な素材だ。砂漠の岩場に棲むこの危険な生き物の毒は、微量で人を幻覚に陥れ、過剰摂取で確実に殺す。正規の市場には出回らない品であり、手を出すこと自体が後ろ暗い。だが、闇商人の金払いは良い。
```

## 2. 報酬定義

```
Gold:300|Evil:5|Chaos:5|Exp:100
```

## 2.5. 失敗ペナルティ（共通仕様）

| 条件 | ペナルティ |
|------|-----------|
| クエスト失敗（敗北/撤退/ギブアップ） | 名声 -3〜-10（ランダム、現在拠点） |
| バトル敗北（全般） | VIT -1（クエスト/ランダムエンカウント/賞金稼ぎ共通） |
| 経過日数 | クエスト定義の days_failure 値を適用 |

## 3. シナリオノード構成

### 全体フロー

```text
start → intro_1 → intro_2 → travel_desert
  → reach_rocks → search_1 → find_nest → nest_desc
    → battle_scorpion (デザートスコーピオン x3)
       ├─ [勝利] → harvest_1 → harvest_2 → travel_back
       │    → back_alley → deliver_1 → dealer_reply → end_success
       └─ [敗北] → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
マルカンドの裏路地。香辛料と汗の匂いが混じる路地の奥で、
フードを目深に被った男が待っていた。
```

#### `intro_1`（text）
**演出:** bg: bg_slums, speaker: 闇商人
```text
「幻覚サソリの毒針が欲しい。新鮮なやつを3本。
　何に使うかは聞くな。それが商売のルールだ」
```

#### `intro_2`（text）
**演出:** bg: bg_slums, speaker: 闇商人
```text
「奴らの巣は砂漠の東にある岩場だ。
　赤い尾を光らせているのが目印。刺されたら……まあ、気をつけろ」
```

#### `travel_desert`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
砂漠の東へ向かう。乾いた風が砂を巻き上げ、
視界が霞む中をひたすら歩き続けた。
```

#### `reach_rocks`（text）
**演出:** bg: bg_desert
```text
半日ほど歩くと、赤茶けた岩場が見えてきた。
巨大な岩の隙間から、微かに紫色の光が漏れている。
```

#### `search_1`（text）
**演出:** bg: bg_desert
```text
岩の隙間に手を伸ばすのは自殺行為だ。
石を投げて反応を見る。暗闇の奥で、何かがカサカサと動いた。
```

#### `find_nest`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
岩の裏側に回り込むと、地面にいくつもの穴が空いている。
サソリの巣穴だ。穴の縁が紫色に染まっているのは、毒のせいだろう。
```

#### `nest_desc`（text）
**演出:** bg: bg_desert
```text
穴の一つから、尾の先を紫色に光らせたサソリが這い出てきた。
大人の腕ほどの大きさ。こちらを威嚇するように、鋏を打ち鳴らしている。
```

#### `battle_scorpion`（battle）
**演出:** bg: bg_desert, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `422`（新規作成） |
| 敵グループSlug | `grp_scorpion_nest` |
| 構成 | デザートスコーピオン(1211) x3 |
| 敵表示名 | 幻覚サソリの群れ |

```text
巣穴から次々とサソリが這い出してくる！毒針に注意しろ！
```

#### `harvest_1`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
サソリを仕留めた。紫色に光る尾を慎重に切り取る。
ナイフの先が微かに痺れた。素手で触ったら終わりだったろう。
```

#### `harvest_2`（text）
**演出:** bg: bg_desert
```text
3本分の毒針を布に包み、革袋に入れた。
砂漠の熱で変質しないうちに、急いで戻らなければ。
```

#### `travel_back`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
岩場を後にし、マルカンドへの帰路を急ぐ。
革袋の中身を考えると、あまり気分の良いものではない。
```

#### `back_alley`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
日が暮れた頃、マルカンドの裏路地に戻ってきた。
あの闇商人は、同じ場所で待っていた。
```

#### `deliver_1`（text）
**演出:** bg: bg_slums
```text
革袋を差し出す。闇商人は中身を確認し、
一本ずつ光に透かして品質を確かめた。
```

#### `dealer_reply`（text）
**演出:** bg: bg_slums, speaker: 闇商人
```text
「上物だ。鮮度も申し分ない。
　金は約束通り。また入り用になったら声をかける」
```

#### `end_success`（end_success）
**演出:** bg: bg_slums
```text
金袋を受け取った。この毒針が誰かの命を奪う道具になるのだろう。
だが、それは自分の知ったことではない——そう言い聞かせた。
```
**rewards:** Gold:300, Evil:5, Chaos:5, Exp:100

#### `end_failure`（end_failure）
**演出:** bg: bg_desert
```text
サソリの毒が全身に回り始めた。
視界が歪み、砂漠が紫色に溶けていく——これが幻覚か。
```

---

## 4. 敵定義参照（新規エネミーグループ 1件）

### エネミーグループ: `grp_scorpion_nest` (ID: 422)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_markand_scorpion | デザートスコーピオン | 8 | 90 | 30 | 15 |
| enemy_markand_scorpion | デザートスコーピオン | 8 | 90 | 30 | 15 |
| enemy_markand_scorpion | デザートスコーピオン | 8 | 90 | 30 | 15 |

---

## 5. CSVエントリ（quests_normal.csv）

```csv
7021,qst_mar_scorpion,幻覚サソリの毒針調達,5,2,2,loc_marcund,,,,,Gold:300|Evil:5|Chaos:5|Exp:100,闇商人,[納品] 砂漠の奥地に棲む幻覚サソリを狩り、闇商人に毒針を納品する。
```

---

## 6. 実装チェックリスト

- [ ] 出現拠点 `loc_marcund` のみ
- [ ] エネミーグループ `grp_scorpion_nest`（422）がenemy_groups.csvに登録済み
- [ ] Gold:300 + Evil:5 + Chaos:5 + Exp:100 が付与される
- [ ] time_cost: 2（成功）/ 1（失敗）が正しく経過する
