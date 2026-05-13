# クエスト仕様書：5101 — 墓荒らしの退治

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5101 |
| **Slug** | `qst_rep_graverobber` |
| **クエスト種別** | 名声連動（Reputation Tier 1） |
| **推奨レベル** | 5 |
| **難度** | 2 |
| **依頼主** | 聖堂騎士団 |
| **出現条件** | EP1（`main_ep01`）クリア済み, Rep≥10, nation_id: `loc_roland` |
| **リピート** | 1世代1回 |
| **難易度Tier** | Tier 1 |
| **経過日数 (time_cost)** | 3（成功: 3日 / 失敗: 2日） |
| **ノード数** | 30ノード |
| **サムネイル画像** | `/images/quests/bg_crypt.png` |

---

## 1. クエスト概要

### 短文説明
```
[指名依頼] 聖墓地を荒らす盗掘団を追い払え。遺品の返還も任務に含む。
```

### 長文説明
```
ローランド聖王国の郊外にある聖墓地が、盗掘団に荒らされている。
墓に眠る騎士たちの遺品が次々と盗まれ、闇市に流れているとの報告を受け、
聖堂騎士団は信頼のおける冒険者に盗掘団の排除と遺品の回収を依頼した。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:500|Exp:80|Rep:3`

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 遺品を返還（秩序ルート） | 500 | 80 | +3 | Order:3 |
| 遺品を横領（邪悪ルート） | 800 | 80 | ±0 | Evil:3 |

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
                     └─ graveyard_01
                         └─ graveyard_02
                             └─ choice_approach (第1の選択：侵入方法)
                                  ├─ 正面突入 → front_01
                                  │              └─ battle_guard
                                  │                   ├─ win → merge_inner
                                  │                   └─ lose → end_failure
                                  └─ 裏手から回る → back_01
                                                    └─ back_random (random_branch 60%)
                                                         ├─ 成功（潜入） → back_success
                                                         │                  └─ merge_inner
                                                         └─ 失敗（罠） → back_fail
                                                                          └─ back_trap (hp_damage 10%)
                                                                               └─ merge_inner
                                                                                    └─ inner_01
                                                                                         └─ inner_02
                                                                                              └─ boss_intro_01
                                                                                                   └─ boss_intro_02
                                                                                                        └─ battle_boss
                                                                                                             ├─ win → victory_01
                                                                                                             │        └─ victory_02
                                                                                                             │             └─ choice_fate
                                                                                                             │                  ├─ 返還 → fate_order_01
                                                                                                             │                  │          └─ fate_order_02
                                                                                                             │                  │               └─ end_success_order
                                                                                                             │                  └─ 横領 → fate_evil_01
                                                                                                             │                             └─ fate_evil_02
                                                                                                             │                                  └─ end_success_evil
                                                                                                             └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 聖堂騎士
```text
「冒険者よ、聖堂騎士団からの指名依頼だ。聖墓地が盗掘団に荒らされている」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 聖堂騎士
```text
「眠れる騎士たちの遺品が次々と盗まれ、闇市に流れている」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 聖堂騎士
```text
「盗掘団を排除し、盗まれた遺品を回収してほしい」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
死者の安らぎを乱す不届き者か。墓地へ向かおう。
```

#### `travel_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
聖都郊外の丘を越えると、広大な聖墓地が見えてきた。
```

#### `travel_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
墓地に近づくと、掘り返された墓穴がいくつも目に入る。ひどい有様だ。
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
| 「正面から堂々と乗り込む」 | front_01 |
| 「裏手の崩れた壁から忍び込む」 | back_01 |

#### `front_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
大扉を蹴り開けて突入する！ 中にいた見張りの盗掘者が武器を取った！
```

#### `battle_guard`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle
**パラメータ:** enemy_group_id: 101
```text
盗掘団の見張りとの戦闘！
```
*(注: 101はroland_undead_group — スケルトン+ゾンビ。盗掘で目覚めたアンデッドが見張り代わり)*

#### `back_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
崩れた壁の隙間に身を滑り込ませる。暗く狭い通路が続いている……。
```

#### `back_random`（random_branch）
**パラメータ:** prob: 60, next: `back_success`, fallback: `back_fail`

#### `back_success`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
**次ノード:** merge_inner
```text
誰にも見つからず、納骨堂の内部に潜入できた。奥から声が聞こえる。
```

#### `back_fail`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
足元の瓦礫を踏んでしまった！ 崩れた天井から石が降ってくる！
```

#### `back_trap`（hp_damage）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
**パラメータ:** percent: 10
**次ノード:** merge_inner
```text
落石で傷を負ったが、なんとか通路を抜けた。
```

#### `merge_inner`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
納骨堂の奥に進むと、松明の明かりに照らされた広間に出た。
```

#### `inner_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
石棺がこじ開けられ、中の副葬品が乱雑に袋に詰め込まれている。
```

#### `inner_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
広間の奥に、仲間に指示を出している大柄な男がいる。頭目だ。
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

#### `battle_boss`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9101
```text
盗掘団の頭目との戦闘！
```

#### `victory_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
頭目が地面に倒れ伏した。残りの手下たちは蜘蛛の子を散らすように逃げていった。
```

#### `victory_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
盗まれた遺品の山を発見した。金銀の装飾品や古い勲章が大量にある。
```

#### `choice_fate`（choice）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「すべて騎士団に返還する。それが正しい」 | fate_order_01 |
| 「一部を懐に入れてから報告する」 | fate_evil_01 |

#### `fate_order_01`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm
```text
遺品をすべて聖堂騎士団に引き渡した。
```

#### `fate_order_02`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm, speaker: 聖堂騎士
```text
「見事だ。死者たちも安らかに眠れるだろう。感謝する」
```

#### `end_success_order`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。正しき行いは、確かな信頼となって返ってきた。
```
**rewards:** Gold:500, Exp:80, Rep:3, Order:3

#### `fate_evil_01`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_mystery
```text
金目のものをいくつか懐に忍ばせ、残りだけを騎士団に返却した。
```

#### `fate_evil_02`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_mystery
```text
裏路地の質屋で遺品を換金した。騎士団は気づいていないようだ。
```

#### `end_success_evil`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。死者の遺品で私腹を肥やした。罪悪感は……まあ、いつか薄れるだろう。
```
**rewards:** Gold:800, Exp:80, Rep:0, Evil:3

#### `end_failure`（end_failure）
**演出:** bg: bg_crypt
```text
暗い納骨堂の中で意識を失った。目が覚めた時、遺品も金も何もかもが消えていた。
```

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
- [ ] 全30ノードの遷移が正しいこと
- [ ] quests_special.csv への登録
