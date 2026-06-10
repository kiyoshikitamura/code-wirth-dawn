# クエスト仕様書：7011 — 最前線への聖水輸送

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7011 |
| **Slug** | `qst_rol_holywater` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 4（Normal） |
| **難度** | 2 |
| **依頼主** | 教会 |
| **出現条件** | 出現国: ローランド聖王国 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 4 |
| **ノード数** | 31ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 4） |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |
## 1. クエスト概要

### 短文説明
```
[輸送] アンデッド対策として、前線の砦に祝福された聖水を運ぶ。
```

### 長文説明
```
教会からの正式な依頼。最前線の砦では腐臭が充満し、
戦死者がアンデッドとして歩き出すという異常事態が発生している。
彼らを土へ還し、兵士たちの士気を保つためには教会の「祝福された聖水」が不可欠だ。
重い木箱を荷車に積み、魔物や亡者が彷徨う危険な街道を越えて、前線基地へと物資を輸送せよ。
```

## 2. 報酬定義

```
Gold:400|Order:10|Exp:120|Rep:5
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
start → start_desc → intro_1 → intro_1_detail → intro_2 → intro_2_wish
  → travel_start → travel_start_think → travel_mid → travel_scenery
    → camp → night_watch → encounter_wave1
      → battle_wave1
         ├─ win → after_wave1 → deeper_night → encounter_wave2
         │    → battle_wave2
         │       ├─ win → after_wave2 → after_wave2_think → dawn_road → encounter_wave3
         │       │    → battle_wave3
         │       │       ├─ win → arrive_fort → arrive_fort_desc → meet_commander → meet_commander_02
         │       │       │    → deliver → deliver_think → end_success
         │       │       └─ lose → end_failure
         │       └─ lose → end_failure
         └─ lose → end_failure
```

### ノード詳細（31ノード）

#### `start`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm
```text
大聖堂の地下礼拝堂。冷たい空気の中で、大司祭から頑丈な木箱を引き渡された。
```

#### `start_desc`（text）
**演出:** bg: bg_church
```text
中には祝福された銀の小瓶が、緩衝材の乾草と共にぎっしりと詰められている。
```

#### `intro_1`（text）
**演出:** bg: bg_church, speaker: 大司祭
```text
「最前線の砦において、戦死した兵士たちが歩き出しているという不吉な報告がありました」
```

#### `intro_1_detail`（text）
**演出:** bg: bg_church, speaker: 大司祭
```text
「この聖水は、失われた彼らの魂に安らかな眠りを与えるためのものです」
```

#### `intro_2`（text）
**演出:** bg: bg_church, speaker: 大司祭
```text
「道中は魔物が彷徨い非常に危険ですが、砦の守備隊の命が、ひいては王国の防衛がかかっています」
```

#### `intro_2_wish`（text）
**演出:** bg: bg_church, speaker: 大司祭
```text
「どうか、神の祝福が宿るこの聖水を、一本も欠かすことなく無事に前線まで届けてください」
```

#### `travel_start`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
木箱を頑丈な荷車に載せ、門兵の厳しい視線を浴びながら王都を出発した。
```

#### `travel_start_think`（text）
**演出:** bg: bg_road_day
```text
目的地までは片道二日の過酷な旅路。重い荷車を引く手に、自然と力がこもる。
```

#### `travel_mid`（text）
**演出:** bg: bg_road_day
```text
街道は荒れ果て、すれ違う者もいない。時折、風が嫌な臭いを運んできた。
```

#### `travel_scenery`（text）
**演出:** bg: bg_road_day
```text
立ち枯れた木々が並ぶ光景は、ここが戦場に近いことを無言で物語っている。
```

#### `camp`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_calm
```text
夜が訪れ、街道沿いの崩れた廃墟で野営をする。小さな焚き火が周囲の闇を静かに睨みつけていた。
```

#### `night_watch`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_tense
```text
不気味な静寂の中、ひとり見張りに立つ。闇の奥からカタカタと、骨が擦れ合うような不快な音が響く。
```

#### `encounter_wave1`（text）
**演出:** bg: bg_camp
```text
松明の火の中に、錆びた甲冑を纏った骸骨たちの白い姿が浮かび上がった！
```

#### `battle_wave1`（battle）
**演出:** bg: bg_camp, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `411` |
| 敵表示名 | 骸骨の群れ |

```text
荷車に群がろうとする骸骨の群れを迎え撃つ！ 聖水を死守せよ！
```

#### `after_wave1`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_calm
```text
骸骨を打ち砕き、骨の破片が泥に散らばる。木箱の封印は無事のようだ。
```

#### `deeper_night`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_tense
```text
だが一息つく間もなく、足元の湿った土が盛り上がり、何かが這い出るような音が周囲に響き渡る。
```

#### `encounter_wave2`（text）
**演出:** bg: bg_camp
```text
腐りかけた肉体を引きずりながら、ゾンビの群れがこちらへ手を伸ばしてくるっ…！
```

#### `battle_wave2`（battle）
**演出:** bg: bg_camp, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `412` |
| 敵表示名 | ゾンビの群れ |

```text
悪臭を放つ死体どもが、獲物を求めて一斉に襲いかかってきた！
```

#### `after_wave2`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_calm
```text
激しい死闘の末、二度目の襲撃も退けた。息が荒れ、疲労が全身を蝕む。
```

#### `after_wave2_think`（text）
**演出:** bg: bg_camp
```text
しかし、聖水の瓶はすべて無事だ。夜明けまであとわずか、気を抜けない。
```

#### `dawn_road`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
ようやく夜が明け、朝靄が立ち込める街道を急ぐ。その前方に、冷たい霧の壁が立ち塞がった。
```

#### `encounter_wave3`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
霧の奥から不気味な怨嗟の声が響く。骸骨とゾンビ、そして幽鬼が立ち塞がった！
```

#### `battle_wave3`（battle）
**演出:** bg: bg_road_day, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `413` |
| 敵表示名 | 混成亡者 |

```text
前線の瘴気が生み出した、強力な混成亡者どもとの最後の戦いだ！
```

#### `arrive_fort`（text）
**演出:** bg: bg_fort, bgm: bgm_quest_calm
```text
満身創痍で前線の砦に辿り着いた。周囲には重苦しい血の臭いが充満している。
```

#### `arrive_fort_desc`（text）
**演出:** bg: bg_fort
```text
木柵の奥では、多くの負傷兵が力なく地面に横たわり、うめいていた。
```

#### `meet_commander`（text）
**演出:** bg: bg_fort, speaker: 砦の守備隊長
```text
「おお、待ち望んでいた教会の支援物資か！ よくぞこの危険な道を届けてくれた、感謝する！」
```

#### `meet_commander_02`（text）
**演出:** bg: bg_fort, speaker: 砦の守備隊長
```text
「これだけの聖水があれば、戦死した仲間を敵に回さずに埋葬できる」
```

#### `deliver`（text）
**演出:** bg: bg_fort
```text
守備隊長に木箱を引き渡す。彼の強張っていた顔が、安堵に和らいだ。
```

#### `deliver_think`（text）
**演出:** bg: bg_fort
```text
兵士たちが早速聖水を受け取り、砦の守りを固めるために慌ただしく動き始める。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
任務完了。王都に戻り、受け取った報酬は前線で見た安堵の顔より重かった。
```
**rewards:** Gold:400, Order:10, Exp:120, Rep:5

#### `end_failure`（end_failure）
**演出:** bg: bg_camp
```text
亡者の群れに圧倒され、荷車を失った。聖水が土に吸い込まれていく……
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 411 | 骸骨の群れ |
| 412 | ゾンビの群れ |
| 413 | 混成亡者 |
