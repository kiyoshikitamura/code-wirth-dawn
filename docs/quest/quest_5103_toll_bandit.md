# クエスト仕様書：5103 — 山賊の関所破り

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5103 |
| **Slug** | `qst_rep_toll_bandit` |
| **クエスト種別** | 特殊クエスト（Special） |
| **推奨レベル** | 5（Normal） |
| **難度** | 2 |
| **依頼主** | 自警団の長 |
| **出現条件** | 第1話「始まりの轍」（6001）クリア / 滞在拠点: 夜刀神国拠点 / 名声 10 以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **経過日数 (time_cost)** | 3 |
| **ノード数** | 51ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 5） |
| **サムネイル画像** | `/images/quests/bg_yato_mountain.png` |
---

## 1. クエスト概要

### 短文説明
```
[退治] 山間の街道に不法な関所を設けた山賊を排除せよ。
```

### 長文説明
```
夜刀神国の山間部を通る重要な街道に、山賊が勝手に関所を設け、
通行人や商人から無理やり金を徴収している。
払えない者は脅され、身ぐるみ剥がされる被害が出ている。
自警団からの要請を受け、山賊を排除し、街道の安全を取り戻せ。
```

---

## 2. 報酬定義

**CSV記載形式（デフォルトルート）:**
```
Gold:500|Exp:80|Rep:5|Order:3
```

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント | 追加 |
|--------|------|-----|:---:|-------------|------|
| 山賊を捕縛して代官所に突き出す（デフォルト） | 500 | 80 | +5 | Order:3 | — |
| 金を置いて山賊を見逃す（見逃し） | 800 | 80 | -20 | Evil:3 | — |

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
                                         └─ road_01
                                             └─ road_02
                                                 └─ choice_approach
                                                     ├─ 旅人を装う → disguise_01
                                                     │              └─ disguise_01_02
                                                     │                  └─ disguise_random (random_branch 50%/50%)
                                                     │                       ├─ success → disguise_success
                                                     │                       │              └─ disguise_success_02
                                                     │                       │                   └─ merge_hideout
                                                     │                       └─ failure → disguise_fail
                                                     │                                      └─ disguise_trap (hp_damage 10%)
                                                     │                                           └─ disguise_trap_02
                                                     │                                                └─ merge_hideout
                                                     └─ 正面突破 → assault_01
                                                                    └─ assault_01_02
                                                                        └─ battle_guard
                                                                             ├─ win → merge_hideout
                                                                             └─ lose → end_failure_01
                                                                                  └─ merge_hideout
                                                                                       └─ merge_hideout_02
                                                                                            └─ hideout_01
                                                                                                 └─ hideout_02
                                                                                                      └─ hideout_02_02
                                                                                                           └─ boss_intro_01
                                                                                                                └─ boss_intro_02
                                                                                                                     └─ boss_intro_03
                                                                                                                          └─ battle_boss
                                                                                                                               ├─ win → victory_01
                                                                                                                               │        └─ victory_01_02
                                                                                                                               │             └─ victory_02
                                                                                                                               │                  └─ victory_02_02
                                                                                                                               │                       └─ choice_fate
                                                                                                                               │                            ├─ 突き出す → fate_order_01
                                                                                                                               │                            │            └─ fate_order_01_02
                                                                                                                               │                            │                 └─ fate_order_02
                                                                                                                               │                            │                      └─ fate_order_02_02
                                                                                                                               │                            │                           └─ end_success_order
                                                                                                                               │                            └─ 見逃す → fate_evil_01
                                                                                                                               │                                         └─ fate_evil_01_02
                                                                                                                               │                                              └─ fate_evil_02
                                                                                                                               │                                                   └─ fate_evil_02_02
                                                                                                                               │                                                        └─ end_success_evil
                                                                                                                               └─ lose → end_failure_01
                                                                                                                                         └─ end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 自警団の長
```text
「山道に山賊が勝手に関所を作りやがった。旅人から金を奪っている」
```

#### `start_01_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
集会所の古びた机を、自警団の長が悔しげに拳で叩いた。
```

#### `start_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 自警団の長
```text
「払えない者は身ぐるみ剥がされる。抵抗した商人は半殺しにされた」
```

#### `start_02_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
（通行料と称した恐喝か。放置すれば街道が完全に死んでしまうな）
```

#### `start_03`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 自警団の長
```text
「俺たちでは手に負えん。腕利きの冒険者に頼むしかないんだ」
```

#### `start_03_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 自警団の長
```text
「どうか奴らを叩き出してくれ。街道の平和を戻してほしい」
```

#### `start_04`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
山賊の関所か。街道の安全は冒険者にとっても死活問題だ。
```

#### `travel_01`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field
```text
夜刀神国の山間部へ向かう。木々が鬱蒼と茂り、視界は悪い。
```

#### `travel_01_02`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field
```text
湿った風が笹の葉を揺らし、不気味なざわめきが山に満ちている。
```

#### `travel_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
山道を登っていくと、前方に粗末な柵と見張り台が見えてきた。あれが関所か。
```

#### `travel_02_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
（警戒はそれほど厳重ではないな。これなら奇襲も難しくはない）
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
| 「旅人を装って関所を通り、隙を突く」 | `disguise_01` |
| 「正面から武器を構えて蹴散らす」 | `assault_01` |

#### `disguise_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_mystery
```text
武器を隠し、ただの旅人のふりをしてのんびりと関所に近づく。
```

#### `disguise_01_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_mystery
```text
（通してもらおうか。用があるのは頭目だが、まずはこいつらだ）
```

#### `disguise_random`（random_branch）
**パラメータ:** prob: 50, next: `disguise_success`, fallback: `disguise_fail`

#### `disguise_success`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_mystery
```text
通行料を払うふりをして、見張りの懐に飛び込んで一撃で気絶させた！
```

#### `disguise_success_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_mystery
**次ノード:** `merge_hideout`
```text
（よし、静かに片付いたな。このまま奥の小屋へ向かおう）
```

#### `disguise_fail`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense, speaker: 山賊の見張り
```text
「おい、こいつ武器を隠し持ってやがる！ 冒険者の回し者だ！」
```

#### `disguise_trap`（hp_damage）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
不意打ちの棍棒を食らったが、反撃して見張りを制圧した。
```

#### `disguise_trap_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
**次ノード:** `merge_hideout`
```text
（チッ、見破られたか。だが囲まれる前に片付けられて幸いだ）
```

#### `assault_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
正面から抜刀し、大声を上げて山賊どもに斬りかかる！
```

#### `assault_01_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
（関所遊びは終わりだ！ お前たちのような悪党に払う金はない！）
```

#### `battle_guard`（battle）
**演出:** bg: bg_yato_mountain, bgm: bgm_battle
**パラメータ:** enemy_group_id: 433, next: `merge_hideout`, fail: `end_failure_01`
| 敵グループ | 構成 |
|----------|------|
| `grp_yato_ronin_wave` | 浪人 ×3 |

#### `merge_hideout`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense
```text
関所を突破し、山道の奥にある山賊の小屋に到達した。
```

#### `merge_hideout_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense
```text
小屋の周囲には、旅人から奪ったと思われる荷物が積まれている。
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

#### `hideout_02_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense
```text
（こいつが親玉か。酒の酔いなど一瞬で吹き飛ばしてやる）
```

#### `boss_intro_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_battle_boss, speaker: 山賊の頭
```text
「なんだテメェ、俺の関所を壊しやがったのか！」
```

#### `boss_intro_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_battle_boss
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
**パラメータ:** enemy_group_id: 9103, next: `victory_01`, fail: `end_failure_01`
| 敵グループ | 構成 |
|----------|------|
| `grp_boss_toll_bandit` | 山賊の頭 |

#### `victory_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
山賊の頭が倒れた。巻き上げた金貨の袋がいくつも転がっている。
```

#### `victory_01_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
頭目は地面に這いつくばり、青ざめた顔でこちらを見上げている。
```

#### `victory_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm, speaker: 山賊の頭
```text
「ま、待ってくれ！ この金は全部やる！ だから見逃してくれよ！」
```

#### `victory_02_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
（命乞いをするか。悪党の言い訳など、耳を傾ける価値もないが）
```

#### `choice_fate`（choice）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「黙れ。縄で縛って代官所へ突き出す」 | `fate_order_01` |
| 「……金を置いて消えろ。二度とこの道に来るな」 | `fate_evil_01` |

#### `fate_order_01`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
山賊を縛り上げ、代官所に引き渡した。巻き上げた金も返却された。
```

#### `fate_order_01_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
連行される山賊の頭は、代官の兵たちに引きずられていった。
```

#### `fate_order_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 自警団の長
```text
「ありがてえ！ これで商人たちも安心して街道を通れる」
```

#### `fate_order_02_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
自警団の長は笑顔を浮かべ、強く握手を求めてきた。
```

#### `end_success_order`（end_success）
**演出:** bg: bg_yato_city
```text
依頼達成。街道の秩序を取り戻し、旅人たちの安全を守った。
```
**rewards:** Gold:500, Exp:80, Rep:5, Order:3

#### `fate_evil_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_mystery
```text
山賊の頭は這いつくばるようにして、慌てて山奥へ逃げていった。
```

#### `fate_evil_01_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_mystery
```text
誰もいなくなった小屋で、床に転がっていた金袋を懐に収める。
```

#### `fate_evil_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_mystery
```text
自警団には「討伐した」とだけ報告した。懐の金袋はずっしりと重い。
```

#### `fate_evil_02_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_mystery
```text
血を流すこともなく、ただ懐に大金が舞い込んだ。悪くない取引だ。
```

#### `end_success_evil`（end_success）
**演出:** bg: bg_yato_city
```text
依頼達成。山賊は逃がしたが、金は得た。正義より実利が大切だ。
```
**rewards:** Gold:800, Exp:80, Rep:-20, Evil:3

#### `end_failure_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
山賊の振るう巨大な斧が肩口に食い込む。激痛の中で視界が揺らぐ。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_yato_mountain
```text
「身ぐるみ剥いでやるぜ」という嘲笑を最後に、意識は途絶えた。
```
**rewards:** Gold:0

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
- [ ] 侵入方法 of 分岐（変装 vs 正面突破）が正しく動作
- [ ] 変装ルートのランダム判定（50%）とhp_damageの動作
- [ ] 道中戦闘（battle_guard）の勝敗遷移が正しいこと
- [ ] 最終選択肢（突き出す vs 見逃す）のアライメントおよび報酬差異
- [ ] 全51ノードの遷移が正しいこと
- [ ] quests_special.csv への登録
