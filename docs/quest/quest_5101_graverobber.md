# クエスト仕様書：5101 — 墓荒らしの退治

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5101 |
| **Slug** | `qst_rep_graverobber` |
| **クエスト種別** | 特殊クエスト（Special） |
| **推奨レベル** | 5（Normal） |
| **難度** | 2 |
| **依頼主** | 聖堂騎士団 |
| **出現条件** | 第1話「始まりの轍」（6001）クリア / 滞在拠点: loc_roland / 名声 10 以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **経過日数 (time_cost)** | 3 |
| **ノード数** | 52ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 5） |
| **サムネイル画像** | `/images/quests/bg_crypt.png` |
---

## 1. クエスト概要

### 短文説明
```
[退治] 聖墓地を荒らす盗掘団を追い払え。遺品の返還も任務に含む。
```

### 長文説明
```
聖都の安息の地である聖墓地が、不届きな盗掘団によって荒らされているという。
眠れる騎士たちの副葬品が暴かれ、闇市で売買されている。
聖堂騎士団からの要請を受け、地下納骨堂に潜む盗掘団を排除し、
盗まれた遺品を回収せよ。死者の安らぎを守るのだ。
```

---

## 2. 報酬定義

**CSV記載形式（デフォルトルート）:**
```
Gold:500|Exp:80|Rep:3|Order:3
```

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント | 追加 |
|--------|------|-----|:---:|-------------|------|
| 遺品をすべて騎士団に返還（デフォルト） | 500 | 80 | +3 | Order:3 | — |
| 遺品の一部をくすねて質屋で換金 | 800 | 80 | -20 | Evil:3 | — |

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 2日 |

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
                         └─ travel_01
                             └─ travel_01_02
                                 └─ travel_02
                                     └─ travel_02_02
                                         └─ graveyard_01
                                             └─ graveyard_02
                                                 └─ choice_approach
                                                     ├─ 正面から → front_01
                                                     │              └─ front_01_02
                                                     │                  └─ battle_guard
                                                     │                       ├─ win → merge_inner
                                                     │                       └─ lose → end_failure_01
                                                     └─ 裏手から → back_01
                                                                    └─ back_01_02
                                                                        └─ back_random (random_branch 60%/40%)
                                                                             ├─ success → back_success
                                                                             │              └─ back_success_02
                                                                             │                   └─ merge_inner
                                                                             └─ failure → back_fail
                                                                                            └─ back_trap (hp_damage 10%)
                                                                                                 └─ back_trap_02
                                                                                                      └─ merge_inner
                                                                                                           └─ merge_inner_02
                                                                                                                └─ inner_01
                                                                                                                     └─ inner_01_02
                                                                                                                          └─ inner_02
                                                                                                                               └─ inner_02_02
                                                                                                                                    └─ boss_intro_01
                                                                                                                                         └─ boss_intro_02
                                                                                                                                              └─ boss_intro_02_02
                                                                                                                                                   └─ battle_boss
                                                                                                                                                        ├─ win → victory_01
                                                                                                                                                        │        └─ victory_01_02
                                                                                                                                                        │             └─ victory_02
                                                                                                                                                        │                  └─ victory_02_02
                                                                                                                                                        │                       └─ choice_fate
                                                                                                                                                        │                            ├─ 返還 → fate_order_01
                                                                                                                                                        │                            │         └─ fate_order_01_02
                                                                                                                                                        │                            │              └─ fate_order_02
                                                                                                                                                        │                            │                   └─ fate_order_02_02
                                                                                                                                                        │                            │                        └─ end_success_order
                                                                                                                                                        │                            └─ 横領 → fate_evil_01
                                                                                                                                                        │                                      └─ fate_evil_01_02
                                                                                                                                                        │                                           └─ fate_evil_02
                                                                                                                                                        │                                                └─ fate_evil_02_02
                                                                                                                                                        │                                                     └─ end_success_evil
                                                                                                                                                        └─ lose → end_failure_01
                                                                                                                                                                  └─ end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm, speaker: 聖堂騎士
```text
「冒険者よ、聖堂騎士団からの指名依頼だ。聖墓地が盗掘団に荒らされている」
```

#### `start_01_02`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm
```text
聖堂の厳かな空気の中に、騎士の重苦しいため息が静かに響いた。
```

#### `start_02`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm, speaker: 聖堂騎士
```text
「眠れる騎士たちの遺品が次々と盗まれ、闇市に流れている」
```

#### `start_02_02`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm
```text
（聖なる墓を暴き、死者の眠りを妨げるか。許しがたい暴挙だな）
```

#### `start_03`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm, speaker: 聖堂騎士
```text
「盗掘団を排除し、盗まれた遺品を回収してほしい」
```

#### `start_03_02`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm, speaker: 聖堂騎士
```text
「死者の尊厳を守るためだ。どうか手を貸してくれ」
```

#### `start_04`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm
```text
死者の安らぎを乱す不届き者か。墓地へ向かおう。
```

#### `travel_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
聖都郊外の丘を越えると、広大な聖墓地が見えてきた。
```

#### `travel_01_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
重く立ち込める雲の下、無数の白い墓標が静まり返っている。
```

#### `travel_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
墓地に近づくと、掘り返された墓穴がいくつも目に入る。ひどい有様だ。
```

#### `travel_02_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
（土がまだ新しい。奴らは今もこの墓地のどこかに潜んでいるはずだ）
```

#### `graveyard_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
盗掘団は地下納骨堂に拠点を構えているらしい。入り口は二つある。
```

#### `graveyard_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
正面の大扉か、裏手の崩れた壁の隙間か。どちらから入る？
```

#### `choice_approach`（choice）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「正面から堂々と乗り込む」 | `front_01` |
| 「裏手の崩れた壁から忍び込む」 | `back_01` |

#### `front_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
大扉を蹴り開けて突入する！ 中にいた見張りの盗掘者が武器を取った！
```

#### `front_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
薄暗い石造りの大廊下に、金属音がけたたましく響き渡る。
```

#### `battle_guard`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle
**パラメータ:** enemy_group_id: 101, next: `merge_inner`, fail: `end_failure_01`
| 敵グループ | 構成 |
|----------|------|
| `roland_undead_group` | スケルトン、ゾンビ |

#### `back_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
崩れた壁の隙間に身を滑り込ませる。暗く狭い通路が続いている……。
```

#### `back_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
（音を立てるな。闇に紛れて、奴らの背後を執るんだ）
```

#### `back_random`（random_branch）
**パラメータ:** prob: 60, next: `back_success`, fallback: `back_fail`

#### `back_success`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
誰にも見つからず、納骨堂の内部に潜入できた。奥から声が聞こえる。
```

#### `back_success_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
**次ノード:** merge_inner
```text
（どうやら気づかれずに済んだな。声のする方へ進もう）
```

#### `back_fail`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
足元の瓦礫を踏んでしまった！ 崩れた天井から石が降ってくる！
```

#### `back_trap`（hp_damage）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
落石で傷を負ったが、なんとか通路を抜けた。
```

#### `back_trap_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
**次ノード:** merge_inner
```text
（くそ、不覚を取った。だが騒ぎにはなっていないようだ）
```

#### `merge_inner`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
納骨堂の奥に進むと、松明の明かりに照らされた広間に出た。
```

#### `merge_inner_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
カビと埃の臭いに混じり、腐肉の不快な臭いが鼻をつく。
```

#### `inner_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
石棺がこじ開けられ、中の副葬品が乱雑に袋に詰め込まれている。
```

#### `inner_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
無残に暴かれた歴史の遺産が、薄汚れた布袋に詰め込まれている。
```

#### `inner_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
広間の奥に、仲間に指示を出している大柄な男がいる。頭目だ。
```

#### `inner_02_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
（あいつが頭目か。死者を冒涜した罪、その身で償ってもらう）
```

#### `boss_intro_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss, speaker: 盗掘団の頭目
```text
「なんだ、テメェは！ 騎士団の犬か！？」
```

#### `boss_intro_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss, speaker: 盗掘団の頭目
```text
「死人の持ち物に用はねえだろ！ ここは俺たちの縄張りだ！」
```

#### `boss_intro_02_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss
```text
頭目は抜身の大剣を担ぎ、獰猛な笑みを浮かべてこちらを睨みつけた。
```

#### `battle_boss`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9101, next: `victory_01`, fail: `end_failure_01`
| 敵グループ | 構成 |
|----------|------|
| `grp_boss_graverobber` | 盗掘団の頭目 |

#### `victory_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
頭目が呻き声を上げて倒れ伏すと、手下たちは一斉に逃げ出した。
```

#### `victory_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
静まり返った納骨堂に、自分の荒い呼吸の音だけが響いている。
```

#### `victory_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
盗まれた遺品の山を発見した。金銀の装飾品や古い勲章が大量にある。
```

#### `victory_02_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
（どれも歴史ある貴重な品だ。さて、これをどう処理するか……）
```

#### `choice_fate`（choice）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「すべて騎士団に返還する。それが正しい」 | `fate_order_01` |
| 「一部を懐に入れてから報告する」 | `fate_evil_01` |

#### `fate_order_01`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm
```text
遺品をすべて聖堂騎士団に引き渡した。
```

#### `fate_order_01_02`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm
```text
騎士団の聖堂へと運び込まれた遺品は、厳かに並べ直された。
```

#### `fate_order_02`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm, speaker: 聖堂騎士
```text
「見事だ。死者たちも安らかに眠れるだろう。感謝する」
```

#### `fate_order_02_02`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm
```text
騎士は深く頭を下げた。その顔には、安堵の表情が浮かんでいた。
```

#### `end_success_order`（end_success）
**演出:** bg: bg_church
```text
依頼達成。正しき行いは、確かな信頼となって返ってきた。
```
**rewards:** Gold:500, Exp:80, Rep:3, Order:3

#### `fate_evil_01`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_mystery
```text
金目のものをいくつか懐に忍ばせ、残りだけを騎士団に返却した。
```

#### `fate_evil_01_02`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_mystery
```text
（これくらいなら誰も気づくまい。死者にはもう不要なものだ）
```

#### `fate_evil_02`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_mystery
```text
裏路地の質屋で遺品を換金した。騎士団は気づいていないようだ。
```

#### `fate_evil_02_02`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_mystery
```text
手に入った金貨の重みが、懐で重く、しかし心地よく揺れる。
```

#### `end_success_evil`（end_success）
**演出:** bg: bg_slums
```text
依頼達成。死者の遺品で私腹を肥やした。罪悪感はいつか薄れるだろう。
```
**rewards:** Gold:800, Exp:80, Rep:-20, Evil:3

#### `end_failure_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
深手を負い、冷たい石床の上に力なく崩れ落ちた。意識が薄れていく。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_crypt
```text
目が覚めた時には、盗掘団の姿も、遺品もすべて消え去っていた。
```
**rewards:** Gold:0

---

## 4. 新規エネミー・アイテム定義参照

**使用エネミー（新規）:**
| ID | Slug | name | Lv | HP | ATK | DEF |
|-----|-----|-----|:--:|:--:|:---:|:---:|
| 6051 | `boss_graverobber_leader` | 盗掘団の頭目 | 7 | 180 | 25 | 6 |

**使用エネミーグループ:**
| ID | Slug | 構成エネミー | 用途 |
|-----|-----|-----|-----|
| 101 | `roland_undead_group` | `enemy_skeleton`, `enemy_zombie` | 道中見張り（既存） |
| 9101 | `grp_boss_graverobber` | `boss_graverobber_leader` | ボス戦（新規） |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
5101,qst_rep_graverobber,墓荒らしの退治,5,2,3,"{""completed_quest"":""main_ep01"",""min_reputation"":10,""nation_id"":""loc_roland""}",false,,,聖堂騎士団,[指名依頼] 聖墓地を荒らす盗掘団を追い払え。遺品の返還も任務に含む。
```

---

## 6. 実装チェックリスト

- [ ] 新規エネミー（boss_graverobber_leader）をCSVに登録
- [ ] 新規エネミーグループ（9101: grp_boss_graverobber）をCSVに登録
- [ ] 侵入方法の分岐（正面 vs 裏手）が正しく動作
- [ ] 裏手ルートのランダム判定（60%）とhp_damageの動作
- [ ] 最終選択肢（返還 vs 横領）のアライメントおよび報酬差異
- [ ] 全52ノードの遷移が正しいこと
- [ ] quests_special.csv への登録
