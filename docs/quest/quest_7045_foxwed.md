# クエスト仕様書：7045 — 妖狐の嫁入り

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7045 |
| **Slug** | `qst_har_foxwed` |
| **クエスト種別** | 華龍クエスト（Karyu） |
| **推奨レベル** | 9（Normal） |
| **難度** | 3 |
| **依頼主** | 村の長老 |
| **出現条件** | 制限なし / 出現拠点: loc_haryu |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 9） |
| **経過日数 (time_cost)** | 6（成功: 6日 / 失敗: 4日） |
| **ノード数** | 37ノード |
| **サムネイル画像** | `/images/quests/bg_karyu_village.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

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
 └─ start_02
     └─ start_03
         └─ start_04
             └─ road_01
                 └─ road_02
                     └─ road_03
                         └─ random_fog (random_branch: 50%/50%)
                             ├─ 成功 → road_04
                             │         └─ road_05
                             │              └─ bridge_01
                             └─ 失敗 → lost_01
                                        └─ lost_02
                                             └─ lost_trap (hp_damage 10%)
                                                  └─ lost_03
                                                       └─ bridge_01
                                                            └─ bridge_02
                                                                 └─ battle_01
                                                                      ├─ win → grove_01
                                                                      │        └─ grove_02
                                                                      │             └─ grove_03
                                                                      │                  └─ grove_04
                                                                      │                       └─ grove_05
                                                                      │                            └─ reunion_01
                                                                      │                                 └─ reunion_02
                                                                      │                                      └─ reunion_03
                                                                      │                                           └─ choice_fate
                                                                      │                                                ├─ 戦う → battle_02
                                                                      │                                                │         ├─ win → rescue_01
                                                                      │                                                │         │        └─ rescue_02
                                                                      │                                                │         │             └─ end_success
                                                                      │                                                │         └─ lose → end_failure
                                                                      │                                                └─ 見届ける → coexist_01
                                                                      │                                                              └─ coexist_02
                                                                      │                                                                   └─ coexist_03
                                                                      │                                                                        └─ end_success_chaos
                                                                      └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm, speaker: 長老
```text
「阿明が戻らん。あの子は村一番の薬師だというのに……」
```

#### `start_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm, speaker: 長老
```text
「三日前の夕暮れ、山道で花嫁行列と歩いておったのを見た者がおる」
```

#### `start_03`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm, speaker: 長老
```text
「花嫁行列はこの村の者ではない。あれは妖狐の嫁入り行列よ」
長老は声を落とした。
```

#### `start_04`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
青年を取り戻すには霧の深い山道を越え、妖狐の領域に踏み込まねばならない。準備を整えて出発した。
```

#### `road_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
山道に入ると、すぐに霧が濃くなった。足元に散る花弁は桃の花——季節外れだ。
```

#### `road_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
道の両脇に、赤い提灯が灯っている。風もないのに揺れている。
```

#### `road_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
提灯の火がちらちらと瞬き、道が二股に分かれた。どちらも同じに見える。妖狐の幻術か。
```

#### `random_fog`（random_branch）
**パラメータ:** prob: 50, next: `road_04`, fallback: `lost_01`
（50%の確率で正しい道を選ぶ）

#### `road_04`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
勘を頼りに左の道を選ぶ。霧が少し晴れ、澄んだ水音が聞こえてきた。正しい道だったようだ。
```

#### `road_05`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
**次ノード:** bridge_01
```text
提灯の列は途切れ、代わりに蛍のような淡い光が漂い始めた。狐火だ。
```

#### `lost_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
右の道を選んだが、いつの間にか同じ場所に戻っている。幻術に嵌まった！
```

#### `lost_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
焦って藪を突き進むと、足元に光る糸のようなものが張られていた。
```

#### `lost_trap`（hp_damage）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
妖力を帯びた糸に触れ、体に痺れが走った。毒ではないが、力が少し抜ける。
```

#### `lost_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
しばらく彷徨うと、ようやく水音が聞こえてきた。幻術が解けたのか、小川の橋が見える。
```

#### `bridge_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
朱塗りの太鼓橋。欄干には狐の彫刻が施されている。橋を渡れば妖狐の領域だ。
```

#### `bridge_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
橋の向こうから、人影——いや、狐の影が現れた。番をしている妖狐だ。通すつもりはないらしい。
```

#### `battle_01`（battle）
**演出:** bg: bg_karyu_mountain, bgm: bgm_battle
**パラメータ:** enemy_group_id: 452
| 敵グループ | 構成 |
|----------|------|
| `grp_karyu_fox_guard` | 妖狐 × 2 |

#### `grove_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
橋を渡ると、景色が一変した。月明かりの下、桃の花が満開に咲き誇る幻想的な林。
```

#### `grove_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
花びらが舞い散る中に、提灯を持った小狐たちが行儀よく並んでいる。こちらを見つめている。
```

#### `grove_03`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
小狐たちの列の先に、輝くような白い衣の女性が立っていた。花嫁衣裳を纏っている。
```

#### `grove_04`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
女性がこちらを振り返ると、耳が——尖っていた。金色の瞳。妖狐の姫だ。
```

#### `grove_05`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery, speaker: 妖狐の姫
```text
「人の子。何をしに来た。これは我らの祝いの儀。邪魔をするでないぞ」
```

#### `reunion_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm, speaker: 阿明
```text
「あ……冒険者殿？ なぜここに」
妖狐の姫の隣に、薬師の青年・阿明が立っていた。
```

#### `reunion_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm, speaker: 阿明
```text
「僕は無理やり連れて来られたわけじゃない。彼女は……昔、僕が山で助けた狐なんだ」
```

#### `reunion_03`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm, speaker: 妖狐の姫
```text
「幼き日に毒蛇に噛まれた我を、この者が薬で救った。恩を返したいのだ」
姫は穏やかに微笑んだ。
```

#### `choice_fate`（choice）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「人は人の世で暮らすべきだ。青年を返してもらう」 | battle_02 |
| 「二人の意思を尊重する。村には事情を伝えよう」 | coexist_01 |

#### `battle_02`（battle）
**演出:** bg: bg_forest_night, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 453
| 敵グループ | 構成 |
|----------|------|
| `grp_karyu_fox_bride` | 妖狐の姫 × 1 |

#### `rescue_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
```text
姫が膝をつく。「……そうか。やはり人と妖は交われぬか」
涙が頬を伝い、桃の花弁に変わって散った。
```

#### `rescue_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
青年を連れて山を下りた。阿明は何度も振り返ったが、もう狐火は見えなかった。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
長老に青年を引き渡した。「よくぞ連れ戻してくれた。村の宝だ」
だが阿明の目に浮かぶのは、安堵ではなく喪失だった。
```
**rewards:** Gold:400, Exp:120, Rep:5, Justice:5

#### `coexist_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm, speaker: 妖狐の姫
```text
「人の子よ……そなたの寛容、忘れぬ。これを持っていくがよい」
姫は懐から青白く光る護符を差し出した。
```

#### `coexist_02`（reward）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
**パラメータ:** item_id: `item_foxfire_charm`
```text
狐火の護符を受け取った。温かい、不思議な光を放っている。
```

#### `coexist_03`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
村に戻り、長老に事情を話した。「妖狐と……ふむ、この世は広いのう」
長老は複雑な顔をしたが、最後には頷いた。
```

#### `end_success_chaos`（end_success）
**演出:** bg: bg_guild
```text
阿明は時折山に薬を届けに行くようになった。人と妖の間に、静かな絆が紡がれている。
人の定めた境を越えることは——罪か、それとも新しい可能性か。
```
**rewards:** Gold:350, Exp:120, Rep:-5, Chaos:5

#### `end_failure`（end_failure）
**演出:** bg: bg_karyu_mountain
```text
妖狐の幻術に翻弄され、気がつけば山のふもとに放り出されていた。
あの桃の林は幻だったのか。だが腕に残る引っ掻き傷だけが、現実だったことを告げている。
```

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
