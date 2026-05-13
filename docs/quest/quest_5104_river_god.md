# クエスト仕様書：5104 — 河伯の怒り

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5104 |
| **Slug** | `qst_rep_river_god` |
| **クエスト種別** | 名声連動（Reputation Tier 1） |
| **推奨レベル** | 6 |
| **難度** | 2 |
| **依頼主** | 村の長老 |
| **出現条件** | EP1（`main_ep01`）クリア済み, Rep≥10, nation_id: `loc_haryu` |
| **リピート** | 1世代1回 |
| **難易度Tier** | Tier 1 |
| **経過日数 (time_cost)** | 3（成功: 3日 / 失敗: 2日） |
| **ノード数** | 30ノード |
| **サムネイル画像** | `/images/quests/bg_karyu_village.png` |

---

## 1. クエスト概要

### 短文説明
```
[鎮撫依頼] 河の氾濫を引き起こす妖怪「河伯」を鎮めよ。
```

### 長文説明
```
華龍国の辺境にある農村で、河川の氾濫が続いている。
村人たちは河に棲む妖怪「河伯」の怒りだと恐れているが、
実は上流で染料工房が廃液を河に垂れ流していることが原因だった。
村の長老は冒険者に河伯の鎮撫を依頼するが、真の解決策は別にある。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:550|Exp:90|Rep:3`

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 河伯と和解（正義ルート） | 550 | 90 | +5 | Justice:3 |
| 河伯を退治（邪悪ルート） | 700 | 90 | +3 | Evil:3 |

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
                     └─ river_01
                         └─ river_02
                             └─ choice_approach (第1の選択：調査方法)
                                  ├─ 上流を調べる → upstream_01
                                  │                 └─ upstream_02
                                  │                      └─ merge_shrine
                                  └─ 河伯の祠へ直行 → shrine_01
                                                       └─ shrine_random (random_branch 50%)
                                                            ├─ 成功（通過） → shrine_success
                                                            │                  └─ merge_shrine
                                                            └─ 失敗（襲撃） → shrine_fail
                                                                               └─ shrine_trap (hp_damage 15%)
                                                                                    └─ merge_shrine
                                                                                         └─ encounter_01
                                                                                              └─ encounter_02
                                                                                                   └─ boss_intro_01
                                                                                                        └─ boss_intro_02
                                                                                                             └─ battle_boss
                                                                                                                  ├─ win → victory_01
                                                                                                                  │        └─ victory_02
                                                                                                                  │             └─ choice_fate
                                                                                                                  │                  ├─ 和解 → fate_justice_01
                                                                                                                  │                  │          └─ fate_justice_02
                                                                                                                  │                  │               └─ end_success_justice
                                                                                                                  │                  └─ 退治 → fate_evil_01
                                                                                                                  │                             └─ fate_evil_02
                                                                                                                  │                                  └─ end_success_evil
                                                                                                                  └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 村の長老
```text
「冒険者殿、どうかお力をお貸しくだされ。河が荒れ、田畑が水に沈んでおるのです」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 村の長老
```text
「村の者は、河に棲む妖怪"河伯"の怒りだと恐れておりまして……」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 村の長老
```text
「河伯を鎮めてくだされ。このままでは村が滅んでしまいます」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
妖怪の仕業か……。まずは河の様子を確かめに行こう。
```

#### `travel_01`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_field
```text
辺境の農村に到着した。田畑は泥水に浸かり、村人たちの顔は暗い。
```

#### `travel_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense
```text
河の水は異様に濁り、悪臭が漂っている。これは……ただの氾濫ではない。
```

#### `river_01`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense
```text
河伯の祠は下流にあるらしいが、水の汚れは上流から来ているようだ。
```

#### `river_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense
```text
まず上流を調べるか、それとも直接河伯の祠へ向かうか。
```

#### `choice_approach`（choice）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「まず上流を調査して原因を探る」 | upstream_01 |
| 「河伯の祠へ直行して直接交渉する」 | shrine_01 |

#### `upstream_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
上流を辿ると、河岸に染料工房があった。廃液が河にそのまま流されている。
```

#### `upstream_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
**次ノード:** merge_shrine
```text
これが河伯の怒りの原因か。汚染の証拠を手に入れた。祠へ向かおう。
```

#### `shrine_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
河沿いの険しい道を祠へ向かう。濁流の中から不穏な気配がする……。
```

#### `shrine_random`（random_branch）
**パラメータ:** prob: 50, next: `shrine_success`, fallback: `shrine_fail`

#### `shrine_success`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
**次ノード:** merge_shrine
```text
河の流れを読み、飛び石を渡って無事に祠の前に辿り着いた。
```

#### `shrine_fail`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
突然、濁流が渦を巻いて水柱が襲いかかってきた！
```

#### `shrine_trap`（hp_damage）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
**パラメータ:** percent: 15
**次ノード:** merge_shrine
```text
水の塊に叩きつけられた。ずぶ濡れになりながらも祠に辿り着いた。
```

#### `merge_shrine`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
苔むした古い祠の前に立つと、河の水面が不自然に盛り上がった。
```

#### `encounter_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
水の中から、蛙に似た巨大な妖怪の姿が浮かび上がった。河伯だ。
```

#### `encounter_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_battle_boss, speaker: 河伯
```text
「人間が来おったか……。この穢れた河を見よ。全てお前たちのせいだ！」
```

#### `boss_intro_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_battle_boss, speaker: 河伯
```text
「河を汚し、我が眷属を殺し、それでも知らぬ顔をする。許さぬ！」
```

#### `boss_intro_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_battle_boss
```text
河伯は問答無用で襲いかかってきた！ まずは力で抑え込むしかない！
```

#### `battle_boss`（battle）
**演出:** bg: bg_karyu_mountain, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9104
```text
河伯との戦闘！
```

#### `victory_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
```text
河伯が力を失い、水面に膝をついた。怒りの目が少しだけ和らいだ。
```

#### `victory_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm, speaker: 河伯
```text
「……お前、我を殺すのか。ならば好きにするがいい」
```

#### `choice_fate`（choice）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「殺さない。上流の汚染を止めてみせる」 | fate_justice_01 |
| 「村の安全のため、ここで始末する」 | fate_evil_01 |

#### `fate_justice_01`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
村へ戻り、染料工房の廃液を止めさせた。河伯は静かに祠へ帰っていった。
```

#### `fate_justice_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 村の長老
```text
「河が澄み始めた！ 妖怪と人が共に生きる道を見つけてくださったのですね」
```

#### `end_success_justice`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。河伯の怒りを鎮め、人と妖の共存の道を示した。
```
**rewards:** Gold:550, Exp:90, Rep:5, Justice:3

#### `fate_evil_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
河伯に止めを刺した。水面が静まり返り、祠の灯が消えた。
```

#### `fate_evil_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_mystery
```text
「河伯を退治しました」と報告した。村人は安堵したが、河の汚れは変わらない。
```

#### `end_success_evil`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。妖怪は消えたが、河の汚染はそのままだ。いずれまた問題が起きるだろう。
```
**rewards:** Gold:700, Exp:90, Rep:3, Evil:3

#### `end_failure`（end_failure）
**演出:** bg: bg_karyu_mountain
```text
河伯の水流に呑まれ、意識が薄れていく。冷たい水が全身を包み込んだ。
```

---

## 4. 新規エネミー・アイテム定義参照

**使用エネミー（新規）:**
| ID | Slug | name | Lv | HP | ATK | DEF |
|-----|-----|-----|:--:|:--:|:---:|:---:|
| 6054 | `boss_river_god` | 河伯 | 8 | 210 | 26 | 8 |

**使用エネミーグループ:**
| ID | Slug | 構成エネミー | 用途 |
|-----|-----|-----|-----|
| 9104 | `grp_boss_river_god` | `boss_river_god` | ボス戦（新規） |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
5104,qst_rep_river_god,河伯の怒り,6,2,3,"{""completed_quest"":""main_ep01"",""min_reputation"":10,""nation_id"":""loc_haryu""}",false,,,村の長老,[鎮撫依頼] 河の氾濫を引き起こす妖怪を鎮めよ。
```

---

## 6. 実装チェックリスト

- [ ] 新規エネミー（boss_river_god）をCSVに登録
- [ ] 新規エネミーグループ（9104: grp_boss_river_god）をCSVに登録
- [ ] 調査方法の分岐（上流調査 vs 祠直行）が正しく動作
- [ ] 祠直行ルートのランダム判定（50%）とhp_damageの動作
- [ ] 最終選択肢（和解 vs 退治）のアライメントおよび報酬差異
- [ ] 全30ノードの遷移が正しいこと
- [ ] quests_special.csv への登録
