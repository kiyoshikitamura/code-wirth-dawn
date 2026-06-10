# クエスト仕様書：7023 — 交易路を脅かす大砂虫討伐

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7023 |
| **Slug** | `qst_mar_sandworm` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 5（Normal） |
| **難度** | 4 |
| **依頼主** | 交易商会 |
| **出現条件** | 出現国: マルカンド |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 4 |
| **ノード数** | 30ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 5） |
| **サムネイル画像** | `/images/quests/bg_desert.png` |
## 1. クエスト概要

### 短文説明
```
[討伐] 流砂の底に潜む巨大な魔獣を誘い出し、オアシスの安全を確保せよ。
```

### 長文説明
```
交易商会から緊急の依頼。砂漠の主要交易路に巨大な砂虫——サンドワーム——が棲みついた。
すでに商隊2つが飲み込まれ、通行不能となっている。
囮の荷車を使って奴を地上におびき出し、息の根を止めてほしい。
報酬は高額だが、相手は砂漠の覇者。商会が用意した爆薬が、唯一の切り札だ。
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
start → start_desc → intro_1 → intro_1_detail → intro_2 → prepare → prepare_detail
  → receive_explosive → travel_to_site → site_desc → set_bait → bait_desc
    → wait_1 → tremor_1 → scouts_appear
      → battle_wave1
         ├─ win → after_wave1 → reset_bait → wait_2 → tremor_2 → boss_emerge → boss_desc → trap_collapse
         │    → battle_wave2
         │       ├─ win → after_wave2 → carcass → return_report → knight_reply → end_success
         │       └─ lose → end_failure
         └─ lose → end_failure
```

### ノード詳細（30ノード）

#### `start`（text）
**演出:** bg: bg_tavern_day, bgm: bgm_quest_calm
```text
交易商会の本部。砂嵐に削られた古い石壁に囲まれた部屋で、幹部たちが深刻な顔をしていた。
```

#### `start_desc`（text）
**演出:** bg: bg_tavern_day
```text
机の上に広げられた巨大な砂漠の地図には、赤いインクで通行不能の印がつけられている。
```

#### `intro_1`（text）
**演出:** bg: bg_tavern_day, speaker: 商会の幹部
```text
「主要交易路に大砂虫サンドワームが棲みつき、商隊が２つ丸ごと飲み込まれた」
```

#### `intro_1_detail`（text）
**演出:** bg: bg_tavern_day, speaker: 商会の幹部
```text
「このままでは商売は破滅だ。あのルートを再び開通させねばならん」
```

#### `intro_2`（text）
**演出:** bg: bg_tavern_day, speaker: 商会の幹部
```text
「囮の荷車の振動で奴を引きずり出し、息の根を止めてほしい。報酬は弾む」
```

#### `prepare`（text）
**演出:** bg: bg_tavern_day, speaker: 商会の幹部
```text
「それと……これを持っていけ。錬金術師が作った、対砂虫用の特製爆薬だ」
```

#### `prepare_detail`（text）
**演出:** bg: bg_tavern_day, speaker: 商会の幹部
```text
「奴の口内へ叩き込めば、いかなる巨大な外殻だろうと内部から爆破できる」
```

#### `receive_explosive`（reward）
**パラメータ:** item_id: `item_explosive`, next: `travel_to_site`
**演出:** bg: bg_tavern_day
```text
黒い金属筒に入った爆薬を受け取る。独特のツンとした火薬の臭いと、ずっしりとした重みがあった。
```

#### `travel_to_site`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
砂漠の出没地へ向かう。途中で見かけた商隊の残骸は、押し潰され砂に半ば埋もれていた。
```

#### `site_desc`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
現場に到着した。周囲の砂丘は漏斗状に崩れ、巨大な陥没穴が幾つも口を開けている。
```

#### `set_bait`（text）
**演出:** bg: bg_desert
```text
砂地の上に囮の荷車を据え置く。荷台の隙間に、香辛料の袋をぎっしりと積み上げた。
```

#### `bait_desc`（text）
**演出:** bg: bg_desert
```text
仕掛けを作動させ、荷車から規則的な振動を発生させる。地面の砂が微かに躍り始めた。
```

#### `wait_1`（text）
**演出:** bg: bg_desert
```text
静寂の中、抜剣して待つ。熱い砂を吹き抜ける風の音だけが、耳元で虚しく響いていた。
```

#### `tremor_1`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
突如、足元から激しい衝撃。砂の中から、大サソリと小型の砂虫が飛び出してくる。
```

#### `scouts_appear`（text）
**演出:** bg: bg_desert
```text
本命の呼び水に引かれた先遣の群れだ。まずはこいつらを素早く排除せよ！
```

#### `battle_wave1`（battle）
**演出:** bg: bg_desert, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `425` |
| 敵表示名 | 砂漠の先遣隊 |

```text
大砂虫の出現に備えつつ、襲いかかるサソリと砂虫を切り伏せろ！
```

#### `after_wave1`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
先遣隊を撃破した。しかし、本命の接近を示すように地響きは数十倍に膨れ上がる。
```

#### `reset_bait`（text）
**演出:** bg: bg_desert
```text
倒壊しかけた荷車の震動装置を叩き、最大出力で大砂虫をさらにおびき出す。
```

#### `wait_2`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
地表の砂が流砂のように流れ始める。足場が急速に崩れ、逃げ場が失われていく。
```

#### `tremor_2`（text）
**演出:** bg: bg_desert
```text
砂の海が爆発した。天を突く二つの巨大な影が、激しい砂煙と共に急上昇する。
```

#### `boss_emerge`（text）
**演出:** bg: bg_desert
```text
現れたのは二匹の大砂虫。獲物を探すように、粘液に塗れた蛇腹の肉体を捩らせた。
```

#### `boss_desc`（text）
**演出:** bg: bg_desert
```text
船ほどもある巨体。中心に並ぶ同心円状の白い牙が、鋭い摩擦音を立てている。
```

#### `trap_collapse`（hp_damage）
**パラメータ:** percent: 50, next: `battle_wave2`
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
砂虫の尾の一撃が地盤を砕いた！ 崩落に巻き込まれ、全身を強打しながら這い上がる。
```

#### `battle_wave2`（battle）
**演出:** bg: bg_desert, bgm: bgm_battle_boss
| 設定 | 値 |
|-----|-----|
| 敵グループID | `426` |
| 敵表示名 | 大砂虫 |

```text
砂漠の覇者との戦い！ 隙を見て、商会から預かった爆薬を叩き込め！
```

#### `after_wave2`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
爆煙が消え、巨虫たちは砂の底へ沈んだ。崩れた砂丘には、静寂だけが残される。
```

#### `carcass`（text）
**演出:** bg: bg_desert
```text
熱い血の悪臭が漂う。砂漠の脅威は去った。これで再び商隊が往来できるはずだ。
```

#### `return_report`（text）
**演出:** bg: bg_tavern_day
```text
王都に戻り、商会本部に討伐成功を報告した。張り詰めていた幹部たちの顔が和らぐ。
```

#### `knight_reply`（text）
**演出:** bg: bg_tavern_day, speaker: 商会の幹部
```text
「見事だ！ これでお前は我が商会の最高の恩人。約束の報酬を受け取ってくれ」
```

#### `end_success`（end_success）
**演出:** bg: bg_tavern_day
```text
重い金袋を懐に収める。砂漠に再びラクダの鈴の音が戻るだろう。
```
**rewards:** Gold:600, Chaos:10, Exp:200, Rep:10

#### `end_failure`（end_failure）
**演出:** bg: bg_desert
```text
大砂虫の圧倒的な体躯の前に崩れ落ちた。砂の中に引きずり込まれ、意識が閉じる。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 425 | 砂漠の先遣隊 |
| 426 | 大砂虫 |

## 4.5. 新規アイテム定義

| ID | Slug | Name | Type | SubType | Value | Description |
|-----|-----|-----|-----|-----|-----|-----|
| 3010 | `item_explosive` | 爆薬 | consumable | battle_use | 0 | 商会の錬金術師が調合した特製爆薬。サンドワームに対して大ダメージを与える。バトル中のみ使用可能。 |
