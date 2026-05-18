# クエスト仕様書：7031 — 隠密の密書傍受

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7031 |
| **Slug** | `qst_yat_ninja` |
| **クエスト種別** | 夜刀クエスト（Yato） |
| **推奨レベル** | 6（Normal） |
| **難度** | 2 |
| **依頼主** | 忍び衆 |
| **出現条件** | 制限なし / 出現拠点: loc_yatoshin |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 6） |
| **経過日数 (time_cost)** | 4（成功: 4日 / 失敗: 2日） |
| **ノード数** | 35ノード |
| **サムネイル画像** | `/images/quests/bg_yato_forest.png` |

---

## 1. クエスト概要

### 短文説明
```
[襲撃] 他国の間者を辻斬りのごとく排除し、密書を奪取して届けよ。
```

### 長文説明
```
夜刀神国の影で暗躍する「忍び衆」からの非公式な依頼だ。
他国の間者が、国の軍事機密を記した密書を持って北の関所へ向かっているという。
任務は単純明快。間者を奇襲して殺害し、密書を奪取すること。
ただし、密書の内容を決して見てはならない。知れば、お前も消されるからだ。
```

---

## 2. 報酬定義

**報酬 (CSV記載形式):**
```
Gold:550|Exp:120|Justice:10
```

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ start_04
             └─ start_05
                 └─ prep_01
                     └─ prep_02
                         └─ locate_01
                             └─ locate_02
                                 └─ locate_03
                                     └─ locate_04
                                         └─ ambush_01
                                             └─ ambush_02
                                                 └─ ambush_03
                                                     └─ ambush_04
                                                         └─ battle_spy
                                                              ├─ win → after_01
                                                              └─ lose → end_failure
after_01
 └─ after_02
     └─ after_03
         └─ after_04
             └─ after_05
                 └─ take_01
                     └─ take_02
                         └─ take_document (reward)
                             └─ return_01
                                 └─ return_02
                                     └─ return_03
                                         └─ deliver_document (check_delivery)
                                              ├─ next → end_success
                                              └─ fallback → end_failure_lost
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense, speaker: 忍び衆の使者
```text
「夜分に失礼する。腕の立つ冒険者に、非公式な『掃除』を頼みたい」
```

#### `start_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense, speaker: 忍び衆の使者
```text
「他国の間者が、我が国の軍事機密を記した密書を携え、北の関所へ向かっておる」
```

#### `start_03`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense
```text
顔を黒布で覆った使者は、感情の読めない冷たい瞳でこちらを見据え、言葉を続けた。
```

#### `start_04`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense, speaker: 忍び衆の使者
```text
「間者は腕利きの護衛を連れている。お主の任務は、奴らを奇襲し、密書を奪還することだ」
```

#### `start_05`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense, speaker: 忍び衆の使者
```text
「……ただし、密書の中身は決して見るな。もし封が切られていれば、お主の命はないと思え」
```

#### `prep_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_field_night
```text
使者は足音一つ立てずに闇へ溶けた。警告は冗談ではないだろう。命がけの裏稼業だ。
```

#### `prep_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_field_night
```text
北の関所へ至る道は一本のみ。先回りして伏兵を敷くため、獣道を縫って急ぎ北上する。
```

#### `locate_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_field_night
```text
関所手前、両脇を深い林に囲まれた細い山道。太い枝の上に身を潜め、獲物が通るのを待つ。
```

#### `locate_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_field_night
```text
月が雲に隠れ、足元の道すら見えなくなった頃、微かな落ち葉を踏む音が聞こえてきた。
```

#### `locate_03`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_field_night
```text
笠を目深に被った旅姿の男。そして、その前後を固める、異様に歩みの軽い二人の護衛。
```

#### `locate_04`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_field_night
```text
一般の行商人には見えない隙のない陣形。間違いない、奴らが標的の間者と護衛だ。
```

#### `ambush_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense
```text
息を殺し、刀の柄に手をかける。間者がちょうど真下を通り過ぎようとした瞬間――
```

#### `ambush_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense
```text
木の上から音もなく飛び降り、前衛の護衛の背後へと回り込んで刃を突き立てた。
```

#### `ambush_03`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense, speaker: 間者の護衛
```text
「何者だ！？ ええい、伏兵だ、出会えェッ！」
```

#### `ambush_04`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense
```text
奇襲は防がれた。護衛たちが素早く小太刀を抜き放ち、狂気じみた殺気で襲いかかってきた。
```

#### `battle_spy`（battle）
**演出:** bg: bg_yato_forest, bgm: bgm_battle
```text
他国の間者と抜け忍たちが立ちはだかる！
```
**パラメータ:** type: battle, enemy_group_id: 432, next: after_01, fail: end_failure

#### `after_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
凄惨な殺し合いの末、護衛の一人が喉を押さえて崩れ落ちた。もはや動く気配はない。
```

#### `after_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
残された間者も、絶望の表情を浮かべたまま血だまりの中に倒れ伏している。
```

#### `after_03`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
林の中に再び不気味な静寂が戻った。血の匂いが獣を引き寄せる前に、任務を完遂せねば。
```

#### `after_04`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
間者の死体にしゃがみ込み、その衣服を探る。帯の裏に、不自然な膨らみがあるのを見つけた。
```

#### `after_05`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
布を切り裂くと、厳重に蠟封された黒い巻物が転がり落ちてきた。これが例の密書だ。
```

#### `take_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
封印には見たこともない紋様が刻まれている。もし中を見れば、命はないという警告が脳裏をよぎる。
```

#### `take_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
好奇心を押し殺し、密書を丁寧に布に包んで自分の懐へとしまった。急いでこの場を離れよう。
```

#### `take_document`（reward）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
「封をされた密書」を手に入れた！
```
**パラメータ:** type: reward, item_id: `item_secret_document`, next: return_01

#### `return_01`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
夜が明ける前に町へ戻り、指定された裏路地の寂れた酒場へと足を運ぶ。
```

#### `return_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
客のいない薄暗い店内。奥の席で笠を被った男が、盃を傾けながらこちらを待っていた。
```

#### `return_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 忍び衆の連絡員
```text
「……ご苦労だった。獲物は仕留めたな。密書を渡してもらおうか」
```

#### `deliver_document`（check_delivery）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
黙って懐から密書を取り出し、連絡員の前に置く。男は封印が無事であるかを鋭い目つきで確認した。
```
**パラメータ:** type: check_delivery, item_id: `item_secret_document`, quantity: 1, next: end_success, fallback: end_failure_lost

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
「中身は見ておらんな？ ……よろしい。約束の報酬だ。我らは会わなかった、そうだな？」
重い金袋を受け取る。彼らが何を企んでいるのか、自分には関係のないことだ。
```
**rewards:** Gold:550, Exp:120, Justice:10

#### `end_failure_lost`（end_failure）
**演出:** bg: bg_guild, speaker: 忍び衆の連絡員
```text
「……密書がないだと？ あるいは封を切ったか。貴様、我らを愚弄するか！」
連絡員の目が細められ、背後の闇から複数の殺気が膨れ上がった。ここで生かしてはおかれない。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_yato_forest
```text
抜け忍たちの変幻自在な体術と暗器に翻弄され、冷たい刃を胸に受けた。
薄れゆく意識の中、間者たちが何事もなかったかのように関所へと消えていくのを見た……。
```

---

## 4. 新規エネミー・アイテム定義参照

**新規追加エネミー（`enemies.csv`）:**
| ID | Slug | name | level | hp | atk | def | exp | gold |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 1241 | `enemy_yato_ninja` | 抜け忍 | 12 | 100 | 45 | 5 | 50 | 80 |
| 1242 | `enemy_yato_spy` | 間者 | 10 | 120 | 30 | 10 | 80 | 150 |

**新規追加グループ（`enemy_groups.csv`）:**
| ID | Slug | 構成エネミー |
|-----|-----|-----|
| 432 | `grp_yato_ninja` | `enemy_yato_ninja`\|`enemy_yato_ninja`\|`enemy_yato_spy` |

**新規追加アイテム（`items.csv`）:**
| ID | Slug | Name | Type | Value | Description |
|-----|-----|-----|-----|-----|-----|
| 3020 | `item_secret_document` | 封をされた密書 | material | 0 | 決して中を見てはならないと念を押された黒い巻物。 |

---

## 5. CSVエントリ

`quests_normal.csv`
```csv
7031,qst_yat_ninja,隠密の密書傍受,6,2,4,loc_yatoshin,,,,,Gold:550|Exp:120|Justice:10,忍び衆,[襲撃] 他国の間者を辻斬りのごとく排除し、密書を奪取して届けよ。
```

---

## 6. 実装チェックリスト

- [x] 新規エネミーおよびグループ 432 がDBに登録済みであること
- [x] アイテム `item_secret_document` がDBに登録済みであること
- [x] `check_delivery` ノードが `item_secret_document` を消費し `end_success` へ遷移すること
- [x] （デバッグ用）未所持の場合は `fallback` で `end_failure_lost` へ遷移すること
