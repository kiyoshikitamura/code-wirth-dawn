# クエスト仕様書：6006 — 第6話「密林の逃亡」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6006 |
| **Slug** | `main_ep06` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 6（Normal） |
| **難度** | 1 |
| **依頼主** | 王国軍 |
| **出現条件** | 第5話「大義という名の虚妄」（6005）クリア / 滞在拠点: 最果ての村 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 35ノード |
| **ゲストNPC** | なし |
| **特記** | 分岐あり（けもの道 / 川沿い） |
| **難易度Tier** | Normal（rec_level: 6） |
| **サムネイル画像** | `/images/quests/bg_forest_day.png` |
---

## 1. クエスト概要

### 短文説明
```
国境警備任務。正体不明の武装集団との遭遇。
```

### 長文説明
```
ガウェインの犠牲によって包囲を逃れたプレイヤー。
負傷した体を引きずり、王国軍の追撃をかわしながら夜刀神国との境界を目指す。
```

---

## 2. 報酬定義

```
Exp:150|Gold:200|Rep:5|Order:5
```

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ wound_01
             └─ wound_02
                 └─ flash_01
                     └─ flash_02
                         └─ pursuit_01
                             └─ pursuit_02
                                 └─ dogs_01
                                     └─ dogs_02
                                         └─ choice1
                                              ├─ 「険しいけもの道を進む」 → hard_01
                                              │                               └─ hard_trap (hp_damage)
                                              │                                    └─ hard_02
                                              │                                        └─ hard_03
                                              │                                            └─ hard_04
                                              │                                                └─ end_node
                                              └─ 「川沿いを急ぐ」 → river_01
                                                                    └─ river_02
                                                                        └─ ambush_01
                                                                            └─ ambush_02
                                                                                └─ taunt_01
                                                                                    └─ taunt_02
                                                                                        └─ battle
                                                                                             ├─ win → choice2
                                                                                             │          └─ 「撃退して逃走」 → dying_01
                                                                                             │                              └─ dying_01
                                                                                             │                                  └─ dying_02
                                                                                             │                                      └─ run_01
                                                                                             │                                          └─ run_02
                                                                                             │                                              └─ end_node
                                                                                             └─ lose → end_failure_01
                                                                                                          └─ end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_calm
```text
敗残兵の群れに紛れ、我々は東への逃走を続けていた。
```

#### `start_02`（text）
**演出:** bg: bg_forest_day
```text
鬱そうとした密林。ローランドと夜刀神国の国境を隔てる魔の森だ。
```

#### `start_03`（text）
**演出:** bg: bg_forest_day
```text
追っ手の警戒網をかいくぐり、なんとか国境域の深部へと到達する。
```

#### `wound_01`（text）
**演出:** bg: bg_forest_day
```text
切り裂かれた肩の傷が、熱を帯て激しく痛む。呼吸が荒くなる。
```

#### `wound_02`（text）
**演出:** bg: bg_forest_day
```text
だが、立ち止まることは許されない。ここで倒れるわけにはいかない。
```

#### `flash_01`（text）
**演出:** bg: bg_forest_day
```text
目を閉じると、あの凄絶な戦いと、ガウェインの最期の背中が脳裏をよぎる。
```

#### `flash_02`（text）
**演出:** bg: bg_forest_day
```text
「生き延びて、世界の果てを見届けろ」——その言葉が体を動かす。
```

#### `pursuit_01`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
```text
背後。遠くの茂みから、金属の擦れる音と犬の荒い鼻息が聞こえた。
```

#### `pursuit_02`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
```text
王国軍が放った軍用犬だ。こちらの血の臭いを追ってきているに違いない。
```

#### `dogs_01`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
```text
目前の獣道が左右に分かれている。どちらを選べば生き延びられるか。
```

#### `dogs_02`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
```text
険しい山道を行くか、それとも距離を稼げる平坦な川沿いを突っ走るか。
```

#### `choice1`（choice）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「険しいけもの道を進む」 | `hard_01` |
| 「川沿いを急ぐ」 | `river_01` |

#### `hard_01`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
```text
道なき道。鋭い棘を持つ茨が、容赦なく服を破り肌を切り裂く！
```

#### `hard_trap`（hp_damage）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
茨の森を進み、全身に手痛い裂傷を負った！
```

#### `hard_02`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_calm
```text
激しい痛みに耐えながら、高低差のある岩場をよじ登り、追っ手を撒く。
```

#### `hard_03`（text）
**演出:** bg: bg_forest_day
```text
軍用犬の吠え声が遠ざかっていく。地形を利用した隠密が功を奏した。
```

#### `hard_04`（text）
**演出:** bg: bg_forest_day
**次ノード:** `end_node`
```text
ついに、遠方に夜刀神国の関所「黒金門」の巨大な影が見えてきた。
```

#### `river_01`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
```text
川の急流に沿って全力で疾走する。水しぶきが顔にかかり、視界を塞ぐ。
```

#### `river_02`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
```text
だが、前方から数人の甲冑兵が立ちふさがった。待ち伏せだ！
```

#### `ambush_01`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense, speaker: 王国軍兵士
```text
「いたぞ！ 反逆者の片割れだ！ 逃がすな、ここで仕留めろ！」
```

#### `ambush_02`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
```text
彼らの背後の森から、さらに無数の気配がこちらへ接近してくる！
```

#### `taunt_01`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense, speaker: 王国軍将校
```text
「後ろにもう三十人控えている。大人しく降伏しろ」
```

#### `taunt_02`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
```text
「断る！」死地を切り開くため、満身創痍の体で刃を構える！
```

#### `battle`（battle）
**演出:** bg: bg_forest_day, bgm: bgm_battle
**パラメータ:** enemy_group_id: 406, next: `choice2`, fail: `end_failure_01`

#### `choice2`（choice）
**演出:** bg: bg_forest_day, bgm: bgm_battle
| 選択肢 | next_node |
|---------|-----------|
| 「撃退して逃走」 | `dying_01` |

#### `dying_01`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_calm
```text
立ちふさがる追手を切り伏せた。だが、背後からは大部隊の足音が迫る。
```

#### `dying_02`（text）
**演出:** bg: bg_forest_day
```text
休む暇はない。傷口を押さえながら、遮二無二森の奥へと走り続ける。
```

#### `run_01`（text）
**演出:** bg: bg_forest_day
```text
激しい息遣いの中、木々の隙間からついに巨大な門のシルエットが覗く。
```

#### `run_02`（text）
**演出:** bg: bg_forest_day
**次ノード:** `end_node`
```text
夜刀神国の国境関所。あそこまで行けば、王国の追手も手を出せない。
```

#### `end_node`（end_success）
**演出:** bg: bg_forest_day
```text
関所の影に辿り着いた。生きている。ガウェイン、自分はまだ生きている。
```
**rewards:** Exp:150, Gold:200, Rep:5, Order:5

#### `end_failure_01`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
**次ノード:** `end_failure`
```text
怪我と疲労で体が動かず、追討部隊の刃をかわせない。その場に崩れ落ちた。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_forest_day
```text
夜刀の門を目の前にして、逃亡劇は終わった。老騎士の願いも潰えた。
```
**rewards:** Gold:0
