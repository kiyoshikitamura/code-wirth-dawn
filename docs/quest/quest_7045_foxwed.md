# クエスト仕様書：7045 — 妖狐の嫁入り

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7045 |
| **Slug** | `qst_har_foxwed` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 9（Hard） |
| **難度** | 3 |
| **依頼主** | 村の長老 |
| **出現条件** | 出現国: 華龍国 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 6 |
| **ノード数** | 63ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 9） |
| **サムネイル画像** | `/images/quests/bg_karyu_village.png` |
---

## 1. クエスト概要

### 短文説明
```
[救出] 妖狐に攫われた青年を救い出すか、人と妖の共存を模索せよ。
```

### 長文説明
```
華龍国の山間の小村で、若い薬師の青年が行方不明になった。
最後に目撃されたのは、山道で美しい花嫁行列と並んで歩く姿。
長老は「あれは妖狐の嫁入りだ」と青ざめる。
青年が連れ去られたのか、自ら望んだのか——真相は霧の山の奥にある。
```

---

## 2. 報酬定義

**CSV記載形式（デフォルトルート）:**
```
Gold:400|Exp:120|Rep:5|Justice:5
```

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント | 追加 |
|--------|------|-----|:---:|-------------|------|
| 妖狐と戦い青年を救出（デフォルト） | 400 | 120 | +5 | Justice:5 | — |
| 妖狐の願いを聞き共存を選ぶ（選択肢） | 350 | 120 | -5 | Chaos:5 | Item: 狐火の護符 |

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 4日 |

---

## 3. シナリオノードフロー

```text
start
 └─ start_01_02
     └─ start_02
         └─ start_02_02
             └─ start_03
                 └─ start_03_02
                     └─ start_04
                         └─ start_04_02
                             └─ start_05
                                 └─ road_01
                                     └─ road_01_02
                                         └─ road_02
                                             └─ road_02_02
                                                 └─ road_03
                                                     └─ road_03_02
                                                         └─ random_fog (random_branch: 50%/50%)
                                                             ├─ 成功 → road_04
                                                             │         └─ road_04_02
                                                             │             └─ road_05
                                                             │                 └─ road_05_02
                                                             │                     └─ road_06
                                                             │                         └─ bridge_01
                                                             └─ 失敗 → lost_01
                                                                        └─ lost_01_02
                                                                            └─ lost_02
                                                                                └─ lost_trap (hp_damage 10%)
                                                                                     └─ lost_03
                                                                                         └─ lost_03_02
                                                                                             └─ bridge_01
                                                                                                 └─ bridge_01_02
                                                                                                     └─ bridge_02
                                                                                                         └─ bridge_02_02
                                                                                                             └─ battle_01
                                                                                                                  ├─ win → grove_01
                                                                                                                  │        └─ grove_01_02
                                                                                                                  │             └─ grove_02
                                                                                                                  │                  └─ grove_02_02
                                                                                                                  │                      └─ grove_03
                                                                                                                  │                          └─ grove_03_02
                                                                                                                  │                              └─ grove_04
                                                                                                                  │                                  └─ grove_05
                                                                                                                  │                                      └─ reunion_01
                                                                                                                  │                                          └─ reunion_01_02
                                                                                                                  │                                              └─ reunion_02
                                                                                                                  │                                                  └─ reunion_02_02
                                                                                                                  │                                                      └─ reunion_03
                                                                                                                  │                                                          └─ reunion_03_02
                                                                                                                  │                                                              └─ choice_fate
                                                                                                                  │                                                                   ├─ 戦う → battle_02
                                                                                                                  │                                                                   │         ├─ win → rescue_01
                                                                                                                  │                                                                   │         │        └─ rescue_01_02
                                                                                                                  │                                                                   │         │             └─ rescue_02
                                                                                                                  │                                                                   │         │                  └─ rescue_02_02
                                                                                                                  │                                                                   │         │                      └─ end_success_01
                                                                                                                  │                                                                   │         │                          └─ end_success
                                                                                                                  │                                                                   │         └─ lose → end_failure_01
                                                                                                                  │                                                                   │                   └─ end_failure
                                                                                                                  │                                                                   └─ 見届ける → coexist_01
                                                                                                                  │                                                                                 └─ coexist_02
                                                                                                                  │                                                                                      └─ coexist_02_02
                                                                                                                  │                                                                                           └─ coexist_03
                                                                                                                  │                                                                                                └─ coexist_03_02
                                                                                                                  │                                                                                                    └─ end_success_chaos_01
                                                                                                                  │                                                                                                        └─ end_success_chaos
                                                                                                                  └─ lose → end_failure_01
                                                                                                                            └─ end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm, speaker: 長老
```text
「阿明が戻らん。あの子は村一番の薬師だというのに……」
```

#### `start_01_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
村の広場は、静まり返っている。薬師のいなくなった村の空気は、どこか冷たい。
```

#### `start_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm, speaker: 長老
```text
「三日前の夕暮れ、山道で花嫁行列と歩いておったのを見た者がおる」
```

#### `start_02_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
（花嫁行列？ この山奥の村で、こんな時期に婚礼など聞いたこともないが）
```

#### `start_03`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm, speaker: 長老
```text
「花嫁行列はこの村の者ではない。あれは妖狐の嫁入り行列よ」
```

#### `start_03_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
長老は声を潜め、震える手で山の山頂を指さした。周囲の者たちも青ざめている。
```

#### `start_04`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
青年を取り戻すには、妖異が支配する霧深き山道へ踏み込まねばならない。
```

#### `start_04_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
（妖狐の嫁入りか。ただの迷信とは思えない。念のため、銀の武器を磨いておくか）
```

#### `start_05`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
覚悟を決め、背嚢を背負う。冷たい小雨が降り始める中、山道へと足を踏み入れた。
```

#### `road_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
山道に入ると、たちまち濃い霧が立ち込めてきた。視界は数歩先すらおぼつかない。
```

#### `road_01_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
ふと足元を見ると、季節外れの桃の花びらが、湿った土の上に散らばっている。
```

#### `road_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
霧の奥から、ぼんやりと赤い光が浮かび上がる。道沿いに並ぶ古びた提灯だ。
```

#### `road_02_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
（風もないのに、炎が生き物のように揺らめいている……歓迎されていないな）
```

#### `road_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
提灯の火が不規則に瞬き、行く手が二股に分かれた。どちらも暗い霧に消えている。
```

#### `road_03_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
（妖狐の術か。立ち止まれば幻惑される。直感を信じて進むしかない）
```

#### `random_fog`（random_branch）
**パラメータ:** prob: 50, next: `road_04`, fallback: `lost_01`
（50%の確率で正しい道を選ぶ）

#### `road_04`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
意を決して左 of 細道を選ぶ。不意に霧が薄れ、せせらぎの音が聞こえてきた。
```

#### `road_04_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
（どうやら正しい道を選べたようだ。だが、この空気の重さは何だ？）
```

#### `road_05`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
提灯の列は途切れ、周囲には蛍のような淡い光が漂い始めた。妖しき狐火だ。
```

#### `road_05_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
（狐火が道を案内しているかのようだな。それとも、罠へ誘い込んでいるのか？）
```

#### `road_06`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
**次ノード:** bridge_01
```text
光に導かれるように歩みを進めると、谷間に架かる一本の太鼓橋が見えてきた。
```

#### `lost_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
右の道を進んだが、いつの間にか元の分岐点へと戻っていた。完全に迷ったのだ。
```

#### `lost_01_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
（くそ、幻術に足元をすくわれたか。焦るな、周囲の気配をよく探るんだ）
```

#### `lost_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
霧の中に踏み出すと、足元に銀色に光る細い糸が、蜘蛛の巣のように張られていた。
```

#### `lost_trap`（hp_damage）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
妖力を帯びた糸が肌に触れた瞬間、激しい痺れが走り、体力が削られていく。
```

#### `lost_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
痺れる足を引きずりながら、必死に霧の中を走る。ようやく水音が聞こえてきた。
```

#### `lost_03_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
**次ノード:** bridge_01
```text
這い出た先には、小川を跨ぐ古びた橋があった。何とか幻術の領域を脱したようだ。
```

#### `bridge_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
朱塗りの太鼓橋が、闇の中に浮かび上がっている。欄干には狐の彫刻が刻まれている。
```

#### `bridge_01_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
（この橋の向こうが、奴らの隠れ里……。引き返すなら、今のうちだが）
```

#### `bridge_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
橋を渡ろうとした瞬間、対岸から素早い獣の影——二頭の妖狐が姿を現した。
```

#### `bridge_02_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
狐たちは鋭い牙を剥き出し、低く唸り声を上げる。通す気は微塵もないようだ。
```

#### `battle_01`（battle）
**演出:** bg: bg_karyu_mountain, bgm: bgm_battle
**パラメータ:** enemy_group_id: 452, next: `grove_01`, fail: `end_failure_01`
| 敵グループ | 構成 |
|----------|------|
| `grp_karyu_fox_guard` | 妖狐 × 2 |

#### `grove_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
妖狐たちを退け、橋を渡りきる。と、目の前に信じがたい光景が広がった。
```

#### `grove_01_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
そこは、満月の光を浴びて、桃の花が満開に咲き乱れる静寂の林だった。
```

#### `grove_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
花びらが雪のように舞い散る中、小さな狐たちが、行儀よく一列に並んでいる。
```

#### `grove_02_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
小狐たちは皆、小さな赤い提灯を掲げ、じっとこちらを見つめている。
```

#### `grove_03`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
その奇妙な行列の突き当たりに、ひときわ白く輝く衣を纏った女性が立っていた。
```

#### `grove_03_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
（あれが花嫁……いや、頭部から生える白い耳、そして怪しく光る金色の瞳）
```

#### `grove_04`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
彼女こそが、この山を統べる妖狐の姫だった。凛とした佇まいでこちらを見据える。
```

#### `grove_05`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery, speaker: 妖狐の姫
```text
「人の子よ、何用だ。これは我らの祝いの儀。無用な立ち入りは許さぬ」
```

#### `reunion_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm, speaker: 阿明
```text
「あ……冒険者さん！？ なぜ、こんな危険な場所にまで……！」
```

#### `reunion_01_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
```text
姫の傍らに、行方不明になっていた阿明が立っていた。傷を負った様子はない。
```

#### `reunion_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm, speaker: 阿明
```text
「僕は無理やり連れ去られたわけじゃない。彼女は昔、僕が救った狐なんだ」
```

#### `reunion_02_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
```text
（助けた狐が恩返しに？ 昔話のようなことが、本当に起きているというのか）
```

#### `reunion_03`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm, speaker: 妖狐の姫
```text
「この者は私の命の恩人。その優しさに惹かれ、共に生きると誓い合ったのだ」
```

#### `reunion_03_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
```text
姫は阿明の手を優しく取り、微笑んだ。その表情には、確かな慈愛が宿っていた。
```

#### `choice_fate`（choice）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「人は人の世で暮らすべきだ。青年を返してもらう」 | `battle_02` |
| 「二人の意思を尊重する。村には事情を伝えよう」 | `coexist_01` |

#### `battle_02`（battle）
**演出:** bg: bg_forest_night, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 453, next: `rescue_01`, fail: `end_failure_01`
| 敵グループ | 構成 |
|----------|------|
| `grp_karyu_fox_bride` | 妖狐の姫 × 1 |

#### `rescue_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
```text
激闘の末、姫が膝をつく。「……やはり、人と妖が相容れることは叶わぬか」
```

#### `rescue_01_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
```text
姫の目からこぼれ落ちた涙は、桃の花びらとなって風に溶けて消えていった。
```

#### `rescue_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
うつむく阿明の手を引き、山を下りる。二度と振り返ろうとはしなかった。
```

#### `rescue_02_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
背後を振り返ると、満開だった桃の林は消え去り、ただの枯れ木が立っていた。
```

#### `end_success_01`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
村へ戻り、長老に阿明を引き渡す。長老は涙を流して感謝の言葉を繰り返した。
```

#### `end_success`（end_success）
**演出:** bg: bg_karyu_village
```text
だが、阿明の虚ろな瞳が物語っていた。彼が本当に心を残してきた場所を。
```
**rewards:** Gold:400, Exp:120, Rep:5, Justice:5

#### `coexist_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm, speaker: 妖狐の姫
```text
「人の子よ……その寛大さに感謝する。この護符を旅の守りとせよ」
```

#### `coexist_02`（reward）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
**パラメータ:** item_id: `item_foxfire_charm`, next: `coexist_02_02`
```text
姫から青白く輝く「狐火の護符」を手渡された。ほんのりと温かい。
```

#### `coexist_02_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
```text
二人の姿は霧の中に消えていった。だが、その背中は幸福に満ちていた。
```

#### `coexist_03`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
村に戻り、長老に事情を伝える。長老は驚いたが、深くため息をついて頷いた。
```

#### `coexist_03_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm, speaker: 長老
```text
「そうか……阿明が選んだ道なら、引き留めることはできまいな」
```

#### `end_success_chaos_01`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
阿明は時折、村の薬草置き場に珍しい薬草を届けてくれるようになったという。
```

#### `end_success_chaos`（end_success）
**演出:** bg: bg_karyu_village
```text
人と妖が共に歩む道。それが過ちか、あるいは新たな夜明けか、誰にも分からぬ。
```
**rewards:** Gold:350, Exp:120, Rep:-5, Chaos:5

#### `end_failure_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
妖狐たちの放つ強烈な妖気に呑まれ、意識は深い闇の中へと引きずり込まれた。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_karyu_mountain
```text
気づけば山麓に倒れていた。腕の引っ掻き傷だけが、あの奇妙な夢の証だった。
```
**rewards:** Gold:0

---

## 4. 新規エネミー・アイテム定義参照

**エネミー（`enemies.csv`）:**
| ID | Slug | name | level | hp | atk | def | exp | gold |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| （既存） | `enemy_karyu_fox` | 妖狐 | 15 | 140 | 50 | 5 | 75 | 130 |
| 1271 | `enemy_karyu_fox_bride` | 妖狐の姫 | 16 | 280 | 55 | 10 | 120 | 200 |

**新規追加グループ（`enemy_groups.csv`）:**
| ID | Slug | 構成エネミー |
|-----|-----|-----|
| 452 | `grp_karyu_fox_guard` | `enemy_karyu_fox`\|`enemy_karyu_fox` |
| 453 | `grp_karyu_fox_bride` | `enemy_karyu_fox_bride` |

**新規アイテム（`items.csv`）:**
| ID | Slug | name | 種類 | 効果 |
|-----|-----|-----|-----|-----|
| （要採番） | `item_foxfire_charm` | 狐火の護符 | アクセサリ | 装備時、回避率小UP / フレーバー：妖狐の姫が贈った温かな光を宿す護符 |

---

## 5. CSVエントリ

`quests_normal.csv`
```csv
7045,qst_har_foxwed,妖狐の嫁入り,9,3,6,loc_haryu,,,,,Gold:400|Exp:120|Rep:5|Justice:5,村の長老,[救出] 妖狐に攫われた青年を救い出すか、人と妖の共存を模索せよ。
```

---

## 6. 実装チェックリスト

- [ ] 新規エネミー `enemy_karyu_fox_bride`（ID: 1271）がDBに登録済み
- [ ] エネミーグループ 452, 453 がDBに登録済み
- [ ] 新規アイテム `item_foxfire_charm` がDBに登録済み
- [ ] random_branch（幻術の霧: 50%/50%）が正常動作
- [ ] hp_damage（幻術の糸: 10%）が正常動作
- [ ] reward ノードで `item_foxfire_charm` が正しく付与
- [ ] 選択肢「戦う」→ Justice:5 / 「見届ける」→ Chaos:5+Item が正しく分岐
- [ ] time_cost: 6（成功6日 / 失敗4日）
- [ ] 報酬が正しく付与される

---

## 7. 拡張メモ

- 妖狐の姫は後続の伝説級クエスト（6108: 神域の幻獣・麒麟）で再登場する可能性
- 狐火の護符は華龍固有の装備として、他の華龍クエストとの連携を検討
- 阿明は将来的に雇用可能NPC化する候補
