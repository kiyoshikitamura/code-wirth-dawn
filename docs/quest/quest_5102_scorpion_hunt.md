# クエスト仕様書：5102 — 巨大蠍の討伐

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5102 |
| **Slug** | `qst_rep_scorpion_hunt` |
| **クエスト種別** | 名声連動（Reputation Tier 1） |
| **推奨レベル** | 6 |
| **難度** | 2 |
| **依頼主** | オアシス村長 |
| **出現条件** | EP1（`main_ep01`）クリア済み, Rep≥10, nation_id: `loc_marcund` |
| **リピート** | 1世代1回 |
| **難易度Tier** | Tier 1 |
| **経過日数 (time_cost)** | 3（成功: 3日 / 失敗: 2日） |
| **ノード数** | 30ノード |
| **サムネイル画像** | `/images/quests/bg_desert.png` |

---

## 1. クエスト概要

### 短文説明
```
[討伐依頼] オアシス近郊に巣を作った巨大毒蠍を駆除せよ。村人の安全を確保する。
```

### 長文説明
```
マルカンドのオアシス村近郊の砂漠に、巨大な毒蠍が巣を作り、
家畜を襲い、旅人を毒牙にかけている。
すでに被害者が何人も出ており、交易路も危険で通れなくなっている。
オアシス村長は腕の立つ冒険者に巨大蠍の討伐を依頼した。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:600|Exp:90|Rep:3`

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 毒素を薬師に渡す（正義ルート） | 600 | 90 | +3 | Justice:3 |
| 毒素を闇市に売る（混沌ルート） | 900 | 90 | ±0 | Chaos:3 |

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
                     └─ desert_01
                         └─ desert_02
                             └─ choice_hunt (第1の選択：狩りの方法)
                                  ├─ 火で追い出す → fire_01
                                  │                 └─ fire_02
                                  │                      └─ fire_random (random_branch 50%)
                                  │                           ├─ 成功（追い出し） → fire_success
                                  │                           │                      └─ merge_boss
                                  │                           └─ 失敗（逆襲） → fire_fail
                                  │                                                └─ fire_trap (hp_damage 15%)
                                  │                                                     └─ merge_boss
                                  └─ 巣穴に入る → cave_01
                                                  └─ cave_02
                                                       └─ battle_guard
                                                            ├─ win → merge_boss
                                                            └─ lose → end_failure
                                                                 └─ merge_boss (図示用)
                                                                      └─ boss_intro_01
                                                                           └─ boss_intro_02
                                                                                └─ boss_intro_03
                                                                                     └─ battle_boss
                                                                                          ├─ win → victory_01
                                                                                          │        └─ victory_02
                                                                                          │             └─ choice_fate
                                                                                          │                  ├─ 薬師に渡す → fate_just_01
                                                                                          │                  │                └─ fate_just_02
                                                                                          │                  │                     └─ end_success_justice
                                                                                          │                  └─ 闇市に売る → fate_chaos_01
                                                                                          │                                  └─ fate_chaos_02
                                                                                          │                                       └─ end_success_chaos
                                                                                          └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: オアシス村長
```text
「冒険者殿、村の近くに巨大な毒蠍が巣を作っておってな」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: オアシス村長
```text
「家畜を何頭も喰われた。旅人が毒で倒れたという報告もある」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: オアシス村長
```text
「このままでは交易路も使えん。どうか蠍を退治してくだされ」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
巨大蠍の討伐か。砂漠の危険な相手だが、受けよう。
```

#### `travel_01`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
灼熱の砂漠を進む。足跡と思しき溝が砂に刻まれている。蠍の痕跡だ。
```

#### `travel_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
砂丘の向こうに、巨大な穴が見えてきた。蠍の巣穴に違いない。
```

#### `desert_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
巣穴の周囲には砕かれた骨や干からびた家畜の死骸が散乱している。
```

#### `desert_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
あの穴に入るか、火を使って追い出すか。どちらにするか。
```

#### `choice_hunt`（choice）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「枯れ草を集めて煙で巣穴から追い出す」 | fire_01 |
| 「巣穴に直接侵入して仕留める」 | cave_01 |

#### `fire_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
巣穴の入口に枯れ草を山と積み、火を放つ。煙が穴の中に充満していく。
```

#### `fire_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
地面が震え始めた。何かが中から出てこようとしている……！
```

#### `fire_random`（random_branch）
**パラメータ:** prob: 50, next: `fire_success`, fallback: `fire_fail`

#### `fire_success`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_mystery
**次ノード:** merge_boss
```text
煙に耐えきれず、子蠍たちが四方八方に逃げ出した。親蠍だけが残っている。好機だ。
```

#### `fire_fail`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
煙が足りない！ 怒った蠍が地中から飛び出し、毒尾が空を切った！
```

#### `fire_trap`（hp_damage）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
**パラメータ:** percent: 15
**次ノード:** merge_boss
```text
毒尾の一撃をかわしきれず、腕をかすめた。毒が微かに体を蝕む。
```

#### `cave_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_mystery
```text
砂にまみれながら巣穴の中に潜り込む。暗く、じっとりと湿った空気が漂う。
```

#### `cave_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
奥から無数の小さな目がこちらを見ている。子蠍の群れだ！
```

#### `battle_guard`（battle）
**演出:** bg: bg_desert, bgm: bgm_battle
**パラメータ:** enemy_group_id: 422
```text
蠍の群れとの戦闘！
```
*(注: 422はgrp_scorpion_nest — デザートスコーピオン×3)*

#### `merge_boss`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
子蠍を蹴散らした先に、ひときわ巨大な影が蠢いている。親蠍だ。
```

#### `boss_intro_01`（text）
**演出:** bg: bg_desert, bgm: bgm_battle_boss
```text
全長3メートルはある巨体。硬質な甲殻が陽光を弾いている。
```

#### `boss_intro_02`（text）
**演出:** bg: bg_desert, bgm: bgm_battle_boss
```text
巨大な鋏がガチガチと鳴り、毒を滴らせた尾が高く振り上げられた。
```

#### `boss_intro_03`（text）
**演出:** bg: bg_desert, bgm: bgm_battle_boss
```text
巨大毒蠍が襲いかかってきた！
```

#### `battle_boss`（battle）
**演出:** bg: bg_desert, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9102
```text
巨大毒蠍との決戦！
```

#### `victory_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
巨大蠍の甲殻を貫き、ついに仕留めた。砂漠に静けさが戻る。
```

#### `victory_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
蠍の毒腺から希少な毒素を採取できた。薬にも毒にもなる代物だ。
```

#### `choice_fate`（choice）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「村の薬師に渡す。解毒薬の材料になるはずだ」 | fate_just_01 |
| 「闇市に売る。希少な毒素は高値がつくだろう」 | fate_chaos_01 |

#### `fate_just_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
蠍の毒素を村の薬師に手渡した。これで被害者の解毒薬が作れる。
```

#### `fate_just_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: オアシス村長
```text
「蠍を退治し、毒素まで薬師に！ 恩人だ、本当にありがとう」
```

#### `end_success_justice`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。毒蠍を討ち、村に安全を取り戻した。正しき行いが人々を救った。
```
**rewards:** Gold:600, Exp:90, Rep:3, Justice:3

#### `fate_chaos_01`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_mystery
```text
闇市の毒薬商に蠍の毒素を売りつけた。「これは……素晴らしい。高く買おう」
```

#### `fate_chaos_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_mystery
```text
村長には「蠍は退治したが毒腺は破壊された」と報告した。
```

#### `end_success_chaos`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。蠍は倒したが、毒素で私腹を肥やした。村人の苦しみは……まあ、いずれ忘れる。
```
**rewards:** Gold:900, Exp:90, Rep:0, Chaos:3

#### `end_failure`（end_failure）
**演出:** bg: bg_desert
```text
毒尾が体を貫いた。猛毒が血管を焼き、砂漠の灼熱と共に意識が消えていく……。
```

---

## 4. 新規エネミー・アイテム定義参照

**使用エネミー（新規）:**
| ID | Slug | name | Lv | HP | ATK | DEF |
|-----|-----|-----|:--:|:--:|:---:|:---:|
| 6052 | `boss_giant_scorpion` | 巨大毒蠍 | 8 | 200 | 28 | 12 |

**使用エネミーグループ:**
| ID | Slug | 構成エネミー | 用途 |
|-----|-----|-----|-----|
| 422 | `grp_scorpion_nest` | `enemy_markand_scorpion` ×3 | 道中戦闘（既存） |
| 9102 | `grp_boss_scorpion` | `boss_giant_scorpion` | ボス戦（新規） |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
5102,qst_rep_scorpion_hunt,巨大蠍の討伐,6,2,3,"{""completed_quest"":""main_ep01"",""min_reputation"":10,""nation_id"":""loc_marcund""}",false,,,オアシス村長,[討伐依頼] オアシス近郊に巣を作った巨大毒蠍を駆除せよ。
```

---

## 6. 実装チェックリスト

- [ ] 新規エネミー（boss_giant_scorpion）をCSVに登録
- [ ] 新規エネミーグループ（9102: grp_boss_scorpion）をCSVに登録
- [ ] 狩りの方法の分岐（火で追い出す vs 巣穴に入る）が正しく動作
- [ ] 火ルートのランダム判定（50%）とhp_damageの動作
- [ ] 巣穴ルートの道中戦闘（battle_guard）の勝敗遷移が正しいこと
- [ ] 最終選択肢（薬師に渡す vs 闇市に売る）のアライメントおよび報酬差異
- [ ] 全30ノードの遷移が正しいこと
- [ ] quests_special.csv への登録
