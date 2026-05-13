# クエスト仕様書：5103 — 山賊の関所破り

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5103 |
| **Slug** | `qst_rep_toll_bandit` |
| **クエスト種別** | 名声連動（Reputation Tier 1） |
| **推奨レベル** | 5 |
| **難度** | 2 |
| **依頼主** | 自警団 |
| **出現条件** | EP1（`main_ep01`）クリア済み, Rep≥10, nation_id: `loc_yatoshin` |
| **リピート** | 1世代1回 |
| **難易度Tier** | Tier 1 |
| **経過日数 (time_cost)** | 3（成功: 3日 / 失敗: 2日） |
| **ノード数** | 30ノード |
| **サムネイル画像** | `/images/quests/bg_yato_mountain.png` |

---

## 1. クエスト概要

### 短文説明
```
[討伐依頼] 山間の街道に不法な関所を設けた山賊を排除せよ。
```

### 長文説明
```
夜刀神国の山間部にある街道で、山賊が私的な関所を設け、
通行人から不当な通行料を巻き上げている。
払えない者は荷物を奪われ、抵抗すれば命すら危ない。
自警団は腕の立つ冒険者に、山賊の排除を依頼した。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:500|Exp:80|Rep:3`

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 役所へ突き出す（秩序ルート） | 500 | 80 | +5 | Order:3 |
| 見逃して上納金を受け取る（邪悪ルート） | 800 | 80 | -3 | Evil:3 |

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
 └─ start_02
     └─ start_03
         └─ start_04
             └─ travel_01
                 └─ travel_02
                     └─ road_01
                         └─ road_02
                             └─ choice_approach (第1の選択：関所への対処)
                                  ├─ 旅人を装って通る → disguise_01
                                  │                     └─ disguise_random (random_branch 50%)
                                  │                          ├─ 成功（騙す） → disguise_success
                                  │                          │                  └─ merge_hideout
                                  │                          └─ 失敗（バレる） → disguise_fail
                                  │                                               └─ disguise_trap (hp_damage 10%)
                                  │                                                    └─ merge_hideout
                                  └─ 正面から蹴散らす → assault_01
                                                        └─ battle_guard
                                                             ├─ win → merge_hideout
                                                             └─ lose → end_failure
                                                                  └─ merge_hideout (図示用)
                                                                       └─ hideout_01
                                                                            └─ hideout_02
                                                                                 └─ boss_intro_01
                                                                                      └─ boss_intro_02
                                                                                           └─ boss_intro_03
                                                                                                └─ battle_boss
                                                                                                     ├─ win → victory_01
                                                                                                     │        └─ victory_02
                                                                                                     │             └─ choice_fate
                                                                                                     │                  ├─ 突き出す → fate_order_01
                                                                                                     │                  │              └─ fate_order_02
                                                                                                     │                  │                   └─ end_success_order
                                                                                                     │                  └─ 見逃す → fate_evil_01
                                                                                                     │                              └─ fate_evil_02
                                                                                                     │                                   └─ end_success_evil
                                                                                                     └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 自警団の長
```text
「山道に山賊が勝手に関所を作りやがった。旅人から金を奪っている」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 自警団の長
```text
「払えない者は身ぐるみ剥がされる。抵抗した商人は半殺しにされた」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 自警団の長
```text
「俺たちでは手に負えん。腕利きの冒険者に頼むしかないんだ」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
山賊の関所か。街道の安全は冒険者にとっても死活問題だ。
```

#### `travel_01`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field
```text
夜刀神国の山間部へ向かう。木々が鬱蒼と茂り、視界は悪い。
```

#### `travel_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
山道を登っていくと、前方に粗末な柵と見張り台が見えてきた。あれが関所か。
```

#### `road_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
関所の前には通行人が数人、金を払わされて渋い顔をしている。
```

#### `road_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
見張りは3人。奥の小屋に頭目がいるはずだ。どうする？
```

#### `choice_approach`（choice）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「旅人を装って関所を通り、隙を突く」 | disguise_01 |
| 「正面から武器を構えて蹴散らす」 | assault_01 |

#### `disguise_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_mystery
```text
武器を隠し、ただの旅人のふりをして関所に近づく。「通してもらおうか」
```

#### `disguise_random`（random_branch）
**パラメータ:** prob: 50, next: `disguise_success`, fallback: `disguise_fail`

#### `disguise_success`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_mystery
**次ノード:** merge_hideout
```text
通行料を払うふりをして、見張りの懐に飛び込んで一撃で気絶させた！
```

#### `disguise_fail`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
「おい、こいつ隠し持ってるぞ！ 冒険者だ！」武器がバレた！
```

#### `disguise_trap`（hp_damage）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
**パラメータ:** percent: 10
**次ノード:** merge_hideout
```text
不意打ちの棍棒を食らったが、反撃して見張りを制圧した。
```

#### `assault_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
正面から抜刀し、山賊どもに斬りかかる！「関所遊びは終わりだ！」
```

#### `battle_guard`（battle）
**演出:** bg: bg_yato_mountain, bgm: bgm_battle
**パラメータ:** enemy_group_id: 433
```text
山賊の見張り（浪人3人）との戦闘！
```
*(注: 433はgrp_yato_ronin_wave — 浪人×3)*

#### `merge_hideout`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense
```text
関所を突破し、山道の奥にある山賊の小屋に到達した。
```

#### `hideout_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense
```text
小屋の中から大声が聞こえる。頭目は部下と酒を飲んでいるようだ。
```

#### `hideout_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense
```text
扉を蹴り開けて踏み込むと、酒瓶を持った大男と目が合った。
```

#### `boss_intro_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_battle_boss, speaker: 山賊の頭
```text
「なんだテメェ、俺の関所を壊しやがったのか！」
```

#### `boss_intro_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_battle_boss, speaker: 山賊の頭
```text
大男が酒瓶を叩き割り、巨大な斧を手に取って立ち上がった。
```

#### `boss_intro_03`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_battle_boss, speaker: 山賊の頭
```text
「俺の稼ぎを邪魔する奴は、山の肥やしにしてやるぜ！」
```

#### `battle_boss`（battle）
**演出:** bg: bg_yato_forest, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9103
```text
山賊の頭との決戦！
```

#### `victory_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
山賊の頭が倒れた。巻き上げた金貨の袋がいくつも転がっている。
```

#### `victory_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm, speaker: 山賊の頭
```text
「ま、待ってくれ！ この金は全部やる！ だから見逃してくれよ！」
```

#### `choice_fate`（choice）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「黙れ。縄で縛って代官所へ突き出す」 | fate_order_01 |
| 「……金を置いて消えろ。二度とこの道に来るな」 | fate_evil_01 |

#### `fate_order_01`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
山賊を縛り上げ、代官所に引き渡した。巻き上げた金も返却された。
```

#### `fate_order_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 自警団の長
```text
「ありがてえ！ これで商人たちも安心して街道を通れる」
```

#### `end_success_order`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。街道の秩序を取り戻し、旅人たちの安全を守った。
```
**rewards:** Gold:500, Exp:80, Rep:5, Order:3

#### `fate_evil_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_mystery
```text
山賊の頭は這いつくばりながら山の奥へ逃げていった。残された金袋を懐に入れる。
```

#### `fate_evil_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_mystery
```text
自警団には「討伐した」とだけ報告した。懐の金袋はずっしりと重い。
```

#### `end_success_evil`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。山賊は逃がしたが、金は手に入った。正義より実利を取る——それも生き方だ。
```
**rewards:** Gold:800, Exp:80, Rep:-3, Evil:3

#### `end_failure`（end_failure）
**演出:** bg: bg_yato_mountain
```text
山賊の斧が肩口に食い込んだ。「身ぐるみ剥いでやるぜ」という声を最後に意識が途絶えた。
```

---

## 4. 新規エネミー・アイテム定義参照

**使用エネミー（新規）:**
| ID | Slug | name | Lv | HP | ATK | DEF |
|-----|-----|-----|:--:|:--:|:---:|:---:|
| 6053 | `boss_toll_bandit` | 山賊の頭 | 7 | 190 | 27 | 5 |

**使用エネミーグループ:**
| ID | Slug | 構成エネミー | 用途 |
|-----|-----|-----|-----|
| 433 | `grp_yato_ronin_wave` | `enemy_yato_ronin` ×3 | 道中戦闘（既存） |
| 9103 | `grp_boss_toll_bandit` | `boss_toll_bandit` | ボス戦（新規） |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
5103,qst_rep_toll_bandit,山賊の関所破り,5,2,3,"{""completed_quest"":""main_ep01"",""min_reputation"":10,""nation_id"":""loc_yatoshin""}",false,,,自警団,[討伐依頼] 山間の街道に不法な関所を設けた山賊を排除せよ。
```

---

## 6. 実装チェックリスト

- [ ] 新規エネミー（boss_toll_bandit）をCSVに登録
- [ ] 新規エネミーグループ（9103: grp_boss_toll_bandit）をCSVに登録
- [ ] 侵入方法の分岐（変装 vs 正面突破）が正しく動作
- [ ] 変装ルートのランダム判定（50%）とhp_damageの動作
- [ ] 道中戦闘（battle_guard）の勝敗遷移が正しいこと
- [ ] 最終選択肢（突き出す vs 見逃す）のアライメントおよび報酬差異
- [ ] 全30ノードの遷移が正しいこと
- [ ] quests_special.csv への登録
