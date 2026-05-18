# クエスト仕様書：5202 — 砂漠の僭王

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5202 |
| **Slug** | `qst_rep_sand_king` |
| **クエスト種別** | 名声連動ボス（Reputation） |
| **推奨レベル** | 16 |
| **難度** | 4 |
| **依頼主** | 交易商会 |
| **出現条件** | EP5（`main_ep05`）クリア済み, Rep≥60 |
| **リピート** | 1世代1回 |
| **難易度Tier** | Tier 4（名声連動） |
| **経過日数 (time_cost)** | 6（成功: 6日 / 失敗: 3日） |
| **ノード数** | 40ノード |
| **サムネイル画像** | `/images/quests/bg_pyramid_chamber.png` |

---

## 1. クエスト概要

### 短文説明
```
[緊急依頼] 砂漠の交易路を支配する「砂の王」を排除せよ。
```

### 長文説明
```
マルカンド交易都市の東方、砂漠の深部に「砂の王」を自称する盗賊王が勢力を拡大。
交易路を封鎖し、通行料と称して莫大な金品を巻き上げている。
商会は名の通った冒険者に排除を依頼する。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:3500|Exp:350|Rep:15|Chaos:5`

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 直接討伐（デフォルト） | 3500 | 350 | +15 | Chaos:5 |
| 内部瓦解を仕掛ける（選択肢） | 4000 | 250 | -10 | Evil:8 |

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 3日 |

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ start_04
             └─ travel_01
                 └─ travel_02
                     └─ oasis_01
                         └─ choice_intel
                              ├─ 酒場で情報収集 → tavern_01
                              │                   └─ tavern_02
                              │                        └─ tavern_03 (情報入手: 護衛の弱点)
                              │                             └─ merge_approach
                              └─ 闇市で内通者を探す → black_01
                                                       └─ black_02
                                                            └─ black_trap (hp_damage 15%)
                                                                 └─ black_03 (内通者確保)
                                                                      └─ merge_approach
                                                                           └─ desert_01
                                                                                └─ desert_02
                                                                                     └─ fortress_01
                                                                                          └─ fortress_02
                                                                                               └─ battle_guard (前哨戦)
                                                                                                    ├─ win → inner_01
                                                                                                    │        └─ inner_02
                                                                                                    │             └─ inner_03
                                                                                                    │                  └─ throne_01
                                                                                                    │                       └─ throne_02
                                                                                                    │                            └─ throne_03
                                                                                                    │                                 └─ battle_boss
                                                                                                    │                                      ├─ win → victory_01
                                                                                                    │                                      │        └─ victory_02
                                                                                                    │                                      │             └─ choice_fate
                                                                                                    │                                      │                  ├─ 討伐 → slay_01
                                                                                                    │                                      │                  │          └─ slay_02
                                                                                                    │                                      │                  │               └─ end_success
                                                                                                    │                                      │                  └─ 瓦解 → betray_01
                                                                                                    │                                      │                             └─ betray_02
                                                                                                    │                                      │                                  └─ betray_03
                                                                                                    │                                      │                                       └─ end_success_evil
                                                                                                    │                                      └─ lose → end_failure
                                                                                                    └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 商会長
```text
「交易路が完全に止まっている。『砂の王』を名乗る男のせいだ」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 商会長
```text
「奴は元傭兵団長だ。砂漠の地理を知り尽くし、精鋭を百人以上抱えている」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 商会長
```text
「正面からは厳しい。まずオアシスの町で情報を集めてくれ」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
報酬は破格だ。それだけ商会も追い詰められているということだろう。
```

#### `travel_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
砂漠の街道を東へ進む。途中、襲撃された隊商の残骸を幾つも見た。
```

#### `travel_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
砂の王の配下は組織的だ。見張り、伝令、襲撃部隊——軍隊のように統制されている。
```

#### `oasis_01`（text）
**演出:** bg: bg_memory_oasis, bgm: bgm_quest_calm
```text
オアシスの町に着いた。砂の王の影響で町は閑散としている。情報を集める方法は二つ。
```

#### `choice_intel`（choice）
**演出:** bg: bg_memory_oasis, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「酒場で傭兵たちから情報を聞き出す」 | tavern_01 |
| 「闇市で砂の王の内通者を探す」 | black_01 |

#### `tavern_01`（text）
**演出:** bg: bg_tavern_day, bgm: bgm_quest_calm
```text
酒場に入ると、元傭兵らしき男たちが酒を飲んでいる。金を渡して話を聞く。
```

#### `tavern_02`（text）
**演出:** bg: bg_tavern_day, bgm: bgm_quest_calm, speaker: 元傭兵
```text
「砂の王の砦は砂丘の裏にある。護衛は交代制で、夜明け前が最も手薄だ」
```

#### `tavern_03`（text）
**演出:** bg: bg_tavern_day, bgm: bgm_quest_calm
**次ノード:** merge_approach
```text
有益な情報を得た。護衛の弱点を突けば、前哨戦の突破が楽になるだろう。
```

#### `black_01`（text）
**演出:** bg: bg_memory_oasis, bgm: bgm_quest_mystery
```text
闇市の路地裏を歩く。怪しげな商人に声をかけ、内通者の情報を探る。
```

#### `black_02`（text）
**演出:** bg: bg_memory_oasis, bgm: bgm_quest_mystery
```text
「内通者？ いるにはいるが——代償が必要だ」商人が笑う。罠かもしれない。
```

#### `black_trap`（hp_damage）
**演出:** bg: bg_memory_oasis, bgm: bgm_quest_tense
**パラメータ:** percent: 15
```text
案の定、罠だった！ 路地裏で刺客に襲われた。なんとか撃退するが傷を負う。
```

#### `black_03`（text）
**演出:** bg: bg_memory_oasis, bgm: bgm_quest_mystery
**次ノード:** merge_approach
```text
刺客を尋問し、砂の王の内部事情を聞き出した。部下の不満が溜まっているらしい。
```

#### `merge_approach`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
```text
情報を元に、砂の王の砦を目指す。砂丘を越えた先に、岩壁に囲まれた要塞が見えた。
```

#### `desert_01`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
```text
砂嵐が近づいている。嵐に紛れて接近するか——
```

#### `desert_02`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
```text
砂嵐の中を突き進み、要塞の壁際まで辿り着いた。見張りの姿は見えない。
```

#### `fortress_01`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
```text
要塞の入口に、砂の王の精鋭が待ち構えている。突破するしかない。
```

#### `fortress_02`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
```text
「何者だ！ ここは砂の王の領土だ！ 帰るなら今のうちだぞ！」
```

#### `battle_guard`（battle）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_battle
**パラメータ:** enemy_group_id: 421
```text
砂の王の精鋭兵が襲いかかる！
```

#### `inner_01`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_mystery
```text
要塞の内部は予想以上に豪華だった。略奪品で飾られた廊下を進む。
```

#### `inner_02`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_mystery
```text
壁に掛かった武器は一級品ばかり。砂の王は相当な財を蓄えているようだ。
```

#### `inner_03`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_mystery
```text
奥の大広間に、一段高い玉座が見える。そこに座る男が——砂の王だ。
```

#### `throne_01`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_battle_boss, speaker: 砂の王
```text
「ほう……商会の犬が来たか。自分の砦に単身で乗り込むとは、大したものだ」
```

#### `throne_02`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_battle_boss, speaker: 砂の王
```text
「だが砂漠の王は自分だ。この地で生き延びたければ、自分に跪け」
```

#### `throne_03`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_battle_boss
```text
砂の王が立ち上がった。巨大な湾刀を抜き、殺気が部屋を満たす。
```

#### `battle_boss`（battle）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9062
```text
砂の僭王との決闘——！
```

#### `victory_01`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_calm
```text
砂の王が膝をついた。湾刀が床に転がる。
```

#### `victory_02`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_calm, speaker: 砂の王
```text
「……見事だ。好きにしろ。だが自分を殺しても、次の王が現れるだけだ」
```

#### `choice_fate`（choice）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「商会の依頼通り、討伐する」 | slay_01 |
| 「お前の組織を内側から瓦解させる。協力しろ」 | betray_01 |

#### `slay_01`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
```text
砂の王を討った。部下たちは散り散りに逃走した。交易路は再び開かれる。
```

#### `slay_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
商会に討伐の証拠を持ち帰った。正当な報酬が支払われた。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
「砂の王の討伐を確認。交易路は復活した。感謝する」
冒険者としての実力を、砂漠の民にも示した。
```
**rewards:** Gold:3500, Exp:350, Rep:15, Chaos:5

#### `betray_01`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_mystery, speaker: 砂の王
```text
「……瓦解だと？ 自分を生かしておいて、何を企む」
```

#### `betray_02`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_mystery
```text
砂の王の部下たちに「王は倒された」と偽情報を流す。組織は内部から崩壊を始めた。
```

#### `betray_03`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_mystery
```text
砂の王を「生かさず殺さず」の状態で放置し、混乱の中で要塞の財宝を回収した。汚い仕事だ。
```

#### `end_success_evil`（end_success）
**演出:** bg: bg_guild
```text
商会には「組織は壊滅した」と報告。裏で回収した財宝の分け前は——帳簿には載らない。
名声は地に落ちたが、懐は潤った。
```
**rewards:** Gold:4000, Exp:250, Rep:-10, Evil:8

#### `end_failure`（end_failure）
**演出:** bg: bg_pyramid_chamber
```text
砂の王の湾刀が閃き、砂漠の熱風と共に意識が途切れた。
```

---

## 4. 新規エネミー・アイテム定義参照

**使用エネミー（新規）:**
| ID | Slug | name | level | hp | atk | def |
|-----|-----|-----|-----|-----|-----|-----|
| 6032 | `boss_sand_king` | 砂の僭王 | 24 | 900 | 70 | 15 |

**使用エネミーグループ:**
| ID | Slug | 構成エネミー | 用途 |
|-----|-----|-----|-----|
| 421 | `grp_desert_beast` | 砂漠魔獣（既存） | 精鋭兵戦 |
| 9062 | `enemy_grp_boss_sand_king` | `boss_sand_king` | ボス: 砂の王 |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
5202,qst_rep_sand_king,砂漠の僭王,16,4,6,"{""completed_quest"":""main_ep05"",""min_reputation"":60}",false,,,交易商会,[緊急依頼] 砂漠の交易路を支配する「砂の王」を排除せよ。
```

---

## 6. 実装チェックリスト

- [ ] ボスパラメータ `boss_sand_king` をenemies.csvに登録
- [ ] エネミーグループ 9062 をenemy_groups.csvに登録
- [ ] choice_intel 分岐（酒場/闇市）が正常に動作
- [ ] 闇市ルートの hp_damage（15%）が正常に動作
- [ ] choice_fate 分岐の報酬差分が正しく適用
- [ ] 討伐ルート: Gold:3500, Exp:350, Rep:15, Chaos:5
- [ ] 内部瓦解ルート: Gold:4000, Exp:250, Rep:-10, Evil:8
- [ ] time_cost: 6（成功6日 / 失敗3日）
