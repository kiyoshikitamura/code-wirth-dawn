# クエスト仕様書：7020 — 大砂漠の長距離交易護衛

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7020 |
| **Slug** | `qst_mar_caravan` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 5（Normal） |
| **難度** | 3 |
| **依頼主** | 交易商会 |
| **出現条件** | 出現国: マルカンド |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 8 |
| **ノード数** | 30ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 5） |
| **サムネイル画像** | `/images/quests/bg_desert.png` |
## 1. クエスト概要

### 短文説明
```
[護衛] 広大な砂漠を越える商隊の用心棒。盗賊と魔獣の連戦を耐え抜け。
```

### 長文説明
```
マルカンドの交易商会から大口の護衛依頼が入った。
砂漠横断の交易ルート——ラクダ20頭分の香辛料と絹織物を、隣国の交易都市まで無事に届ける仕事だ。
片道8日の長丁場。道中には砂漠の盗賊団と、砂の中に潜む魔獣が待ち構えている。
商品が無事に届けば高額の報酬が約束されるが、砂漠の旅に「安全」という二文字は存在しない。
```

## 2. 報酬定義

```
Gold:500|Chaos:10|Exp:150|Rep:5
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
start → start_desc → intro_1 → intro_1_detail → intro_2 → intro_2_warn → depart → depart_scenery
  → desert_day1 → desert_heat → desert_night → campfire → ambush_alert → ambush_desc
    → battle_wave1
       ├─ win → after_wave1 → after_wave1_check → travel_resume → sandstorm → sandstorm_pass
       │    → beast_alert → beast_desc → battle_wave2
       │       ├─ win → after_wave2 → after_wave2_think → arrive → arrive_guild → reward_scene → end_success
       │       └─ lose → end_failure
       └─ lose → end_failure
```

### ノード詳細（30ノード）

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
交易商会の詰め所。照りつける太陽から逃れた室内も、息苦しい熱気に満ちていた。
```

#### `start_desc`（text）
**演出:** bg: bg_guild
```text
壁には砂丘の連なりを示す古びた地図。机の上では、隊長が金貨を数えている。
```

#### `intro_1`（text）
**演出:** bg: bg_guild, speaker: 交易商会の隊長
```text
「今回の荷は香辛料と絹だ。ラクダ２０頭分。片道８日の旅になる」
```

#### `intro_1_detail`（text）
**演出:** bg: bg_guild, speaker: 交易商会の隊長
```text
「万一、途中で荷を一つでも失えば、お前の報酬から差し引くからな」
```

#### `intro_2`（text）
**演出:** bg: bg_guild, speaker: 交易商会の隊長
```text
「砂漠の野盗どもに加え、最近は砂の下の化け物も狂暴化している」
```

#### `intro_2_warn`（text）
**演出:** bg: bg_guild, speaker: 交易商会の隊長
```text
「死にたくなければ、片時も気を抜くんじゃないぞ」
```

#### `depart`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
王都の頑丈な門を出て、果てなき熱砂の海へと足を踏み出す。長い旅の始まりだ。
```

#### `depart_scenery`（text）
**演出:** bg: bg_desert
```text
ラクダの長い列が、黄金色の砂丘の彼方までゆっくりと連なっていく。
```

#### `desert_day1`（text）
**演出:** bg: bg_desert
```text
出発から二日目。見渡す限りの砂海と青空。前後左右、すべての景色が同じだった。
```

#### `desert_heat`（text）
**演出:** bg: bg_desert
```text
陽炎が揺れる。革の水筒は早くも空に近い。乾いた風が容赦なく喉を焼いた。
```

#### `desert_night`（text）
**演出:** bg: bg_desert_night, bgm: bgm_quest_calm
```text
夜は極寒。気温が急降下する中、私たちはラクダで壁を作り野営の準備を整える。
```

#### `campfire`（text）
**演出:** bg: bg_camp
```text
小さく爆ぜる焚き火。男たちは声を潜め、砂漠に住まう死霊の怪談を囁き合う。
```

#### `ambush_alert`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_tense
```text
深夜、見張りが私の肩を揺さぶる。砂丘の影に、不気味な火が揺れていた。
```

#### `ambush_desc`（text）
**演出:** bg: bg_desert_night
```text
ターバンを巻いた無数の人影が、音もなく近づく。商隊を狙う砂漠の野盗団だ。
```

#### `battle_wave1`（battle）
**演出:** bg: bg_desert_night, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `420` |
| 敵表示名 | 砂漠の盗賊団 |

```text
闇に紛れて奇襲を仕掛けてきた野盗どもを迎え撃て！ 交易品を守るのだ！
```

#### `after_wave1`（text）
**演出:** bg: bg_desert_night, bgm: bgm_quest_calm
```text
野盗を撃退した。逃げていく影の足跡は、風が運ぶ砂によってすぐに消え去る。
```

#### `after_wave1_check`（text）
**演出:** bg: bg_desert_night
```text
荷を確認する。絹の包みは無事だ。ラクダも欠けることなく息を整えている。
```

#### `travel_resume`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
明朝、旅を再開する。体は重いが、立ち止まれば更なる追撃を招くだけだ。
```

#### `sandstorm`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
五日目の昼。突如、空が赤褐色に染まり、猛烈な砂嵐が全てを覆い尽くした。
```

#### `sandstorm_pass`（text）
**演出:** bg: bg_desert
```text
ラクダにしがみつき、嵐が去るのを耐える。周囲の砂が不自然に脈動し始めた。
```

#### `beast_alert`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
地響きと共に地表面が揺れる。獣の危険を察知し、ラクダたちが狂乱する。
```

#### `beast_desc`（text）
**演出:** bg: bg_desert
```text
砂が爆発的に噴き上がり、巨大な口が姿を現した。砂漠の魔獣サンドワームだ。
```

#### `battle_wave2`（battle）
**演出:** bg: bg_desert, bgm: bgm_battle_boss
| 設定 | 値 |
|-----|-----|
| 敵グループID | `421` |
| 敵表示名 | 砂漠の魔獣 |

```text
砂の下から襲いかかる巨大な大虫と、毒針を構える大サソリを撃破せよ！
```

#### `after_wave2`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
魔獣は血を吹き出しながら砂の中へ沈んでいった。危険な戦闘を生き延びた。
```

#### `after_wave2_think`（text）
**演出:** bg: bg_desert
```text
装備に入り込んだ砂を払い落とす。目的地である交易都市は、もう間近のはずだ。
```

#### `arrive`（text）
**演出:** bg: bg_desert
```text
八日目の夕暮れ。沈む夕陽に照らされた、美しい交易都市の白い城壁が見えた。
```

#### `arrive_guild`（text）
**演出:** bg: bg_guild
```text
門をくぐり、商会の倉庫に到着した。泥や砂に汚れた私たちを代理人が迎える。
```

#### `reward_scene`（text）
**演出:** bg: bg_guild, speaker: 交易商会の代理人
```text
「全頭無事での帰還とは恐れ入った！ 約束の報酬だ、受け取ってくれ」
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
ずっしりと重い金袋を受け取る。この砂と汗まみれの旅も、無駄ではなかった。
```
**rewards:** Gold:500, Chaos:10, Exp:150, Rep:5

#### `end_failure`（end_failure）
**演出:** bg: bg_desert
```text
過酷な熱砂と魔獣の前に力尽きる。商隊は散り散りになり、砂の海へ消えた。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 420 | 砂漠の盗賊団 |
| 421 | 砂漠の魔獣 |
