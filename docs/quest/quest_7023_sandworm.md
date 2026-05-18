# クエスト仕様書：7023 — 交易路を脅かす大砂虫討伐

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7023 |
| **Slug** | `qst_mar_sandworm` |
| **クエスト種別** | マルカンドクエスト（Markand） |
| **推奨レベル** | 5（Normal） |
| **難度** | 4 |
| **依頼主** | 交易商会 |
| **出現条件** | 制限なし / 出現拠点: loc_marcund |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 5） |
| **経過日数 (time_cost)** | 4（成功: 4日 / 失敗: 2日） |
| **ノード数** | 24ノード |
| **サムネイル画像** | `/images/quests/bg_desert.png` |

## 1. クエスト概要

### 短文説明
```
[討伐] 流砂の底に潜む巨大な魔獣を誘い出し、オアシスの安全を確保せよ。
```

### 長文説明
```
交易商会から緊急の依頼。砂漠の主要交易路に巨大な砂虫——サンドワーム——が棲みついた。すでに商隊2つが飲み込まれ、通行不能となっている。囮の荷車を使って奴を地上におびき出し、息の根を止めてほしい。報酬は高額だが、相手は砂漠の覇者。商会が用意した爆薬が、唯一の切り札だ。
```

## 2. 報酬定義

```
Gold:600|Chaos:10|Exp:200|Rep:10
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
start → intro_1 → intro_2 → prepare → receive_explosive (reward: item_explosive)
  → travel_to_site → site_desc → set_bait → bait_desc
    → wait_1 → tremor_1 → scouts_appear
      → battle_wave1 (デザートスコーピオン x2 / サンドワーム x1)
         ├─ [勝利] → after_wave1 → reset_bait → wait_2 → tremor_2
         │    → boss_emerge → boss_desc → trap_collapse (hp_damage: 50%)
         │      → battle_wave2 (サンドワーム x2)
         │         ├─ [勝利] → after_wave2 → carcass → return_report → end_success
         │         └─ [敗北] → end_failure
         └─ [敗北] → end_failure
```

> **ギミック説明:**
> - `receive_explosive`: 商会から爆薬を1つ受け取る（reward ノードでインベントリに追加）。
> - `trap_collapse`: ボス戦直前にサンドワームの奇襲でパーティHP50%減少（hp_damage ノード）。
> - 爆薬はバトル中使用アイテムとして、サンドワームに対して大ダメージを与える（「五英霊の誓約」と同様のギミック）。

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
交易商会の本部に呼ばれた。
幹部たちが深刻な顔で地図を囲んでいる。
```

#### `intro_1`（text）
**演出:** bg: bg_guild, speaker: 商会の幹部
```text
「主要交易路に大砂虫が棲みついた。
　商隊が2つ飲み込まれ、もう誰もあのルートを通れない」
```

#### `intro_2`（text）
**演出:** bg: bg_guild, speaker: 商会の幹部
```text
「囮の荷車を用意した。振動に反応して地上に出てくるはずだ。
　出てきたところを仕留めてくれ。報酬は弾む」
```

#### `prepare`（text）
**演出:** bg: bg_guild, speaker: 商会の幹部
```text
「それと——これを持っていけ。商会の錬金術師が用意した爆薬だ。
　砂虫の体に叩き込めば、体内で爆発して大ダメージを与えられる」
```

#### `receive_explosive`（reward）
**演出:** bg: bg_guild
```text
爆薬を受け取った。ずしりと重い。
取り扱いには細心の注意が必要だ——間違っても自分に使うなよ。
```
**パラメータ:** type: reward, item_id: `item_explosive`, next: travel_to_site

#### `travel_to_site`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
砂漠の出没地点へ向かう。二日の道のり。
途中、砂に半分埋もれた商隊の残骸を見た。荷もラクダも——跡形もない。
```

#### `site_desc`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
出没地点に到着した。
地面のあちこちに、巨大な円形の陥没跡がある。砂虫の通り道だ。
```

#### `set_bait`（text）
**演出:** bg: bg_desert
```text
荷車を砂の上に据え、中に香辛料の袋を積み上げる。
振動を伝えるため、荷台を太鼓のように打ち鳴らした。
```

#### `bait_desc`（text）
**演出:** bg: bg_desert
```text
砂漠に響く鈍い振動。それが地中深くまで伝わっていく。
後は待つだけだ。剣を握り直し、砂の揺れに神経を集中させる。
```

#### `wait_1`（text）
**演出:** bg: bg_desert
```text
しばらく何も起きなかった。風の音だけが砂丘を撫でていく。
だが——足元の砂が、微かに波打ち始めた。
```

#### `tremor_1`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
地鳴りが強まる。荷車がガタガタと揺れ始めた。
前方の砂丘に亀裂が走り、サソリが砂の中から這い出てくる。前衛だ。
```

#### `scouts_appear`（text）
**演出:** bg: bg_desert
```text
サソリの群れに混じって、地中から小型のサンドワームも姿を現した。
本命はまだ来ていない——だが、まずこいつらを片付けなければ。
```

#### `battle_wave1`（battle）【第1戦：前哨戦】
**演出:** bg: bg_desert, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `425`（新規作成） |
| 敵グループSlug | `grp_sandworm_scout` |
| 構成 | デザートスコーピオン(1211) x2 / サンドワーム(1212) x1 |
| 敵表示名 | 砂漠の先遣隊 |

```text
砂虫とサソリの群れが荷車に群がってきた！
```

#### `after_wave1`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
前衛を退けた。だが、荷車の振動はまだ続いている。
地面の揺れが——さっきとは比べ物にならないほど大きくなっていく。
```

#### `reset_bait`（text）
**演出:** bg: bg_desert
```text
散乱した荷を急いで積み直し、再び荷台を打ち鳴らす。
今度こそ本命を引きずり出す。
```

#### `wait_2`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
地面全体が波打っている。
砂丘が崩れ、地平線が歪んで見える。来る——！
```

#### `tremor_2`（text）
**演出:** bg: bg_desert
```text
砂が爆発的に噴き上がった。
二つの巨大な口が、空に向かって同時に開く。
```

#### `boss_emerge`（text）
**演出:** bg: bg_desert
```text
二匹——！
白い牙を剥いた顎が、荷車を丸ごと飲み込もうとしている。
```

#### `boss_desc`（text）
**演出:** bg: bg_desert
```text
全長は優に船を超える。鱗のような外殻が砂にまみれ、
無数の小さな足が地面を掻きながら、こちらに向き直った。
```

#### `trap_collapse`（hp_damage）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
大砂虫が地面ごと砂を崩壊させた！
足場が崩れ、砂の奔流に巻き込まれる——体中を打ちつけながら必死に這い上がった。
```
**パラメータ:** type: hp_damage, percent: 50, next: battle_wave2

> **ギミック:** パーティのHP現在値を50%減少させた状態でボス戦に突入する。

#### `battle_wave2`（battle）【第2戦：ボス戦】
**演出:** bg: bg_desert, bgm: bgm_battle_boss

| 設定 | 値 |
|-----|-----|
| 敵グループID | `426`（新規作成） |
| 敵グループSlug | `grp_sandworm_boss` |
| 構成 | サンドワーム(1212) x2 |
| 敵表示名 | 大砂虫 |

```text
砂漠の覇者——大砂虫との死闘！ 爆薬を使え！
```

> **ギミック:** 爆薬（`item_explosive`）はバトル中使用可能なアイテム。サンドワーム系エネミーに対して大ダメージを与える（「五英霊の誓約」と同様のターゲット限定ダメージシステム）。

#### `after_wave2`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
最後のサンドワームが砂の中に沈んでいった。もう動かない。
砂漠に静寂が戻る。風だけが、戦いの跡を少しずつ消していく。
```

#### `carcass`（text）
**演出:** bg: bg_desert
```text
巨大な死骸の脇を通り過ぎる。
こいつらの体内からは、高価な素材が取れるはずだが——今は依頼の完了が先だ。
```

#### `return_report`（text）
**演出:** bg: bg_guild, speaker: 商会の幹部
```text
「交易路が復活した……！ お前は商会の恩人だ。
　約束通り、最上級の報酬を用意した。受け取ってくれ」
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
重い金袋を手にした。
砂漠の交易路に、再びラクダの列が戻るだろう。
```
**rewards:** Gold:600, Chaos:10, Exp:200, Rep:10

#### `end_failure`（end_failure）
**演出:** bg: bg_desert
```text
大砂虫の圧倒的な質量の前に、為す術がなかった。
砂の中に引きずり込まれていく意識の中で、砂漠の静寂だけが残った。
```

---

## 4. 敵定義参照（新規エネミーグループ 2件）

### エネミーグループ: `grp_sandworm_scout` (ID: 425)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_markand_scorpion | デザートスコーピオン | 8 | 90 | 30 | 15 |
| enemy_markand_scorpion | デザートスコーピオン | 8 | 90 | 30 | 15 |
| enemy_markand_sand_worm | サンドワーム | 14 | 180 | 45 | 5 |

### エネミーグループ: `grp_sandworm_boss` (ID: 426)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_markand_sand_worm | サンドワーム | 14 | 180 | 45 | 5 |
| enemy_markand_sand_worm | サンドワーム | 14 | 180 | 45 | 5 |

## 4.5. 新規アイテム定義

| ID | Slug | Name | Type | SubType | Value | Description |
|-----|-----|-----|-----|-----|-----|-----|
| 3010 | `item_explosive` | 爆薬 | consumable | battle_use | 0 | 商会の錬金術師が調合した特製爆薬。サンドワームに対して大ダメージを与える。バトル中のみ使用可能。 |

> **ギミック仕様:** `item_explosive` は「五英霊の誓約」と同じシステムを使用し、`target_enemy_slug: enemy_markand_sand_worm` に対して固定大ダメージを与える。

---

## 5. CSVエントリ（quests_normal.csv）

```csv
7023,qst_mar_sandworm,交易路を脅かす大砂虫討伐,5,4,4,loc_marcund,,,,,Gold:600|Chaos:10|Exp:200|Rep:10,交易商会,[討伐] 流砂の底に潜む巨大な魔獣を誘い出し、オアシスの安全を確保せよ。
```

---

## 6. 実装チェックリスト

- [ ] 出現拠点 `loc_marcund` のみ
- [ ] エネミーグループ `grp_sandworm_scout`（425）がenemy_groups.csvに登録済み
- [ ] エネミーグループ `grp_sandworm_boss`（426）がenemy_groups.csvに登録済み
- [ ] `item_explosive` がitems.csvに登録済み
- [ ] `receive_explosive` ノードで爆薬がインベントリに追加されること
- [ ] `trap_collapse` ノードでHP50%減少が適用されること
- [ ] 爆薬がバトル中使用可能で、サンドワームに大ダメージを与えること
- [ ] 2連戦フローが正しく遷移する（前哨戦→HP減少→ボス戦）
- [ ] ボス戦BGMが `bgm_battle_boss` である
- [ ] Gold:600 + Chaos:10 + Exp:200 + Rep:10 が付与される
- [ ] time_cost: 4（成功）/ 2（失敗）が正しく経過する
