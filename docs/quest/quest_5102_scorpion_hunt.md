# クエスト仕様書：5102 — 巨大蠍の討伐

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5102 |
| **Slug** | `qst_rep_scorpion_hunt` |
| **クエスト種別** | 特殊クエスト（Special） |
| **推奨レベル** | 6（Normal） |
| **難度** | 2 |
| **依頼主** | オアシス村長 |
| **出現条件** | 第1話「始まりの轍」（6001）クリア / 滞在拠点: マルカンド拠点 / 名声 10 以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **経過日数 (time_cost)** | 3 |
| **ノード数** | 50ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 6） |
| **サムネイル画像** | `/images/quests/bg_desert.png` |
---

## 1. クエスト概要

### 短文説明
```
[討伐] オアシス近郊に巣を作った巨大毒蠍を駆除せよ。
```

### 長文説明
```
マルカンドの砂漠地帯にあるオアシス近郊に、巨大な毒蠍が巣を作り、
家畜や旅人が襲われる被害が出ている。
交易路の安全を確保するため、村長の要請に応じて巨大毒蠍の巣穴へ向かい、
その脅威を取り除け。強烈な毒に注意せよ。
```

---

## 2. 報酬定義

**CSV記載形式（デフォルトルート）:**
```
Gold:600|Exp:90|Rep:3|Justice:3
```

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント | 追加 |
|--------|------|-----|:---:|-------------|------|
| 毒素を村の薬師に提供（デフォルト） | 600 | 90 | +3 | Justice:3 | — |
| 毒素を闇市の商人に密売 | 900 | 90 | -20 | Chaos:3 | — |

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
                                         └─ desert_01
                                             └─ desert_02
                                                 └─ choice_hunt
                                                     ├─ 火で追い出す → fire_01
                                                     │                └─ fire_01_02
                                                     │                    └─ fire_02
                                                     │                        └─ fire_random (random_branch 50%/50%)
                                                     │                             ├─ success → fire_success
                                                     │                             │              └─ fire_success_02
                                                     │                             │                   └─ merge_boss
                                                     │                             └─ failure → fire_fail
                                                     │                                            └─ fire_trap (hp_damage 15%)
                                                     │                                                 └─ fire_trap_02
                                                     │                                                      └─ merge_boss
                                                     └─ 巣穴に入る → cave_01
                                                                    └─ cave_01_02
                                                                        └─ cave_02
                                                                            └─ battle_guard
                                                                                 ├─ win → merge_boss
                                                                                 └─ lose → end_failure_01
                                                                                      └─ merge_boss
                                                                                           └─ merge_boss_02
                                                                                                └─ boss_intro_01
                                                                                                     └─ boss_intro_02
                                                                                                          └─ boss_intro_03
                                                                                                               └─ battle_boss
                                                                                                                    ├─ win → victory_01
                                                                                                                    │        └─ victory_01_02
                                                                                                                    │             └─ victory_02
                                                                                                                    │                  └─ victory_02_02
                                                                                                                    │                       └─ choice_fate
                                                                                                                    │                            ├─ 薬師 → fate_just_01
                                                                                                                    │                            │         └─ fate_just_01_02
                                                                                                                    │                            │              └─ fate_just_02
                                                                                                                    │                            │                   └─ fate_just_02_02
                                                                                                                    │                            │                        └─ end_success_justice
                                                                                                                    │                            └─ 闇市 → fate_chaos_01
                                                                                                                    │                                      └─ fate_chaos_01_02
                                                                                                                    │                                           └─ fate_chaos_02
                                                                                                                    │                                                └─ fate_chaos_02_02
                                                                                                                    │                                                     └─ end_success_chaos
                                                                                                                    └─ lose → end_failure_01
                                                                                                                              └─ end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_marcund, bgm: bgm_quest_calm, speaker: オアシス村長
```text
「冒険者殿、村の近くに巨大な毒蠍が巣を作っておってな」
```

#### `start_01_02`（text）
**演出:** bg: bg_marcund, bgm: bgm_quest_calm
```text
砂漠の強い風が、開け放たれた窓から熱い砂を室内に運んでくる。
```

#### `start_02`（text）
**演出:** bg: bg_marcund, bgm: bgm_quest_calm, speaker: オアシス村長
```text
「家畜を何頭も喰われた。旅人が毒で倒れたという報告もある」
```

#### `start_02_02`（text）
**演出:** bg: bg_marcund, bgm: bgm_quest_calm
```text
（砂漠の毒蠍か。その毒は一滴でラクダを即死させると聞くが……）
```

#### `start_03`（text）
**演出:** bg: bg_marcund, bgm: bgm_quest_calm, speaker: オアシス村長
```text
「このままでは交易路も使えん。どうか蠍を退治してくだされ」
```

#### `start_03_02`（text）
**演出:** bg: bg_marcund, bgm: bgm_quest_calm, speaker: オアシス村長
```text
「退治してくれれば、村の貯蓄から十分な報酬を支払おう」
```

#### `start_04`（text）
**演出:** bg: bg_marcund, bgm: bgm_quest_calm
```text
巨大蠍の討伐か。砂漠の危険な相手だが、受けよう。
```

#### `travel_01`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
灼熱の砂漠を進む。足跡と思しき溝が砂に刻まれている。蠍の痕跡だ。
```

#### `travel_01_02`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
照りつける太陽が、砂の一粒一粒を黄金色に焼き尽くしていく。
```

#### `travel_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
砂丘の向こうに、巨大な穴が見えてきた。蠍の巣穴に違いない。
```

#### `travel_02_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
（周囲の熱気が、あの穴の近くだけさらに濃くなっているようだ）
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
| 「枯れ草を集めて煙で巣穴から追い出す」 | `fire_01` |
| 「巣穴に直接侵入して仕留める」 | `cave_01` |

#### `fire_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
巣穴の入口に枯れ草を山と積み、火を放つ。煙が穴の中に充満していく。
```

#### `fire_01_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
黒い煙が、熱風に乗って巣穴の奥深くへと吸い込まれていく。
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
```text
煙に耐えきれず、子蠍たちが四方八方に逃げ出した。親蠍だけが残っている。好機だ。
```

#### `fire_success_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_mystery
**次ノード:** `merge_boss`
```text
（雑魚は逃げたか。あとはあの巨大な親を仕留めるだけだな）
```

#### `fire_fail`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
煙が足りない！ 怒った蠍が地中から飛び出し、毒尾が空を切った！
```

#### `fire_trap`（hp_damage）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
**パラメータ:** percent: 15
```text
毒尾の一撃をかわしきれず、腕をかすめた。毒が微かに体を蝕む。
```

#### `fire_trap_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
**次ノード:** `merge_boss`
```text
（くっ、素早いな。だがまだ致命傷ではない。立て直そう）
```

#### `cave_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_mystery
```text
砂にまみれながら巣穴の中に潜り込む。暗く、じっとりと湿った空気が漂う。
```

#### `cave_01_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_mystery
```text
（暗くて視界が効かないな。音と空気の揺れを頼りに進むか）
```

#### `cave_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
奥から無数の小さな目がこちらを見ている。子蠍の群れだ！
```

#### `battle_guard`（battle）
**演出:** bg: bg_desert, bgm: bgm_battle
**パラメータ:** enemy_group_id: 422, next: `merge_boss`, fail: `end_failure_01`
| 敵グループ | 構成 |
|----------|------|
| `grp_scorpion_nest` | デザートスコーピオン ×3 |

#### `merge_boss`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
子蠍を蹴散らした先に、ひときわ巨大な影が蠢いている。親蠍だ。
```

#### `merge_boss_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
巣穴の奥の暗闇から、カチカチと不気味な音が響き渡る。
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
**パラメータ:** enemy_group_id: 9102, next: `victory_01`, fail: `end_failure_01`
| 敵グループ | 構成 |
|----------|------|
| `grp_boss_scorpion` | 巨大毒蠍 |

#### `victory_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
巨大蠍の甲殻を貫き、ついに仕留めた。砂漠に静けさが戻る。
```

#### `victory_01_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
巨大な蠍の巨体が崩れ落ち、砂塵がゆっくりと舞い降りた。
```

#### `victory_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
蠍の毒腺から希少な毒素を採取できた。薬にも毒にもなる代物だ。
```

#### `victory_02_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
（これを村に届けるか、あるいは闇市で売るか……悩ましいな）
```

#### `choice_fate`（choice）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「村の薬師に渡す。解毒薬の材料になるはずだ」 | `fate_just_01` |
| 「闇市に売る。希少な毒素は高値がつくだろう」 | `fate_chaos_01` |

#### `fate_just_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
蠍の毒素を村の薬師に手渡した。これで被害者の解毒薬が作れる。
```

#### `fate_just_01_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
薬師は震える手で瓶を受け取り、深く感謝の頭を下げた。
```

#### `fate_just_02`（text）
**演出:** bg: bg_marcund, bgm: bgm_quest_calm, speaker: オアシス村長
```text
「蠍を退治し、毒素まで薬師に！ 恩人だ、本当にありがとう」
```

#### `fate_just_02_02`（text）
**演出:** bg: bg_marcund, bgm: bgm_quest_calm
```text
村長は自分の手を両手で握りしめ、涙ながらに感謝した。
```

#### `end_success_justice`（end_success）
**演出:** bg: bg_marcund
```text
依頼達成。毒蠍を討ち、村に安全を取り戻した。正しき行いが人々を救った。
```
**rewards:** Gold:600, Exp:90, Rep:3, Justice:3

#### `fate_chaos_01`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_mystery
```text
闇市の毒薬商に蠍の毒素を持ち込み、取引を持ちかけた。
```

#### `fate_chaos_01_02`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_mystery, speaker: 毒薬商
```text
「これは極上の毒素だな……。よし、言い値で買い取ろう」
```

#### `fate_chaos_02`（text）
**演出:** bg: bg_marcund, bgm: bgm_quest_mystery
```text
村長には「蠍は退治したが毒腺は破壊された」と報告した。
```

#### `fate_chaos_02_02`（text）
**演出:** bg: bg_marcund, bgm: bgm_quest_mystery
```text
村長は少し残念そうにしたが、蠍が消えたことに満足した。
```

#### `end_success_chaos`（end_success）
**演出:** bg: bg_slums
```text
依頼達成。毒素を密売して私腹を肥やした。罪悪感など砂漠の風に消える。
```
**rewards:** Gold:900, Exp:90, Rep:-20, Chaos:3

#### `end_failure_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
鋭い毒尾が胸を貫く。灼熱の毒が全身を巡り、力なく崩れ落ちた。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_desert
```text
砂漠の熱い砂の上で、意識は暗闇の底へと溶けて消えていった。
```
**rewards:** Gold:0

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
- [ ] 全50ノードの遷移が正しいこと
- [ ] quests_special.csv への登録
