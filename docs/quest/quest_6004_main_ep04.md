# クエスト仕様書：6004 — 第4話「消えゆく商人」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6004 |
| **Slug** | `main_ep04` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 4（Normal） |
| **難度** | 1 |
| **依頼主** | 王国軍 |
| **出現条件** | 第3話「オアシスの陰謀」（6003）クリア / 滞在拠点: 平原の都市 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 37ノード |
| **ゲストNPC** | ガウェイン（guest_join → leave） |
| **難易度Tier** | Normal（rec_level: 4） |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |
---

## 1. クエスト概要

### 短文説明
```
国境警備任務。正体不明の武装集団との遭遇。
```

### 長文説明
```
オアシス事件から数日。マルカンド領内の交易路で商人が次々と失踪する事件が発生。
調査に乗り出したガウェインとプレイヤーは、王国の闇を体現する暗殺部隊と対峙する。
```

---

## 2. 報酬定義

```
Exp:150|Gold:400|Rep:10|Order:5|Items:item_pass_markand
```

---

## 3. シナリオノードフロー

```text
start
 └─ gawain_join (guest_join)
     └─ patrol_01
         └─ patrol_02
             └─ rumor_01
                 └─ rumor_02
                     └─ merchant_01
                         └─ merchant_02
                             └─ plea_01
                                 └─ plea_02
                                     └─ analysis_01
                                         └─ analysis_02
                                             └─ trail_01
                                                 └─ trail_02
                                                     └─ ambush_01
                                                         └─ ambush_02
                                                             └─ hunter_01
                                                                 └─ hunter_02
                                                                     └─ hunter_03
                                                                         └─ hunter_04
                                                                             └─ battle
                                                                                  ├─ win → choice1
                                                                                  │          └─ 「迎撃する」 → post_01
                                                                                  │                              └─ post_01
                                                                                  │                                  └─ post_02
                                                                                  │                                      └─ identity_01
                                                                                  │                                          └─ identity_02
                                                                                  │                                              └─ omen_01
                                                                                  │                                                  └─ omen_02
                                                                                  │                                                      └─ omen_03
                                                                                  │                                                          └─ farewell_01
                                                                                  │                                                              └─ farewell_02
                                                                                  │                                                                  └─ gawain_leave (leave)
                                                                                  │                                                                      └─ end_01
                                                                                  │                                                                          └─ end_node
                                                                                  └─ lose → end_failure_01
                                                                                               └─ end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
毒物事件から数日。我々はマルカンド領内の交易路巡回任務についていた。
```

#### `gawain_join`（guest_join）
**演出:** bg: bg_desert
**パラメータ:** guest_id: `npc_guest_gawain`

#### `patrol_01`（text）
**演出:** bg: bg_desert, speaker: ガウェイン
```text
「交易路だというのに、静かすぎる。すれ違うキャラバンが妙に少ない」
```

#### `patrol_02`（text）
**演出:** bg: bg_desert, speaker: ガウェイン
```text
「数日前から、多くの商人が忽然と姿を消しているという噂があるな」
```

#### `rumor_01`（text）
**演出:** bg: bg_desert
```text
砂風の向こうから、血まみれの男がよろめきながらこちらへ走ってきた。
```

#### `rumor_02`（text）
**演出:** bg: bg_desert, speaker: 血まみれの商人
```text
「助けてくれ！ 謎の賞金稼ぎどもが……我が商隊を襲撃した！」
```

#### `merchant_01`（text）
**演出:** bg: bg_desert
```text
男はそう叫ぶと崩れ落ちた。ガウェインが男の応急手当を施す。
```

#### `merchant_02`（text）
**演出:** bg: bg_desert, speaker: ガウェイン
```text
「傷は深いが命に別条はない。商隊が襲われたのはどのあたりだ？」
```

#### `plea_01`（text）
**演出:** bg: bg_desert, speaker: 血まみれの商人
```text
「あそこだ……皆殺しにされる……」
```

#### `plea_02`（text）
**演出:** bg: bg_desert, speaker: ガウェイン
```text
「新入り、行くぞ。これ以上の被害者を出すわけにはいかん」
```

#### `analysis_01`（text）
**演出:** bg: bg_desert, speaker: ガウェイン
```text
「消えた商人たちの共通点は、ローランドとの和平に反対していたことだ」
```

#### `analysis_02`（text）
**演出:** bg: bg_desert, speaker: ガウェイン
```text
「つまり、和平派にとって都合の悪い人間が、裏で消されているわけだ」
```

#### `trail_01`（text）
**演出:** bg: bg_wasteland
```text
砂漠の東へ進む。荒涼とした岩場に、破壊された荷馬車の残骸が散らばる。
```

#### `trail_02`（text）
**演出:** bg: bg_wasteland
```text
残骸の周囲には新しい足跡がある。襲撃者たちはまだ近くにいるはずだ。
```

#### `ambush_01`（text）
**演出:** bg: bg_wasteland
```text
岩陰から覗き込む。黒い装束の集団が、生存者の商人を包囲していた。
```

#### `ambush_02`（text）
**演出:** bg: bg_wasteland
```text
その集団のリーダーの腰に、見覚えのあるローランド王国の公印が見える。
```

#### `hunter_01`（text）
**演出:** bg: bg_wasteland, speaker: 暗殺部隊のリーダー
```text
「お前たちの交易はこれで終わりだ」
```

#### `hunter_02`（text）
**演出:** bg: bg_wasteland, speaker: 暗殺部隊のリーダー
```text
「王国にとって不都合な商人は、すべて砂の塵となってもらう」
```

#### `hunter_03`（text）
**演出:** bg: bg_wasteland, speaker: ガウェイン
```text
「やはり王国の息がかかった暗殺部隊か……。許すわけにはいかん！」
```

#### `hunter_04`（text）
**演出:** bg: bg_wasteland
```text
ガウェインが雄叫びと共に飛び出した。我々もそれに続いて武器を構える！
```

#### `battle`（battle）
**演出:** bg: bg_wasteland, bgm: bgm_battle
**パラメータ:** enemy_group_id: 230, next: `choice1`, fail: `end_failure_01`

#### `choice1`（choice）
**演出:** bg: bg_wasteland, bgm: bgm_battle
| 選択肢 | next_node |
|---------|-----------|
| 「迎撃する」 | `post_01` |

#### `post_01`（text）
**演出:** bg: bg_wasteland, bgm: bgm_quest_calm
```text
賞金稼ぎたちを討ち果たした。リーダーの胸元から身分証を回収する。
```

#### `post_02`（text）
**演出:** bg: bg_wasteland
```text
身分証には『ローランド聖王国第三遠征大隊・元伍長』と記されていた。
```

#### `identity_01`（text）
**演出:** bg: bg_wasteland
```text
王国が解雇した元軍人を雇い、裏で暗殺をさせていた決定的な証拠だ。
```

#### `identity_02`（text）
**演出:** bg: bg_wasteland, speaker: ガウェイン
```text
「……汚いやり方だ。国のために戦った男たちを、暗殺者に仕立てるなど」
```

#### `omen_01`（text）
**演出:** bg: bg_wasteland, speaker: ガウェイン
```text
「これは局地的な事件じゃない。本格的な戦争へのカウントダウンだ」
```

#### `omen_02`（text）
**演出:** bg: bg_wasteland, speaker: ガウェイン
```text
「王国の上層部は、何が何でもマルカンドとの開戦を望んでいるらしい」
```

#### `omen_03`（text）
**演出:** bg: bg_wasteland
```text
ガウェインの眼光は鋭く、かつてないほどの決意を秘めていた。
```

#### `farewell_01`（text）
**演出:** bg: bg_wasteland, speaker: ガウェイン
```text
「この証拠を持ち帰り、軍の良識派に告発する。時間がない、急ぐぞ」
```

#### `farewell_02`（text）
**演出:** bg: bg_wasteland, speaker: ガウェイン
```text
「お前も気をつけて戻れ。王都の影は、俺たちが思うより広い」
```

#### `gawain_leave`（leave）
**演出:** bg: bg_wasteland
**パラメータ:** guest_id: `npc_guest_gawain`

#### `end_01`（text）
**演出:** bg: bg_wasteland
```text
砂漠の風が強まる。戦争という巨大な怪物の足音が、すぐ後ろまで迫っていた。
```

#### `end_node`（end_success）
**演出:** bg: bg_wasteland
```text
真実を知ってしまった以上、もうただの傭兵としては生きられない。
```
**rewards:** Exp:150, Gold:400, Rep:10, Order:5, Items:item_pass_markand

#### `end_failure_01`（text）
**演出:** bg: bg_wasteland, bgm: bgm_quest_tense
**次ノード:** `end_failure`
```text
元軍人の組織的な連携に圧倒され、岩場に崩れ落ちる。意識が混濁する……
```

#### `end_failure`（end_failure）
**演出:** bg: bg_wasteland
```text
商隊は全滅し、王国の不正を暴く証拠も砂塵の彼方に消え去った。
```
**rewards:** Gold:0
