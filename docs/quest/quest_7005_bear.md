# クエスト仕様書：7005 — 凶熊狩り

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7005 |
| **Slug** | `qst_gen_bear` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 開拓村の長 |
| **出現条件** | 全拠点で出現 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 4 |
| **ノード数** | 21ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Easy（rec_level: 2） |
| **サムネイル画像** | /images/quests/bg_ruins_field.png |
---

## 1. クエスト概要
 
### 短文説明
```
[討伐] 開拓村を襲う凶暴な大熊を狩る。前任の猟師は行方不明。
```

### 長文説明
```
開拓村の長から、村の東の森に棲みついた凶暴な大熊の討伐を依頼された。
その大熊は家畜を襲うだけでなく、調査に向かった村の猟師ヨルンを血祭りにあげ、行方不明にしている。
片目が潰れ、全身傷だらけの手負いというその獣は、尋常ならざる狂気を秘めている。
かつての仲間を心配する長のため、森の深部へ入り、凶獣を仕留めよ。
```

---

## 2. 報酬定義

```
Gold:200|Rep:5|Item:item_bear_pelt
```

---

## 3. シナリオノードフロー

```text
start → text_01 → text_02 → text_03 → text_04
  → forest_01 → forest_02 → trail_01 → trail_02 → trail_03
    → encounter_01 → encounter_02 → encounter_03
      → battle
        ├─ win → after_01 → after_02 → return_01 → return_02 → return_03
        │    → end_success
        └─ lose → end_failure
```

```text
start_prep → start → text_01 → text_02 → text_03 → text_04 → text_04_think
  → forest_01 → forest_scenery → forest_02 → forest_deep → trail_01
    → trail_01_body → trail_02 → trail_02_scenery → trail_03
      → encounter_01 → encounter_look → encounter_02 → encounter_03 → battle
        ├─ win → after_01 → after_02 → after_02_silent → return_01 → return_02
        │    → return_03 → return_03_rest → end_success
        └─ lose → end_failure
```

### ノード詳細（30ノード）

#### `start_prep`（text）
**演出:** bg: bg_guild
```text
暖炉に薪が爆ぜる音が響く、開拓村の荒れ果てた集会所。
```

#### `start`（text）
**演出:** bg: bg_guild
```text
暖かなスープをすすりながら、長の話に耳を傾ける。
```

#### `text_01`（text）
**演出:** bg: bg_guild, speaker: 開拓村の長
```text
「村の東の森に、恐ろしく凶暴な大熊が棲みついてしまってな…」
```

#### `text_02`（text）
**演出:** bg: bg_guild, speaker: 開拓村の長
```text
「畑を荒らすだけならまだしも、調査に向かった猟師のヨルンが行方不明になっておる」
```

#### `text_03`（text）
**演出:** bg: bg_guild, speaker: 開拓村の長
```text
「もう三日も戻らん。加えて、森の入り口には、奴の血痕が点々と残されていたというわけだ」
```

#### `text_04`（text）
**演出:** bg: bg_guild, speaker: 開拓村の長
```text
「あの獣は体中に傷があり、片目が潰れている。わしの経験上、手負いの獣ほど厄介なものはない」
```

#### `text_04_think`（text）
**演出:** bg: bg_guild
```text
「片目が潰れた熊」。かつて手負いにされ、凶暴化した獣か。
```

#### `forest_01`（text）
**演出:** bg: bg_forest_day
```text
鬱蒼と生い茂る森へ足を踏み入れる。密な枝葉が日光を遮り、冷たい湿気が立ち込めていた。
```

#### `forest_scenery`（text）
**演出:** bg: bg_forest_day
```text
足元の枯れたシダを踏みしめるたび、乾いた音が周囲へやけに大きく響いた。
```

#### `forest_02`（text）
**演出:** bg: bg_forest_day
```text
地面に巨大な足跡。五本の爪跡が泥の中に深く刻まれていた。
```

#### `forest_deep`（text）
**演出:** bg: bg_forest_day
```text
森の奥へ進むほど、空気から生命の気配が薄れていく。
```

#### `trail_01`（text）
**演出:** bg: bg_forest_day
```text
足跡の先に引き裂かれた鉄製の罠。猟師ヨルンの物だろう。
```

#### `trail_01_body`（text）
**演出:** bg: bg_forest_day
```text
罠の周りに飛び散った血痕は、すでに黒く変色している。
```

#### `trail_02`（text）
**演出:** bg: bg_forest_day
```text
巨木の幹に荒々しい爪痕。皮が剥がれ、獣の強烈な臭いが漂う。
```

#### `trail_02_scenery`（text）
**演出:** bg: bg_forest_day
```text
静寂が森を支配している。微かな風の音さえも消えた。
```

#### `trail_03`（text）
**演出:** bg: bg_forest_day
```text
突如、目前の藪の奥から、低く地鳴りのような唸り声が響き渡る。
```

#### `encounter_01`（text）
**演出:** bg: bg_forest_day
```text
茂みを掻き分けると、見上げるほどの巨躯が立ち上がった。
```

#### `encounter_look`（text）
**演出:** bg: bg_forest_day
```text
岩のような筋肉に覆われた体躯。剥き出しの牙が光る。
```

#### `encounter_02`（text）
**演出:** bg: bg_forest_day
```text
全身は無数の古傷に覆われ、白く濁った片目の奥には底知れぬ狂気が宿っていた。
```

#### `encounter_03`（text）
**演出:** bg: bg_forest_day
```text
こちらを睨みつけると、森全体を激しく震わせる咆哮を上げた！
```

#### `battle`（battle）
**演出:** bg: bg_forest_day, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `405` |
| 敵表示名 | ジャイアントベア |

```text
大熊が襲いかかってきた！
```

#### `after_01`（text）
**演出:** bg: bg_forest_day
```text
大熊が崩れ落ちた。濁った片目の奥には、深い疲労があった。
```

#### `after_02`（text）
**演出:** bg: bg_forest_day
```text
無残に引き裂かれた猟師の外套の切れ端を見つけ、懐に収める。
```

#### `after_02_silent`（text）
**演出:** bg: bg_forest_day
```text
静まり返った森で、大熊の骸から流れる血の匂いが漂う。
```

#### `return_01`（text）
**演出:** bg: bg_guild
```text
剥ぎ取った大熊の毛皮を担いで村へと戻る。それを示すと、長は深く安堵の息を吐き出した。
```

#### `return_02`（text）
**演出:** bg: bg_guild, speaker: 開拓村の長
```text
「……ヨルンはどうなった？ 遺品だけでも、何か見つからなかったか？」
```

#### `return_03`（text）
**演出:** bg: bg_guild, speaker: 開拓村の長
```text
「あいつの外套か……。ありがとう。これで村の連中も安心できる」
```

#### `return_03_rest`（text）
**演出:** bg: bg_guild
```text
長はヨルンの外套を抱きしめ、静かに目を閉じた。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
凶熊狩り完了。手にした報酬の重みと、残された哀愁を感じる。
```
**rewards:** Gold:200, Rep:5, Item:item_bear_pelt

#### `end_failure`（end_failure）
**演出:** bg: bg_forest_day
```text
大熊の爪が胸を裂く。冷たい落ち葉の上で意識が消え去った。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 405 | ジャイアントベア |
