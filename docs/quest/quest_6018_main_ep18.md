# クエスト仕様書：6018 — 第18話「戦神の洗礼」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6018 |
| **Slug** | `main_ep18` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 18（Very Hard） |
| **難度** | 4 |
| **依頼主** | — |
| **出現条件** | 前提クエストクリア: main_ep16 / 滞在拠点: 華龍神朝首都 天極城「龍京」 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Very Hard（rec_level: 18） |
| **経過日数 (time_cost)** | 5 |
| **ノード数** | 44ノード |
| **報酬アイテム** | 506（軍神の剣） |
| **サムネイル画像** | `/images/quests/bg_ruins_field.png` |

---

## 1. クエスト概要

### 短文説明
```
龍京近郊の遺跡へ。そこにある石碑が映し出すのは、かつて不死の傭兵王ヴォルグと共闘し、軍神アレスに挑んだ熱き死闘の記憶。
```

### 長文説明
```
英霊の記憶の導きを受け、華龍神朝の首都・龍京から、郊外の奥地に眠る風化遺跡へ向かった。
そこにある古代の戦神の石碑に触れると、かつて先代の英霊が、不死の傭兵王ヴォルグと共に軍神アレスへ挑んだ共闘の記憶が流れ込んでくる。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:3500|Rep:25|Item:506|Order:5
```

---

## 3. シナリオノード構成（44ノード）

### 全体フロー
```text
start → start_02 → start_03 → start_04 → text_port → text_port_02 → text_port_03
  → text_voyage → text_voyage_02 → text_voyage_03 → text_island_arrival → text_island_arrival_02
  → text_island_arrival_03 → text_jungle → text_jungle_02 → text_jungle_03 → text_ruins
  → text_ruins_02 → text_stele_found → text_stele_found_02 → text_touch → text_touch_02
  → text_touch_03 → text_memory_forest → text_memory_forest_02 → text_memory_forest_03 → text_ares_appear
  → text_ares_appear_02 → text_ares_appear_03 → text_ares_voice → text_ares_voice_02 → text_ares_challenge
  → text_ares_challenge_02 → battle → choice1 → text_ares_defeat → text_ares_defeat_02
  → text_sword → text_sword_02 → text_return → text_return_02 → end_node → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
英霊の導きに従い、あなたは華龍神朝の首都・龍京へと向かった。
```

#### `start_02`（text）
**演出:** bg: bg_road_day
```text
かつて、あの不死の傭兵ヴォルグと刃を交え、共に戦った日々が脳裏をよぎる。
```

#### `start_03`（text）
**演出:** bg: bg_road_day
```text
（奴との共闘で得たものは、ただの勝利ではない。神をも超える強者の意志だ……）
```

#### `start_04`（text）
**演出:** bg: bg_road_day
```text
彼と挑んだ戦神の息吹が、龍京の近くにあるという。あなたは地元の人から、誰も近づかない「雷鳴の遺跡」の噂を聞き出した。
```

#### `text_port`（text）
**演出:** bg: bg_road_day
```text
龍京の街外れで、険しい霊山へ向かうための登山装備を整えた。
```

#### `text_port_02`（text）
**演出:** bg: bg_road_day
```text
地元の猟師は「山頂は霧が狂い、迷えば二度と戻れない」と首を振る。
```

#### `text_port_03`（text）
**演出:** bg: bg_road_day
```text
忠告を背に、あなたは霧深い登山道へ入り、冷たい雨の中を登り始めた。
```

#### `text_voyage`（text）
**演出:** bg: bg_road_day
```text
山道を歩いて数刻。視界を遮るほどの濃い霧と、激しい落雷が周囲を脅かし始める。
```

#### `text_voyage_02`（text）
**演出:** bg: bg_road_day
```text
雷鳴が鼓膜を震わせるが、腕の紋様が霧の奥の安全なルートを示していた。
```

#### `text_voyage_03`（text）
**演出:** bg: bg_road_day
```text
あなたは荒れ狂う雷雨を避けて、山奥の遺跡の敷地へと足を踏み入れた。
```

#### `text_island_arrival`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
たどり着いた場所は、山奥の森の中にひっそりと隠された古代の遺跡だった。
```

#### `text_island_arrival_02`（text）
**演出:** bg: bg_ruins_field
```text
崩壊した巨石の柱と、苔に半ば埋もれた石畳の古い広場。
```

#### `text_island_arrival_03`（text）
**演出:** bg: bg_ruins_field
```text
この場所の奥から、ビリビリと肌を刺す闘気が漏れていた。
```

#### `text_jungle`（text）
**演出:** bg: bg_ruins_field
```text
生い茂る木々を掻き分けるように奥へ進むと、苔むした古い石段が姿を現した。
```

#### `text_jungle_02`（text）
**演出:** bg: bg_ruins_field
```text
石段を登り詰めると、円形の闘技場のような石畳の広場に出る。
```

#### `text_jungle_03`（text）
**演出:** bg: bg_ruins_field
```text
その中央に、熱を帯びて赤く輝く三つ目の石碑が立っていた。
```

#### `text_ruins`（text）
**演出:** bg: bg_ruins_field
```text
祭壇の周囲には、無数の古びた武器が地面に突き立てられている。
```

#### `text_ruins_02`（text）
**演出:** bg: bg_ruins_field
```text
刃が欠け錆びついた剣。かつての戦士たちの闘争の跡だ。
```

#### `text_stele_found`（text）
**演出:** bg: bg_heroic_stele
```text
石碑に近づくと、赤く輝く古代文字が空中に浮かび上がった。
```

#### `text_stele_found_02`（text）
**演出:** bg: bg_heroic_stele
```text
「強者との誓いの記憶に触れよ」とある。手を石碑に触れた。
```

#### `text_touch`（text）
**演出:** bg: bg_heroic_stele
```text
脳裏に激しい衝撃が走り、意識が荒れ狂う嵐の戦場へと引き剥がされる。
```

#### `text_touch_02`（text）
**演出:** bg: bg_heroic_stele
```text
それは先代英霊とヴォルグが共に戦った、共闘の記憶だった。
```

#### `text_touch_03`（text）
**演出:** bg: bg_heroic_stele, speaker: ヴォルグ
```text
「おい、ぼさっとすんな。俺たちの戦いはこれからだぜ」
```

#### `text_memory_forest`（text）
**演出:** bg: bg_memory_forest
```text
雨が激しく降り注ぐ、暗い森の奥。無数の使徒に包囲されていた。
```

#### `text_memory_forest_02`（text）
**演出:** bg: bg_memory_forest
```text
体は傷だらけで限界に近い。しかし、ヴォルグは笑っている。
```

#### `text_memory_forest_03`（text）
**演出:** bg: bg_memory_forest, speaker: ヴォルグ
```text
「ハッ、いい絶望感だ。おい、相棒、背中は任せたぞ！」
```

#### `text_ares_appear`（text）
**演出:** bg: bg_memory_forest, bgm: bgm_battle_strong
```text
使徒たちの奥から、圧倒的な闘気を纏う赤銅色の巨影が現れた。
```

#### `text_ares_appear_02`（text）
**演出:** bg: bg_memory_forest
```text
巨剣を片手で軽々と提げた男。軍神アレスが立ち塞がっていた。
```

#### `text_ares_appear_03`（text）
**演出:** bg: bg_memory_forest
```text
（対峙するだけで、魂が震えるほどの圧倒的な力……。だが、ヴォルグが笑っているなら、引くわけにはいかないな）
```

#### `text_ares_voice`（text）
**演出:** bg: bg_memory_forest, speaker: 軍神アレス
```text
「クハハ！ 面白い人間どもだ。俺の眷属をここまで屠るとはな」
```

#### `text_ares_voice_02`（text）
**演出:** bg: bg_memory_forest, speaker: 軍神アレス
```text
「特にそこの不死の男、お前の闘志はいい色に滾っているぞ」
```

#### `text_ares_challenge`（text）
**演出:** bg: bg_memory_forest, speaker: 軍神アレス
```text
「我が名はアレス。二人で我に挑むか。よかろう！」
```

#### `text_ares_challenge_02`（text）
**演出:** bg: bg_memory_forest, speaker: 軍神アレス
```text
「その歪な絆と、限界を超えた闘争を我に見せてみよ！」
```

#### `battle`（battle）
**演出:** bg: bg_memory_forest, bgm: bgm_spot_final_boss
**パラメータ:** enemy_group_id: 9051, next: choice1, fail: end_failure

#### `choice1`（choice）
**演出:** bg: bg_memory_forest, bgm: bgm_spot_final_boss
| 選択肢 | next_node |
|---|---|
| 「軍神アレスを撃退する」 | `text_ares_defeat` |

#### `text_ares_defeat`（text）
**演出:** bg: bg_memory_forest
```text
ヴォルグの剛撃と、あなたの一撃がアレスの鎧を叩き斬る。
```

#### `text_ares_defeat_02`（text）
**演出:** bg: bg_memory_forest, speaker: 軍神アレス
```text
「見事！ これぞ闘争の極み！ 人間ども、大いに楽しんだぞ！」
```

#### `text_sword`（text）
**演出:** bg: bg_ruins_field
```text
光が収まり、意識は現実の遺跡へと引き戻されていた。
```

#### `text_sword_02`（text）
**演出:** bg: bg_ruins_field
```text
石碑の足元には、真っ赤に熱を帯びた「軍神の剣」が刺さっている。
```

#### `text_return`（text）
**演出:** bg: bg_ruins_field
```text
（これが軍神の剣か……。まだ熱を帯びている。あの闘争の記憶は、ただの幻ではないのだな……）
```

#### `text_return_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
手にした剣を握り締め、あなたは山を下りて龍京へと帰還した。残る石碑はあと二つ。次は「出雲」の地へ向かう。
```

#### `end_node`（end_success）
**演出:** bg: bg_road_day
```text
アレスの試練を乗り越え、遺産である「軍神の剣」を得た。
```
**rewards:** Gold:3500, Rep:25, Item:506, Order:5

#### `end_failure`（end_failure）
**演出:** bg: bg_memory_forest
```text
アレスの神威の前に力尽き、自分とヴォルグは倒れ伏した。
```
**rewards:** Gold:0
