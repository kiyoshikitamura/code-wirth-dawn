# クエスト仕様書：6003 — 第3話「黄昏のオアシス」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6003 |
| **Slug** | `main_ep03` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 3（Easy） |
| **難度** | 1 |
| **依頼主** | 王国軍 |
| **出現条件** | 第2話「砂礫の国境線」（6002）クリア / 滞在拠点: オアシスの村 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 31ノード |
| **ゲストNPC** | ガウェイン（guest_join → leave） |
| **難易度Tier** | Easy（rec_level: 3） |
| **サムネイル画像** | `/images/quests/bg_marcund.png` |
---

## 1. クエスト概要

### 短文説明
```
砂塵の王国マルカンドのオアシスの街。オアシスへの毒物投入事件を追う。
```

### 長文説明
```
砂塵の王国マルカンドのオアシスの街にて発生したオアシス毒殺未遂事件。
水脈を遡り、犯人の手掛かりを追うガウェインとプレイヤーの前に、信じがたい真実が現れる。
```

---

## 2. 報酬定義

```
Exp:120|Gold:300|Rep:10|Order:5
```

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ gawain_join (guest_join)
             └─ suspicion_01
                 └─ suspicion_02
                     └─ suspicion_03
                         └─ water_01
                             └─ water_02
                                 └─ trace_01
                                     └─ trace_02
                                         └─ trace_03
                                             └─ spy_01
                                                 └─ spy_02
                                                     └─ battle
                                                          ├─ win → choice1
                                                          │          └─ 「毒を止めるために戦う」 → dying_01
                                                          │                              └─ dying_01
                                                          │                                  └─ dying_02
                                                          │                                      └─ emblem_01
                                                          │                                          └─ emblem_02
                                                          │                                              └─ emblem_03
                                                          │                                                  └─ shock_01
                                                          │                                                      └─ shock_02
                                                          │                                                          └─ shock_03
                                                          │                                                              └─ farewell_01
                                                          │                                                                  └─ gawain_leave (leave)
                                                          │                                                                      └─ end_01
                                                          │                                                                          └─ end_node
                                                          └─ lose → end_failure_01
                                                                       └─ end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_marcund, bgm: bgm_quest_calm
```text
砂塵の王国マルカンドのオアシスの街。活気ある市場に辿り着いた。
```

#### `start_02`（text）
**演出:** bg: bg_marcund
```text
色とりどりの布屋根が並び、商人たちの呼び声が響く。だがどこか様子が違う。
```

#### `start_03`（text）
**演出:** bg: bg_marcund
```text
水売りたちの顔には焦燥が浮かび、市民の間には不穏な囁きが交わされていた。
```

#### `gawain_join`（guest_join）
**演出:** bg: bg_marcund
**パラメータ:** guest_id: `npc_guest_gawain`

#### `suspicion_01`（text）
**演出:** bg: bg_marcund, speaker: ガウェイン
```text
「街の人間の目が明らかに警戒の色を帯びている。オアシスで何かあったな」
```

#### `suspicion_02`（text）
**演出:** bg: bg_marcund, speaker: ガウェイン
```text
「特に水売りの奴らだ。さっきから一滴も水を売ろうとせず、頭を抱えている」
```

#### `suspicion_03`（text）
**演出:** bg: bg_marcund
```text
市場の片隅にあるオアシスの池へ向かうと、そこには異様な光景が広がっていた。
```

#### `water_01`（text）
**演出:** bg: bg_marcund, speaker: ガウェイン
```text
「おい、見ろ……池の水が赤黒く変色している。間違いない、毒を撒かれた」
```

#### `water_02`（text）
**演出:** bg: bg_marcund
```text
オアシスの周りには警備兵が立ち塞がり、市民の接近を厳しく阻んでいた。
```

#### `trace_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
「水脈の源流を遡るぞ」ガウェインに促され、オアシスの水源洞窟へ潜り込む。
```

#### `trace_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
湿った岩肌を進むと、洞窟の奥からかすかな話し声と薬品の臭いが漂ってきた。
```

#### `trace_03`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
暗がりの陰から覗くと、紫色の液体を水脈に注ぎ込もうとしている男たちがいる。
```

#### `spy_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense, speaker: 謎の工作員
```text
「これでこの都市の水は全滅だ。次は……」
```

#### `spy_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense, speaker: 謎の工作員
```text
「もう三つの都市に仲間が散っている。砂漠の国を混乱に陥れるのだ」
```

#### `battle`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle
**パラメータ:** enemy_group_id: 201, next: `choice1`, fail: `end_failure_01`

#### `choice1`（choice）
**演出:** bg: bg_crypt, bgm: bgm_battle
| 選択肢 | next_node |
|---------|-----------|
| 「毒を止めるために戦う」 | `dying_01` |

#### `dying_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
工作員たちを制圧した。息絶えかけた男が、懐から何かを取り出そうとする。
```

#### `dying_02`（text）
**演出:** bg: bg_crypt, speaker: 瀕死の工作員
```text
「フフ……遅い……我々の大義はすでに果たされつつある……」
```

#### `emblem_01`（text）
**演出:** bg: bg_crypt
```text
男の手からこぼれ落ちたのは、金属製の小さな紋章の欠片だった。
```

#### `emblem_02`（text）
**演出:** bg: bg_crypt, speaker: ガウェイン
```text
「これは……ローランド聖王国の特務機関『白百合の影』の紋章……！」
```

#### `emblem_03`（text）
**演出:** bg: bg_crypt, speaker: ガウェイン
```text
「なぜだ、なぜ我が国が砂漠の民のオアシスに毒を撒かねばならんのだ」
```

#### `shock_01`（text）
**演出:** bg: bg_crypt, speaker: ガウェイン
```text
「もし本当に王国の仕業だとしたら、俺たちは何を信じて剣を振るってきた」
```

#### `shock_02`（text）
**演出:** bg: bg_crypt, speaker: ガウェイン
```text
「俺の誇りも、信じてきた秩序も、すべてただの欺瞞だったというのか」
```

#### `shock_03`（text）
**演出:** bg: bg_crypt
```text
ガウェインは拳を強く握りしめた。その額には、悔し涙のような汗が滲んでいた。
```

#### `farewell_01`（text）
**演出:** bg: bg_crypt, speaker: ガウェイン
```text
「敵が残した解毒剤の処方箋だ。これを持って、至急街の薬師を動かそう」
```

#### `gawain_leave`（leave）
**演出:** bg: bg_crypt
**パラメータ:** guest_id: `npc_guest_gawain`

#### `end_01`（text）
**演出:** bg: bg_marcund
```text
水源の浄化は進んだ。だが、手に残る紋章の冷たさは、消えることがない。
```

#### `end_node`（end_success）
**演出:** bg: bg_marcund
```text
砂塵の王国マルカンド。その美しいオアシスに潜む闇は、あまりに深かった。
```
**rewards:** Exp:120, Gold:300, Rep:5, Order:5

#### `end_failure_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
**次ノード:** `end_failure`
```text
工作員たちの奇襲をかわせず、猛毒の塗られた刃に倒れる。視界が暗転する……
```

#### `end_failure`（end_failure）
**演出:** bg: bg_marcund
```text
オアシスの水脈は完全に毒に染まり、オアシスの街は死の都と化した。
```
**rewards:** Gold:0
