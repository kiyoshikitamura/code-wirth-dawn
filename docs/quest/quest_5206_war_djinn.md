# クエスト仕様書：5206 — 戦の魔神

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5206 |
| **Slug** | `qst_rep_war_djinn` |
| **クエスト種別** | 名声連動ボス（Reputation） |
| **推奨レベル** | 18 |
| **難度** | 5 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | EP10（`main_ep10`）クリア済み, Rep≥90 |
| **リピート** | 1世代1回 |
| **難易度Tier** | Tier 4（名声連動） |
| **経過日数 (time_cost)** | 6（成功: 6日 / 失敗: 3日） |
| **ノード数** | 38ノード |
| **サムネイル画像** | `/images/quests/bg_pyramid_chamber.png` |

---

## 1. クエスト概要

### 短文説明
```
[封印解除] 砂漠の遺跡から封印が解けた戦の魔神が目覚めた。
```

### 長文説明
```
マルカンド南方の古代遺跡で封印が崩壊し、戦の魔神ジンが目覚めた。
闘争本能のままに近隣を荒らし、キャラバンや集落に甚大な被害が出ている。
ギルドは名声ある冒険者に討伐または再封印を依頼する。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:4000|Exp:450|Rep:20|Chaos:8`

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 完全討伐（デフォルト） | 4000 | 450 | +20 | Chaos:8 |
| 再封印（選択肢） | 3000 | 400 | +25 | Order:10 |

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
         └─ travel_01
             └─ travel_02
                 └─ ruin_01
                     └─ ruin_02
                         └─ choice_prep (事前準備)
                              ├─ 聖水を入手 → holywater_01
                              │                └─ holywater_02
                              │                     └─ holywater_03
                              │                          └─ merge_enter
                              └─ 武器を強化 → forge_01
                                               └─ forge_02
                                                    └─ forge_03
                                                         └─ merge_enter
                                                              └─ enter_01
                                                                   └─ enter_02
                                                                        └─ battle_guard (門番戦)
                                                                             ├─ win → deep_01
                                                                             │        └─ deep_02
                                                                             │             └─ deep_03
                                                                             │                  └─ chamber_01
                                                                             │                       └─ chamber_02
                                                                             │                            └─ chamber_03
                                                                             │                                 └─ battle_boss
                                                                             │                                      ├─ win → victory_01
                                                                             │                                      │        └─ victory_02
                                                                             │                                      │             └─ choice_fate
                                                                             │                                      │                  ├─ 討伐 → slay_01
                                                                             │                                      │                  │          └─ slay_02
                                                                             │                                      │                  │               └─ end_success
                                                                             │                                      │                  └─ 再封印 → seal_01
                                                                             │                                      │                              └─ seal_02
                                                                             │                                      │                                   └─ seal_03
                                                                             │                                      │                                        └─ end_success_seal
                                                                             │                                      └─ lose → end_failure
                                                                             └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「南方の遺跡から魔神が目覚めた。キャラバンが壊滅し、集落が三つ消えた」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「戦の魔神ジン。古代に封じられた闘争の化身だ。封印の劣化で復活した」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
魔神相手だ。事前準備が生死を分ける。遺跡に入る前に、何を用意するか考える。
```

#### `travel_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
砂漠を南下する。途中、破壊されたキャラバンの残骸を見た。凄まじい暴力の痕跡だ。
```

#### `travel_02`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
```text
古代遺跡が見えてきた。上空に赤い光が渦巻いている。魔神の力だ。
```

#### `ruin_01`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
```text
遺跡の入口手前で足を止める。このまま入るのは無謀だ。何か対策を——
```

#### `ruin_02`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
```text
近くの集落の長老が助言をくれた。「聖水で魔神の炎を鎮めるか、武器を打ち直して刃を通すか——どちらかだ」
```

#### `choice_prep`（choice）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「集落の祠で聖水を入手する」 | holywater_01 |
| 「鍛冶師に武器を強化してもらう」 | forge_01 |

#### `holywater_01`（text）
**演出:** bg: bg_memory_oasis, bgm: bgm_quest_calm
```text
集落の祠を訪ねる。老巫女が古い聖水を分けてくれた。
```

#### `holywater_02`（text）
**演出:** bg: bg_memory_oasis, bgm: bgm_quest_calm, speaker: 老巫女
```text
「この聖水を魔神に振りかければ、炎の力を弱められるだろう」
```

#### `holywater_03`（text）
**演出:** bg: bg_memory_oasis, bgm: bgm_quest_calm
**次ノード:** merge_enter
```text
聖水を受け取った。魔神の炎を鎮め、戦いやすくなるはずだ。
```

#### `forge_01`（text）
**演出:** bg: bg_shop, bgm: bgm_quest_calm
```text
集落の鍛冶師を訪ねる。砂漠の民は古来、魔物の鱗で武器を打つ技術を持っている。
```

#### `forge_02`（text）
**演出:** bg: bg_shop, bgm: bgm_quest_calm, speaker: 鍛冶師
```text
「魔神殺しの刃か。材料はある。一晩で仕上げてやろう」
```

#### `forge_03`（text）
**演出:** bg: bg_shop, bgm: bgm_quest_calm
**次ノード:** merge_enter
```text
武器を強化してもらった。刃に砂漠の古い文様が刻まれている。これなら魔神の皮も斬れるだろう。
```

#### `merge_enter`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
```text
準備を終え、遺跡に突入する。入口から灼熱の空気が噴き出している。
```

#### `enter_01`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
```text
遺跡の内部は赤い光に満ちていた。壁の彫刻が熱で歪んでいる。
```

#### `enter_02`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
```text
通路の先に、炎をまとった魔物が徘徊している。魔神の眷属だ。
```

#### `battle_guard`（battle）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_battle
**パラメータ:** enemy_group_id: 421
```text
戦魔ジンの眷属が襲いかかる！
```

#### `deep_01`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_mystery
```text
眷属を倒し、遺跡の深部へ進む。壁画には古代の戦争が描かれている。
```

#### `deep_02`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_mystery
```text
壁画の中心に、巨大な人影が描かれている。四本の腕を持つ戦士——ジンだ。
```

#### `deep_03`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_mystery
```text
壁画の下に碑文がある。「闘争を愛し、闘争に飽きた者は永遠に眠る」——封印の言葉か。
```

#### `chamber_01`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
```text
最奥の大広間に出た。砕けた封印石の破片が散乱している。
```

#### `chamber_02`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_battle_boss, speaker: 戦魔ジン
```text
「……久しぶりの獲物だ。貴様、なかなかの闘気を持っているな」
```

#### `chamber_03`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_battle_boss, speaker: 戦魔ジン
```text
「自分は戦いを求める。強き者との死闘を渇望する。——さあ、来い！」
```

#### `battle_boss`（battle）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9066
```text
戦魔ジンとの激突——！
```

#### `victory_01`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_calm
```text
ジンが膝をついた。四本の腕が力なく垂れ下がる。
```

#### `victory_02`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_calm, speaker: 戦魔ジン
```text
「……満足だ。久しぶりに本気で戦えた。殺すか、封じるか——好きにしろ」
```

#### `choice_fate`（choice）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「二度と暴れさせない。ここで終わらせる」 | slay_01 |
| 「碑文の通りに再封印する。いつか闘争に飽きて眠ることを願う」 | seal_01 |

#### `slay_01`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_tense
```text
ジンの核を砕いた。魔神の体が灰となり、遺跡の赤い光が消えた。
```

#### `slay_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
遺跡から出ると、砂漠に静寂が戻っていた。魔神の脅威は永遠に去った。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
「戦の魔神を完全に討伐したか。凄まじい力だ」
砂漠の民は安堵した。キャラバンも再び動き出すだろう。
```
**rewards:** Gold:4000, Exp:450, Rep:20, Chaos:8

#### `seal_01`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_calm
```text
碑文の封印術を唱える。ジンの体が光に包まれ、封印石が再構成されていく。
```

#### `seal_02`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_calm, speaker: 戦魔ジン
```text
「封印か……退屈な眠りだ。だが、お前との戦いは夢に見よう。……次に目覚める時は——」
```

#### `seal_03`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
封印を完了し、遺跡を後にした。長老が新しい結界を張り直してくれた。
```

#### `end_success_seal`（end_success）
**演出:** bg: bg_guild
```text
「再封印を完了した。報酬は控えめだが、後世に禍根を残さない選択だ」
殺さずに済んだ——それが正しかったかは、わからない。
```
**rewards:** Gold:3000, Exp:400, Rep:25, Order:10

#### `end_failure`（end_failure）
**演出:** bg: bg_pyramid_chamber
```text
ジンの拳が全てを砕いた。「弱い。次の獲物を探すとしよう」
砂漠に魔神の哄笑が響いた。
```

---

## 4. 新規エネミー・アイテム定義参照

**使用エネミー（新規）:**
| ID | Slug | name | level | hp | atk | def |
|-----|-----|-----|-----|-----|-----|-----|
| 6036 | `boss_war_djinn` | 戦魔ジン | 28 | 1200 | 85 | 18 |

**使用エネミーグループ:**
| ID | Slug | 構成エネミー | 用途 |
|-----|-----|-----|-----|
| 421 | `grp_desert_beast` | 砂漠魔獣（流用） | 眷属戦 |
| 9066 | `enemy_grp_boss_djinn` | `boss_war_djinn` | ボス: ジン |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
5206,qst_rep_war_djinn,戦の魔神,18,5,6,"{""completed_quest"":""main_ep10"",""min_reputation"":90}",false,,,冒険者ギルド,[封印解除] 砂漠の遺跡から封印が解けた戦の魔神が目覚めた。
```

---

## 6. 実装チェックリスト

- [ ] ボスパラメータ `boss_war_djinn` をenemies.csvに登録
- [ ] エネミーグループ 9066 をenemy_groups.csvに登録
- [ ] choice_prep（聖水/武器強化）が正常に動作
- [ ] 討伐ルート: Gold:4000, Exp:450, Rep:20, Chaos:8
- [ ] 再封印ルート: Gold:3000, Exp:400, Rep:25, Order:10
- [ ] time_cost: 6（成功6日 / 失敗3日）
