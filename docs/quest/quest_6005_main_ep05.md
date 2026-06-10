# クエスト仕様書：6005 — 第5話「老騎士の背中」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6005 |
| **Slug** | `main_ep05` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 5（Normal） |
| **難度** | 1 |
| **依頼主** | 王国軍 |
| **出現条件** | 第4話「砂塵の激突」（6004）クリア / 滞在拠点: 砂塵の王国マルカンド首都 黄金都市イスハーク |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 34ノード |
| **ゲストNPC** | ガウェイン（guest_join → leave / 犠牲離脱） |
| **難易度Tier** | Normal（rec_level: 5） |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |
---

## 1. クエスト概要

### 短文説明
```
鉄騎隊の包囲網。老騎士ガウェインの最期の背中。
```

### 長文説明
```
王国から反逆者として指名手配されたガウェイン。追撃する鉄騎隊の包囲に陥る中、
老騎士はプレイヤーを逃がすため、一人大剣を手に立ちはだかる。
```

---

## 2. 報酬定義

```
Exp:200|Gold:500|Rep:15|Order:5|Items:501
```

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ gawain_join (guest_join)
             └─ ambush_01
                 └─ ambush_02
                     └─ commander_01
                         └─ commander_02
                             └─ resolve_01
                                 └─ resolve_02
                                     └─ resolve_03
                                         └─ wave_01
                                             └─ battle1
                                                  ├─ win → choice1
                                                  │          └─ 「反撃する」 → clear_01
                                                  │                              └─ clear_01
                                                  │                                  └─ clear_02
                                                  │                                      └─ second_01
                                                  │                                          └─ battle2
                                                  │                                               ├─ win → choice2
                                                  │                                               │          └─ 「ガウェインと共に防ぐ」 → last_01
                                                  │                                               │                                         └─ last_01
                                                  │                                               │                                             └─ last_02
                                                  │                                               │                                                 └─ last_03
                                                  │                                               │                                                     └─ last_04
                                                  │                                               │                                                         └─ gawain_leave (leave)
                                                  │                                               │                                                             └─ run_01
                                                  │                                               │                                                                 └─ run_02
                                                  │                                                                                                                 └─ run_03
                                                  │                                                                                                                     └─ end_node
                                                  │                                               └─ lose → end_failure_01
                                                  └─ lose → end_failure_01
                                                               └─ end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_tense
```text
王国がガウェインを「反逆者」として公表した。我々は山に逃げ込んだ。
```

#### `start_02`（text）
**演出:** bg: bg_camp
```text
告発しようとした良識派の将軍は暗殺され、証拠も奪い去られたらしい。
```

#### `start_03`（text）
**演出:** bg: bg_camp
```text
そして今、我々を捕縛するための王国軍鉄騎隊が、山麓に集結しつつある。
```

#### `gawain_join`（guest_join）
**演出:** bg: bg_camp
**パラメータ:** guest_id: `npc_guest_gawain`

#### `ambush_01`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_crisis
```text
「逃げ道を塞がれたか」森の各所から、重厚な甲冑の擦れる音が響く。
```

#### `ambush_02`（text）
**演出:** bg: bg_camp
```text
鉄騎隊の包囲網。前方に立ちふさがったのは、王国軍精鋭部隊の将校だ。
```

#### `commander_01`（text）
**演出:** bg: bg_camp, speaker: 王国軍将校
```text
「反逆者ガウェイン。ここで処断する」
```

#### `commander_02`（text）
**演出:** bg: bg_camp, speaker: 王国軍将校
```text
「新入りの傭兵とやらも同罪だ。捕らえる必要はない、その場で斬れ！」
```

#### `resolve_01`（text）
**演出:** bg: bg_camp, speaker: ガウェイン
```text
「……どうやら本気だな。新入り、ここは俺が防ぐ。お前は東へ走れ」
```

#### `resolve_02`（text）
**演出:** bg: bg_camp, speaker: ガウェイン
```text
「この森を抜ければ夜刀の国境だ。あそこなら王国の手も容易には届かん」
```

#### `resolve_03`（text）
**演出:** bg: bg_camp
```text
「嫌です」と叫ぼうとした我々を、ガウェインの眼光が力強く制した。
```

#### `wave_01`（text）
**演出:** bg: bg_camp, speaker: ガウェイン
```text
「お前の命はここで捨てるにゃ惜しい！ 来るぞ、まずは前衛を叩く！」
```

#### `battle1`（battle）
**演出:** bg: bg_camp, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 203, next: `choice1`, fail: `end_failure_01`

#### `choice1`（choice）
**演出:** bg: bg_camp, bgm: bgm_battle_strong
| 選択肢 | next_node |
|---------|-----------|
| 「反撃する」 | `clear_01` |

#### `clear_01`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_crisis
```text
前衛の兵士たちを退けた。だが、奥からさらに第二波の重装歩兵が現れる。
```

#### `clear_02`（text）
**演出:** bg: bg_camp, speaker: ガウェイン
```text
「きりがないな……。おい新入り、俺の指示を聞け。絶対に生き延びろ」
```

#### `second_01`（text）
**演出:** bg: bg_camp, speaker: ガウェイン
```text
「お前が真実を世界の果てまで届けるんだ。……いくぞ、これが最後だ！」
```

#### `battle2`（battle）
**演出:** bg: bg_camp, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 203, next: `choice2`, fail: `end_failure_01`

#### `choice2`（choice）
**演出:** bg: bg_camp, bgm: bgm_battle_strong
| 選択肢 | next_node |
|---------|-----------|
| 「ガウェインと共に防ぐ」 | `last_01` |

#### `last_01`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_calm
```text
激闘の末、囲みを突破した。だがガウェインの背中には三本の矢が深く刺さっていた。
```

#### `last_02`（text）
**演出:** bg: bg_camp
```text
「ガウェイン！」駆け寄ろうとする我々を、彼は片手で強く押し止めた。
```

#### `last_03`（text）
**演出:** bg: bg_camp, speaker: ガウェイン
```text
「来るな！ 背中を見せて走れ！ ……お前は生き延びねばならんのだ」
```

#### `last_04`（text）
**演出:** bg: bg_camp, speaker: ガウェイン
```text
「世界の果てを見届けろ。……そして、自由な風になれ……！」
```

#### `gawain_leave`（leave）
**演出:** bg: bg_camp
**パラメータ:** guest_id: `npc_guest_gawain`

#### `run_01`（text）
**演出:** bg: bg_camp
```text
大剣を杖代わりに立ち上がった老騎士。その背中が迫り来る兵士の前に立ちはだかる。
```

#### `run_02`（text）
**演出:** bg: bg_camp
```text
涙で視界が滲む中、我々はただ東へ走った。背後から激しい金属音と叫び声が響く。
```

#### `run_03`（text）
**演出:** bg: bg_camp
```text
やがて——恐ろしいほどの静寂が、深い森の奥へと満ちていった。
```

#### `end_node`（end_success）
**演出:** bg: bg_camp
```text
生き延びて、世界の果てを見届けろ。老騎士の最期の言葉が、胸に突き刺さっている。
```
**rewards:** Exp:200, Gold:500, Rep:15, Order:5, Item:501

#### `end_failure_01`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_crisis
**次ノード:** `end_failure`
```text
鉄騎隊の圧倒的な重圧に押し潰され、地に伏す。老騎士を守ることもできず……
```

#### `end_failure`（end_failure）
**演出:** bg: bg_camp
```text
反逆の徒として森の露と消えた。真実は闇へ葬られ、老騎士の背中も失われた。
```
**rewards:** Gold:0
