# クエスト仕様書：7014 — 貧民窟からの税徴収

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7014 |
| **Slug** | `qst_rol_tithe` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 4（Normal） |
| **難度** | 2 |
| **依頼主** | 教会 |
| **出現条件** | 出現国: ローランド聖王国 / 名声 -50 以下 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 1 |
| **ノード数** | 48ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 4） |
| **サムネイル画像** | `/images/quests/bg_slums.png` |
## 1. クエスト概要

### 短文説明
```
[徴収] 貧民窟の住民たちから十分の一税を取り立てる。見逃すか取り立てるかはあなた次第。
```

### 長文説明
```
教会からの裏の依頼。聖王国の教義で定められた「十分の一税」を、旧市街の貧民窟から強制的に徴収する。彼らに払う余裕などないことは明白だが、教会の権威を示すための見せしめとしての意味合いが強い。住民は4軒。それぞれの家を回り、税を回収せよ。見逃せば報酬は減り、取り立てれば抵抗される。良心と利益の間で揺れる依頼だ。
```

## 2. 報酬定義（バトル回数で4段階可変）

| バトル回数 | Gold | Rep | Order | Evil |
|-----------|------|-----|-------|------|
| 0回（全員見逃す） | 0 | 30 | 0 | 0 |
| 1回 | 50 | 10 | 5 | 3 |
| 2回 | 100 | -5 | 10 | 5 |
| 3回 | 150 | -10 | 15 | 8 |
| 4回（全員から取り立て） | 200 | -10 | 20 | 10 |

> 報酬はバトル（強制取り立て）回数で段階的に変動。全員見逃した場合は金貨0だが名声が大幅上昇、全員から取り立てた場合は報酬最大だが名声とEvilが悪化する。

## 2.5. 失敗ペナルティ（共通仕様）

| 条件 | ペナルティ |
|------|-----------|
| クエスト失敗（敗北/撤退/ギブアップ） | 名声 -3〜-10（ランダム、現在拠点） |
| バトル敗北（全般） | VIT -1（クエスト/ランダムエンカウント/賞金稼ぎ共通） |
| 経過日数 | クエスト定義の days_failure 値を適用 |

## 3. シナリオノード構成

### 全体フロー

```text
start → start_desc → intro_1 → intro_1_detail → intro_2 → intro_2_detail → arrive_slum
  → house_1 → plea_1 → choice_1
     ├─ 見逃す → mercy_1 → house_2_intro
     └─ 強制的に取り立てる → battle_1 → add_1 → extort_1 → house_2_intro
  → house_2 → plea_2 → choice_2
     ├─ 見逃す → mercy_2 → house_3_intro
     └─ 強制的に取り立てる → battle_2 → add_2 → extort_2 → house_3_intro
  → house_3 → plea_3 → choice_3
     ├─ 見逃す → mercy_3 → house_4_intro
     └─ 強制的に取り立てる → battle_3 → add_3 → extort_3 → house_4_intro
  → house_4 → plea_4 → choice_4
     ├─ 見逃す → mercy_4 → report_check
     └─ 強制的に取り立てる → battle_4 → add_4 → extort_4 → report_check
  → report_check
     ├─ success (0回) → report_0 → end_success_0
     └─ failure → report_check_4
           ├─ success (4回) → report_4 → end_success_4
           └─ failure → report_mid_check
                 ├─ success (1回) → report_mid_1 → end_success_1
                 └─ failure → report_mid_check_2
                       ├─ success (2回) → report_mid_2 → end_success_2
                       └─ failure (3回) → report_mid_3 → end_success_3
各バトル敗北 → end_failure
```

### ノード詳細（48ノード）

#### `start`（text）
**演出:** bg: bg_tavern_night, bgm: bgm_quest_calm
```text
酒場の裏口。教会の使いと名乗る男から、旧市街の住民リストが入った小袋を渡された。
```

#### `start_desc`（text）
**演出:** bg: bg_tavern_night
```text
小袋の中には、教区の印章が押された古い羊皮紙が入っていた。そこには４つの名前が記されている。
```
 
#### `intro_1`（text）
**演出:** bg: bg_tavern_night, speaker: 教会の使い
```text
「神聖なる税を払わぬゴミどもなど、聖王国の恩恵を受ける資格などありません」
```
 
#### `intro_1_detail`（text）
**演出:** bg: bg_tavern_night, speaker: 教会の使い
```text
「リストにある４軒の家から、十分の一税を回収してください」
```
 
#### `intro_2`（text）
**演出:** bg: bg_tavern_night, speaker: 教会の使い
```text
「払えぬのなら家財を売り払わせ、抵抗する愚か者からは力ずくで奪えばいいのです」
```
 
#### `intro_2_detail`（text）
**演出:** bg: bg_tavern_night, speaker: 教会の使い
```text
「温情で見逃すのも自由ですが、その場合、あなたの報酬は減るだけですからね」
```

#### `arrive_slum`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
リストを手に貧民窟へ足を踏み入れる。すれ違う人々の目が警戒と敵意に満ちていた。
```

#### `house_1`（text）
**演出:** bg: bg_slums
```text
まず向かったのは、リストの最初にある家。半壊した長屋の木扉を叩くと、中から怯えた老夫婦が出てきた。
```

#### `plea_1`（text）
**演出:** bg: bg_slums, speaker: 貧民窟の老人
```text
「税の徴収……？ 昨日のパンを買う金すら、もう残っていないのです」
```

#### `choice_1`（choice）
**演出:** bg: bg_slums
```text
老人の服は継ぎ接ぎだらけ。部屋には売れるような物は何もない。どうする？
```
| 選択肢 | 次ノード |
|--------|---------|
| 見逃す | `mercy_1` |
| 強制的に取り立てる | `battle_1` |

#### `mercy_1`（text）
**演出:** bg: bg_slums
```text
老夫婦の家を後にした。背中から、小さな感謝の囁きが聞こえた気がした。
```
**次ノード:** `house_2_intro`

#### `battle_1`（battle）
**演出:** bg: bg_slums, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `404` |
| 敵表示名 | 怒れる住民 |

```text
老人を脅すと、周囲の住民たちが農具を手にして一斉に集まってきた！
```

#### `add_1`（modify_flag）
**パラメータ:** key: `extort_count`, delta: 1
**次ノード:** `extort_1`

#### `extort_1`（text）
**演出:** bg: bg_slums
```text
抵抗を力でねじ伏せ、銅貨を搾り取った。老人のすすり泣きが耳に残る。
```
**次ノード:** `house_2_intro`

#### `house_2_intro`（text）
**演出:** bg: bg_slums
```text
二軒目の家へ向かう。路地の住民たちが、こちらを遠巻きに睨みつけている。
```

#### `house_2`（text）
**演出:** bg: bg_slums
```text
次の対象は、幼い子供を抱えた若い母親。痩せ細った顔に深い隈が刻まれていた。
```

#### `plea_2`（text）
**演出:** bg: bg_slums, speaker: 若い母親
```text
「お願いです、子供たちだけは……。もう奪うものは何もないのです」
```

#### `choice_2`（choice）
**演出:** bg: bg_slums
```text
子供たちが怯えた目でこちらを見上げている。どうする？
```
| 選択肢 | 次ノード |
|--------|---------|
| 見逃す | `mercy_2` |
| 強制的に取り立てる | `battle_2` |

#### `mercy_2`（text）
**演出:** bg: bg_slums
```text
母親の家を後にした。子供の一人が、小さな手を振っているのが見えた。
```
**次ノード:** `house_3_intro`

#### `battle_2`（battle）
**演出:** bg: bg_slums, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `404` |
| 敵表示名 | 怒れる住民 |

```text
母親を庇おうと、隣人たちが武器を手に怒りの叫びを上げて立ちはだかった！
```

#### `add_2`（modify_flag）
**パラメータ:** key: `extort_count`, delta: 1
**次ノード:** `extort_2`

#### `extort_2`（text）
**演出:** bg: bg_slums
```text
泣き叫ぶ子供たちの前で、母親が隠していた最後の家財を力ずくで奪い取った。
```
**次ノード:** `house_3_intro`

#### `house_3_intro`（text）
**演出:** bg: bg_slums
```text
三軒目の家へ。住民たちの視線は明確な敵意へと変わり、足元に小石が投げつけられる。
```

#### `house_3`（text）
**演出:** bg: bg_slums
```text
対象は片足の老兵士。壁の松葉杖の横に、錆びついた古い剣が置かれていた。
```

#### `plea_3`（text）
**演出:** bg: bg_slums, speaker: 片足の老兵士
```text
「国のために片足を失ったのに、まだ奪うか。好きにするがいい」
```

#### `choice_3`（choice）
**演出:** bg: bg_slums
```text
老兵士は諦めたような暗い瞳で、こちらの出方を静かに待っている。どうする？
```
| 選択肢 | 次ノード |
|--------|---------|
| 見逃す | `mercy_3` |
| 強制的に取り立てる | `battle_3` |

#### `mercy_3`（text）
**演出:** bg: bg_slums
```text
老兵士の家を後にした。彼は何も言わず、ただ虚空を見つめ続けていた。
```
**次ノード:** `house_4_intro`

#### `battle_3`（battle）
**演出:** bg: bg_slums, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `404` |
| 敵表示名 | 怒れる住民 |

```text
老兵士を脅そうとした瞬間、彼の元戦友たちが武器を手に駆けつけてきた！
```

#### `add_3`（modify_flag）
**パラメータ:** key: `extort_count`, delta: 1
**次ノード:** `extort_3`

#### `extort_3`（text）
**演出:** bg: bg_slums
```text
かつて国のために戦った男の誇りを踏みにじり、なけなしの金を奪い取った。
```
**次ノード:** `house_4_intro`

#### `house_4_intro`（text）
**演出:** bg: bg_slums
```text
最後の一軒。もう誰もこちらを見ようとせず、貧民窟は冷たい沈黙に包まれる。
```

#### `house_4`（text）
**演出:** bg: bg_slums
```text
最後の対象は、病床の少女を看病する老婆。室内には不快な薬草の臭いが漂う。
```

#### `plea_4`（text）
**演出:** bg: bg_slums, speaker: 看病する老婆
```text
「この子の薬代すら足りないのです。税を払えば、この子は死にます」
```

#### `choice_4`（choice）
**演出:** bg: bg_slums
```text
少女は荒い呼吸で苦しそうに眠っている。どうする？
```
| 選択肢 | 次ノード |
|--------|---------|
| 見逃す | `mercy_4` |
| 強制的に取り立てる | `battle_4` |

#### `mercy_4`（text）
**演出:** bg: bg_slums
```text
老婆の家を後にした。老婆は両手を合わせ、深々とこちらに頭を下げていた。
```
**次ノード:** `report_check`

#### `battle_4`（battle）
**演出:** bg: bg_slums, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `404` |
| 敵表示名 | 怒れる住民 |

```text
絶望した住民たちが、最後の怒りを爆発させて一斉に襲いかかってきた！
```

#### `add_4`（modify_flag）
**パラメータ:** key: `extort_count`, delta: 1
**次ノード:** `extort_4`

#### `extort_4`（text）
**演出:** bg: bg_slums
```text
少女の薬代すらも無慈悲に奪い取った。背後で激しい咳き込みが響く。
```
**次ノード:** `report_check`

#### `report_check`（check_flags）
**パラメータ:** key: `extort_count`, value: 0, operator: `==`
| 選択肢 | 次ノード |
|--------|---------|
| success | `report_0` |
| failure | `report_check_4` |

#### `report_check_4`（check_flags）
**パラメータ:** key: `extort_count`, value: 4, operator: `==`
| 選択肢 | 次ノード |
|--------|---------|
| success | `report_4` |
| failure | `report_mid_check` |

#### `report_mid_check`（check_flags）
**パラメータ:** key: `extort_count`, value: 1, operator: `==`
| 選択肢 | 次ノード |
|--------|---------|
| success | `report_mid_1` |
| failure | `report_mid_check_2` |

#### `report_mid_check_2`（check_flags）
**パラメータ:** key: `extort_count`, value: 2, operator: `==`
| 選択肢 | 次ノード |
|--------|---------|
| success | `report_mid_2` |
| failure | `report_mid_3` |

#### `report_0`（text）
**演出:** bg: bg_tavern_night, speaker: 教会の使い
```text
「回収できた金は一枚もないと？ フン、お優しい冒険者様だ。それでは分け前もありません、当然です。」
```

#### `end_success_0`（end_success）
**演出:** bg: bg_tavern_night
```text
金は手に入らなかったが、貧民窟の人々は守られた。これが私の選んだ道だ。
```
**rewards:** Gold:0, Rep:30

#### `report_mid_1`（text）
**演出:** bg: bg_tavern_night, speaker: 教会の使い
```text
「ふむ、回収できたのは一軒だけですか。温情ですか？ まあ、最低限の脅しにはなったでしょう」
```

#### `end_success_1`（end_success）
**演出:** bg: bg_tavern_night
```text
受け取ったわずかな分け前を懐に仕舞う。心には、言い知れぬ暗い澱みが残っていた。
```
**rewards:** Gold:50, Rep:10, Order:5, Evil:3

#### `report_mid_2`（text）
**演出:** bg: bg_tavern_night, speaker: 教会の使い
```text
「回収できたのは二軒ですか。ふむ、悪くはありませんが……次はもっと冷徹に仕事をしていただきたい」
```

#### `end_success_2`（end_success）
**演出:** bg: bg_tavern_night
```text
金袋の半分は軽いままだ。貧民窟の親子の泣き顔と、握りしめた硬貨の冷たさが脳裏をよぎる。
```
**rewards:** Gold:100, Rep:-5, Order:10, Evil:5

#### `report_mid_3`（text）
**演出:** bg: bg_tavern_night, speaker: 教会の使い
```text
「三軒から回収ですか。上出来です。これでゴミどもも、教会の権威を思い知ったことでしょう」
```

#### `end_success_3`（end_success）
**演出:** bg: bg_tavern_night
```text
ほぼ満額の分け前。だが手にした金貨には、老兵士や看病する老婆の血と汗が染み付いている。
```
**rewards:** Gold:150, Rep:-10, Order:15, Evil:8

#### `report_4`（text）
**演出:** bg: bg_tavern_night, speaker: 教会の使い
```text
「素晴らしい！ 四軒すべてから回収するとは。これこそ法と秩序の勝利、見事な働きです！」
```

#### `end_success_4`（end_success）
**演出:** bg: bg_tavern_night
```text
満額の金貨を受け取った。貧民窟の絶望の叫びなど、重い金袋の響きの前には無意味だった。
```
**rewards:** Gold:200, Rep:-10, Order:20, Evil:10

#### `end_failure`（end_failure）
**演出:** bg: bg_slums
```text
絶望した暴徒たちの暴力の前に倒れ伏す。泥水の中で意識は闇に消えた。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 404 | 怒れる住民 |
